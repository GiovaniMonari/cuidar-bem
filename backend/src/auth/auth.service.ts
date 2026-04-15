import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  private getPasswordResetExpirationMinutes() {
    const ttl = Number(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES || 30);
    return Number.isFinite(ttl) && ttl > 0 ? ttl : 30;
  }

  private buildPasswordResetUrl(token: string) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return `${frontendUrl.replace(/\/+$/, '')}/redefinir-senha?token=${token}`;
  }

  private hashPasswordResetToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private isStrongPassword(password: string) {
    if (password.length < 8) {
      return false;
    }

    const checks = [
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /\d/.test(password),
      /[^A-Za-z0-9]/.test(password),
    ].filter(Boolean).length;

    return checks >= 2;
  }

  async register(createUserDto: CreateUserDto) {
    if (createUserDto.role === 'admin') {
      throw new ForbiddenException('Contas administrativas não podem ser criadas publicamente');
    }

    const user = await this.usersService.create(createUserDto);
    const payload = { userId: user._id, email: user.email, role: user.role };

    // Enviar email de boas-vindas
    try {
      await this.emailService.sendWelcomeEmail({
        to: user.email,
        name: user.name,
        role: user.role as 'client' | 'caregiver',
      });
    } catch (error) {
      console.error('Erro ao enviar email de boas-vindas:');
    }

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        moderationStatus: user.moderationStatus,
      },
      access_token: this.jwtService.sign(payload),
    };
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (user.moderationStatus === 'banned' || !user.isActive) {
      const reason = user.banReason?.trim() || 'Violação das políticas da plataforma';
      throw new ForbiddenException({
        message: `Sua conta está banida. Motivo: ${reason}`,
        code: 'ACCOUNT_BANNED',
        banReason: reason,
        canRequestReview: true,
      });
    }

    await this.usersService.registerSuccessfulLogin(user._id.toString());

    const payload = { userId: user._id, email: user.email, role: user.role };
    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        moderationStatus: user.moderationStatus,
      },
      access_token: this.jwtService.sign(payload),
    };
  }

  async requestBanReview(email: string, message?: string) {
    return this.usersService.requestBanReview(email, message);
  }

  async requestPasswordReset(email: string) {
    const safeResponse = {
      success: true,
      message:
        'Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha em instantes.',
    };

    const user = await this.usersService.findByEmail(email.trim().toLowerCase());
    if (!user) {
      return safeResponse;
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashPasswordResetToken(rawToken);
    const expiresInMinutes = this.getPasswordResetExpirationMinutes();
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    await this.usersService.savePasswordResetToken(
      user._id.toString(),
      tokenHash,
      expiresAt,
    );

    const result = await this.emailService.sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl: this.buildPasswordResetUrl(rawToken),
      expiresInMinutes,
    });

    if (!result.success) {
      this.logger.warn(
        `Falha ao enviar email de redefinição para ${user.email}: ${result.error || 'erro desconhecido'}`,
      );
    }

    return safeResponse;
  }

  async validatePasswordResetToken(token: string) {
    const user = await this.usersService.findByValidPasswordResetToken(
      this.hashPasswordResetToken(token),
    );

    if (!user) {
      throw new BadRequestException(
        'Este link de redefinição é inválido ou expirou',
      );
    }

    return {
      valid: true,
    };
  }

  async resetPassword(token: string, password: string) {
    if (!this.isStrongPassword(password)) {
      throw new BadRequestException('Escolha uma senha mais segura');
    }

    const user = await this.usersService.findByValidPasswordResetToken(
      this.hashPasswordResetToken(token),
    );

    if (!user) {
      throw new BadRequestException(
        'Este link de redefinição é inválido ou expirou',
      );
    }

    const isSamePassword = await bcrypt.compare(password, user.password);
    if (isSamePassword) {
      throw new BadRequestException(
        'Escolha uma senha diferente da que você já utiliza',
      );
    }

    await this.usersService.resetPasswordWithToken(
      user._id.toString(),
      password,
    );

    return {
      success: true,
      message: 'Senha redefinida com sucesso!',
    };
  }
}
