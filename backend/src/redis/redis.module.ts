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
        // CORREÇÃO: Pega a URL completa da Railway ou usa o localhost como padrão
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        
        return new Redis(redisUrl, {
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
