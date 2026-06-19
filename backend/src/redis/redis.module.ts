import { Module } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';
import { JwtBlacklistService } from './jwt-blacklist.service';
import { RedisLockService } from './redis-lock.service';

@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: () => {
        return new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          keyPrefix: 'cuidarbem:',
        });
      },
    },
    JwtBlacklistService,
    RedisLockService,
  ],
  exports: [REDIS_CLIENT, JwtBlacklistService, RedisLockService],
})
export class RedisModule {}