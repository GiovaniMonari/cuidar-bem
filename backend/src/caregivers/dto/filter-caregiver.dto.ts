import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class FilterCaregiverDto {
  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  minRate?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  maxRate?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  minRating?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  minExperience?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  page?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  limit?: number;
}