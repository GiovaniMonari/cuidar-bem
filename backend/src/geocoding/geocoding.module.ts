// src/geocoding/geocoding.module.ts
import { Module } from '@nestjs/common';
import { GeocodingService } from './geocoding.service';
import { GeocodingController } from './geocoding.controller';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports:[RedisModule],
  controllers: [GeocodingController],
  providers: [GeocodingService],
  exports: [GeocodingService],
})
export class GeocodingModule {}