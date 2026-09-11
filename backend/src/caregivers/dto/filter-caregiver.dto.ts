import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterCaregiverDto {
  @ApiPropertyOptional({ example: 'São Paulo' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'SP' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: 'idoso' })
  @IsOptional()
  @IsString()
  specialty?: string;

  @ApiPropertyOptional({ example: 20, type: Number, minimum: 0 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  minRate?: number;

  @ApiPropertyOptional({ example: 100, type: Number, minimum: 0 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  maxRate?: number;

  @ApiPropertyOptional({ example: 4, type: Number, minimum: 0 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  minRating?: number;

  @ApiPropertyOptional({ example: 2, type: Number, minimum: 0 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  minExperience?: number;

  @ApiPropertyOptional({ example: 'Maria' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 1, type: Number, minimum: 1 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ example: 20, type: Number, minimum: 1 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  limit?: number;
}