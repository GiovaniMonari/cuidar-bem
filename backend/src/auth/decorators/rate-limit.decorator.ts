import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rate_limit';

export interface RateLimitOptions {
  max: number;
  windowSeconds: number;
  message?: string;
}

export const RateLimit = (
  max: number,
  windowSeconds: number,
  message?: string,
) =>
  SetMetadata(RATE_LIMIT_KEY, {
    max,
    windowSeconds,
    message,
  } as RateLimitOptions);