import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class ServicePriceDto {
  @ApiProperty({ example: 'bath', description: 'Chave do serviço oferecido' })
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

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  slots?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilityTimeRangeDto)
  timeRanges?: AvailabilityTimeRangeDto[];

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}

class AvailabilityTimeRangeDto {
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  endTime: string;
}

class PayoutAccountDto {
  @IsString()
  @Matches(/^(pix|mercado_pago)$/)
  method: 'pix' | 'mercado_pago';

  @IsOptional()
  @IsString()
  @Matches(/^(cpf|cnpj|email|phone|random)$/)
  pixKeyType?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';

  @IsOptional()
  @IsString()
  pixKey?: string;
}

export class CreateCaregiverDto {
  @ApiProperty({ example: 'Cuido de idosos com atenção especial', description: 'Descrição do perfil do cuidador' })
  @IsString()
  bio: string;

  @ApiProperty({ example: ['idoso', 'companheirismo'], description: 'Especialidades do cuidador' })
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

  @IsOptional()
  @ValidateNested()
  @Type(() => PayoutAccountDto)
  payoutAccount?: PayoutAccountDto;
}
