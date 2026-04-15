import {
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export const PLATFORM_REPORT_REASONS = [
  'inappropriate_behavior',
  'delay_or_no_show',
  'offensive_language',
  'fraud_attempt',
  'other',
] as const;

export const PLATFORM_REPORT_SOURCES = ['chat', 'service'] as const;

export class CreatePlatformReportDto {
  @IsEnum(PLATFORM_REPORT_SOURCES)
  source: (typeof PLATFORM_REPORT_SOURCES)[number];

  @IsOptional()
  @IsMongoId()
  bookingId?: string;

  @IsOptional()
  @IsMongoId()
  conversationId?: string;

  @IsEnum(PLATFORM_REPORT_REASONS)
  reason: (typeof PLATFORM_REPORT_REASONS)[number];

  @ValidateIf((dto) => dto.reason === 'other' || !!dto.description)
  @IsString()
  @MinLength(5)
  @MaxLength(600)
  description?: string;
}
