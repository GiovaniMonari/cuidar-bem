import {
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const PLATFORM_REPORT_REASONS = [
  'inappropriate_behavior',
  'delay_or_no_show',
  'offensive_language',
  'fraud_attempt',
  'other',
] as const;

export const PLATFORM_REPORT_SOURCES = ['chat', 'service'] as const;

export class CreatePlatformReportDto {
  @ApiProperty({ enum: PLATFORM_REPORT_SOURCES, example: 'service' })
  @IsEnum(PLATFORM_REPORT_SOURCES)
  source: (typeof PLATFORM_REPORT_SOURCES)[number];

  @ApiPropertyOptional({ example: '64f3b8d2c2e8e8f1a4b2c3d4' })
  @IsOptional()
  @IsMongoId()
  bookingId?: string;

  @ApiPropertyOptional({ example: '64f3b8d2c2e8e8f1a4b2c3d4' })
  @IsOptional()
  @IsMongoId()
  conversationId?: string;

  @ApiProperty({ enum: PLATFORM_REPORT_REASONS, example: 'delay_or_no_show' })
  @IsEnum(PLATFORM_REPORT_REASONS)
  reason: (typeof PLATFORM_REPORT_REASONS)[number];

  @ApiPropertyOptional({ example: 'O cuidador não compareceu ao atendimento.' })
  @ValidateIf((dto) => dto.reason === 'other' || !!dto.description)
  @IsString()
  @MinLength(5)
  @MaxLength(600)
  description?: string;
}
