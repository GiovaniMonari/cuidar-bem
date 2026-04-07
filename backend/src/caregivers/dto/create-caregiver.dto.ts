import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ServicePriceDto {
  @IsString()
  serviceKey: string;

  @IsNumber()
  @Min(0)
  pricePerHour: number;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}

class AvailabilityDateDto {
  @IsString()
  date: string;

  @IsArray()
  @IsString({ each: true })
  slots: string[];

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}

export class CreateCaregiverDto {
  @IsString()
  bio: string;

  @IsArray()
  @IsString({ each: true })
  specialties: string[];

  @IsNumber()
  @Min(0)
  experienceYears: number;

  @IsNumber()
  @Min(0)
  hourlyRate: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServicePriceDto)
  servicePrices?: ServicePriceDto[];

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilityDateDto)
  availabilityCalendar?: AvailabilityDateDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certifications?: string[];

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsString()
  profileImage?: string;
}