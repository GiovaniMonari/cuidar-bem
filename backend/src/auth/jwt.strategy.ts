import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { JwtBlacklistService } from '../redis/jwt-blacklist.service';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private jwtBlacklistService: JwtBlacklistService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET') || 'cuidar-bem-secret',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);

    // checa token individual
    if (token && await this.jwtBlacklistService.isTokenBlacklisted(token)) {
      throw new UnauthorizedException('Sessão encerrada');
    }

    // checa userId (ban)
    if (await this.jwtBlacklistService.isUserBlacklisted(payload.userId)) {
      throw new UnauthorizedException('Sua conta foi suspensa');
    }

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