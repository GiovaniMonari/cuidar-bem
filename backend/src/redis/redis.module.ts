import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';
import { JwtBlacklistService } from './jwt-blacklist.service';
import { RedisLockService } from './redis-lock.service';
import { RateLimitService } from '../auth/services/rate-limit.service';
import { RateLimitGuard } from '../auth/guards/rate-limit.guard';

@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: () => {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

        return new Redis(redisUrl, {
          keyPrefix: 'cuidarbem:',
        });
      },
    },
    JwtBlacklistService,
    RedisLockService,
    RateLimitService,
    RateLimitGuard,
    Reflector,
  ],
  exports: [
    REDIS_CLIENT,
    JwtBlacklistService,
    RedisLockService,
    RateLimitService,
    RateLimitGuard,
  ],
})
export class RedisModule {}