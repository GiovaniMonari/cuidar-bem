import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

@Injectable()
export class JwtBlacklistService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  // blacklist por token individual (logout manual)
  async addToken(token: string, expiresInSeconds: number): Promise<void> {
    await this.redis.set(
      `jwt:blacklist:token:${token}`,
      '1',
      'EX',
      expiresInSeconds,
    );
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const result = await this.redis.get(`jwt:blacklist:token:${token}`);
    return result !== null;
  }

  // blacklist por userId (ban, força logout de todos os tokens do usuário)
  async addUser(userId: string, expiresInSeconds: number): Promise<void> {
    await this.redis.set(
      `jwt:blacklist:user:${userId}`,
      '1',
      'EX',
      expiresInSeconds,
    );
  }

  async isUserBlacklisted(userId: string): Promise<boolean> {
    const result = await this.redis.get(`jwt:blacklist:user:${userId}`);
    return result !== null;
  }

  async removeUser(userId: string): Promise<void> {
    await this.redis.del(`jwt:blacklist:user:${userId}`);
  }
}