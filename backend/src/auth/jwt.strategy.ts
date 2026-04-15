import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET') || 'cuidar-bem-secret',
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findRawById(payload.userId);

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    if (user.moderationStatus === 'banned' || !user.isActive) {
      const reason = user.banReason?.trim() || 'Violação das políticas da plataforma';
      throw new UnauthorizedException(`Sua conta está banida. Motivo: ${reason}`);
    }

    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      moderationStatus: user.moderationStatus,
    };
  }
}
