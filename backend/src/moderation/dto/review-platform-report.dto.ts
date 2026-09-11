import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export const REVIEW_ACTIONS = [
  'none',
  'watchlist',
  'ban',
  'dismiss',
  'unban',
] as const;

export const REVIEW_STATUSES = [
  'pending',
  'under_review',
  'resolved',
  'dismissed',
] as const;

export class ReviewPlatformReportDto {
  @ApiPropertyOptional({ enum: REVIEW_STATUSES, example: 'under_review' })
  @IsOptional()
  @IsEnum(REVIEW_STATUSES)
  status?: (typeof REVIEW_STATUSES)[number];

  @ApiPropertyOptional({ enum: REVIEW_ACTIONS, example: 'watchlist' })
  @IsOptional()
  @IsEnum(REVIEW_ACTIONS)
  action?: (typeof REVIEW_ACTIONS)[number];

  @ApiPropertyOptional({ example: 'Solicitada análise adicional.' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(600)
  notes?: string;
}
