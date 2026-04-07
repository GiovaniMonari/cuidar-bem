import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  Min,
} from 'class-validator';

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  caregiverId: string;

  @IsString()
  @IsNotEmpty()
  serviceType: string;

  @IsOptional()
  @IsString()
  serviceName?: string;

  @IsString()
  @IsNotEmpty()
  durationKey: string;

  @IsOptional()
  @IsString()
  durationLabel?: string;

  @IsNumber()
  @Min(1)
  durationHours: number;

  @IsNumber()
  @Min(0)
  pricePerHour: number;

  @IsNumber()
  @Min(0)
  totalAmount: number;

  @IsOptional()
  @IsNumber()
  discount?: number;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  clientName?: string;

  @IsOptional()
  @IsString()
  clientPhone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  patientName?: string;

  @IsOptional()
  @IsNumber()
  patientAge?: number;

  @IsOptional()
  @IsString()
  patientCondition?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialRequirements?: string[];
}