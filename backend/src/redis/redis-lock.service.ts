import { Inject, Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

@Injectable()
export class RedisLockService {
  private readonly logger = new Logger(RedisLockService.name);
  private readonly DEFAULT_TTL_MS = 10000; // 10 segundos
  private readonly RETRY_DELAY_MS = 100;
  private readonly MAX_RETRIES = 30; // 3 segundos no total

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  private getLockKey(resource: string): string {
    return `lock:${resource}`;
  }

  async acquire(resource: string, ttlMs = this.DEFAULT_TTL_MS): Promise<string | null> {
    const lockKey = this.getLockKey(resource);
    const lockValue = `${Date.now()}-${Math.random()}`;

    const result = await this.redis.set(
      lockKey,
      lockValue,
      'PX',
      ttlMs,
      'NX',
    );

    if (result === 'OK') {
      return lockValue;
    }

    return null;
  }

  async acquireWithRetry(
    resource: string,
    ttlMs = this.DEFAULT_TTL_MS,
  ): Promise<string> {
    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      const lockValue = await this.acquire(resource, ttlMs);

      if (lockValue) {
        return lockValue;
      }

      this.logger.debug(
        `Lock ocupado para ${resource}, tentativa ${attempt + 1}/${this.MAX_RETRIES}`,
      );

      await new Promise((resolve) => setTimeout(resolve, this.RETRY_DELAY_MS));
    }

    throw new Error(`Não foi possível obter lock para ${resource} após ${this.MAX_RETRIES} tentativas`);
  }

  async release(resource: string, lockValue: string): Promise<void> {
    const lockKey = this.getLockKey(resource);

    // script lua garante atomicidade: só deleta se o valor for o mesmo
    // evita deletar lock de outra instância
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    await this.redis.eval(script, 1, lockKey, lockValue);
  }

  async withLock<T>(
    resource: string,
    fn: () => Promise<T>,
    ttlMs = this.DEFAULT_TTL_MS,
  ): Promise<T> {
    const lockValue = await this.acquireWithRetry(resource, ttlMs);

    try {
      return await fn();
    } finally {
      await this.release(resource, lockValue);
    }
  }
}