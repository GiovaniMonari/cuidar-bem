import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RATE_LIMIT_KEY, RateLimitOptions } from '../decorators/rate-limit.decorator';
import { RateLimitService } from '../services/rate-limit.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimitService: RateLimitService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.get<RateLimitOptions>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );

    // Sem decorator na rota: deixa passar
    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const ip = this.rateLimitService.extractIp(request);
    const route = `${request.method}:${request.path}`;
    const key = `${route}:${ip}`;

    const result = await this.rateLimitService.check(
      key,
      options.max,
      options.windowSeconds,
    );

    // Adiciona headers informativos (padrão da indústria)
    response.header('X-RateLimit-Limit', options.max);
    response.header('X-RateLimit-Remaining', Math.max(0, options.max - result.current));
    response.header('X-RateLimit-Reset', result.resetInSeconds);

    if (!result.allowed) {
      this.logger.warn(
        `Rate limit excedido: ${ip} em ${route} (${result.current}/${options.max})`,
      );

      const message =
        options.message ||
        `Muitas tentativas. Aguarde ${result.resetInSeconds} segundos antes de tentar novamente.`;

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message,
          retryAfterSeconds: result.resetInSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}