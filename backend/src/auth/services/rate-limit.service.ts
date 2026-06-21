import { Inject, Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../../redis/redis.constants';

export interface RateLimitResult {
  allowed: boolean;
  current: number;
  max: number;
  resetInSeconds: number;
}

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async check(
    key: string,
    max: number,
    windowSeconds: number,
  ): Promise<RateLimitResult> {
    const redisKey = `ratelimit:${key}`;

    try {
      // INCR atômico: incrementa e define TTL somente na primeira chamada
      const current = await this.redis.incr(redisKey);

      if (current === 1) {
        // Primeira requisição nessa janela: define o TTL
        await this.redis.expire(redisKey, windowSeconds);
      }

      const ttl = await this.redis.ttl(redisKey);
      const resetInSeconds = ttl > 0 ? ttl : windowSeconds;

      return {
        allowed: current <= max,
        current,
        max,
        resetInSeconds,
      };
    } catch (error) {
      // Se o Redis estiver fora, deixa passar para não bloquear o serviço
      this.logger.error(`Erro ao checar rate limit para ${key}: ${error}`);
      return { allowed: true, current: 0, max, resetInSeconds: windowSeconds };
    }
  }

  // Extrai o IP real considerando proxies (Railway usa proxy reverso)
  extractIp(request: any): string {
    const forwarded = request.headers['x-forwarded-for'];

    if (forwarded) {
      // x-forwarded-for pode ter múltiplos IPs: "client, proxy1, proxy2"
      return forwarded.split(',')[0].trim();
    }

    return (
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      'unknown'
    );
  }
}