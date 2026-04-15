import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

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
  @IsOptional()
  @IsEnum(REVIEW_STATUSES)
  status?: (typeof REVIEW_STATUSES)[number];

  @IsOptional()
  @IsEnum(REVIEW_ACTIONS)
  action?: (typeof REVIEW_ACTIONS)[number];

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(600)
  notes?: string;
}
