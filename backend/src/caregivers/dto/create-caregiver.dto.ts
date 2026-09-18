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
  @ApiProperty({ example: 40, minimum: 0 })
  @Min(0)
  pricePerHour: number;

  @IsOptional()
  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  isAvailable?: boolean;
}

class AvailabilityDateDto {
  @ApiProperty({ example: '2026-09-20' })
  @IsString()
  date: string;

  @IsOptional()
  @ApiPropertyOptional({ example: ['08:00', '09:00'] })
  @IsArray()
  @IsString({ each: true })
  slots?: string[];

  @IsOptional()
  @ApiPropertyOptional({ type: 'array', items: { type: 'object' } })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilityTimeRangeDto)
  timeRanges?: AvailabilityTimeRangeDto[];

  @IsOptional()
  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  isAvailable?: boolean;
}

class AvailabilityTimeRangeDto {
  @ApiProperty({ example: '08:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime: string;

  @ApiProperty({ example: '12:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  endTime: string;
}

class PayoutAccountDto {
  @ApiProperty({ enum: ['pix', 'mercado_pago'], example: 'pix' })
  @IsString()
  @Matches(/^(pix|mercado_pago)$/)
  method: 'pix' | 'mercado_pago';

  @IsOptional()
  @ApiPropertyOptional({ enum: ['cpf', 'cnpj', 'email', 'phone', 'random'], example: 'email' })
  @IsString()
  @Matches(/^(cpf|cnpj|email|phone|random)$/)
  pixKeyType?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';

  @IsOptional()
  @ApiPropertyOptional({ example: 'contato@exemplo.com' })
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
  @ApiProperty({ example: 5, minimum: 0 })
  @Min(0)
  experienceYears: number;

  @IsNumber()
  @ApiProperty({ example: 35, minimum: 0 })
  @Min(0)
  hourlyRate: number;

  @IsOptional()
  @ApiPropertyOptional({ type: [ServicePriceDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServicePriceDto)
  servicePrices?: ServicePriceDto[];

  @IsString()
  @ApiProperty({ example: 'São Paulo' })
  city: string;

  @IsString()
  @ApiProperty({ example: 'SP' })
  state: string;

  @IsOptional()
  @ApiPropertyOptional({ type: [AvailabilityDateDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilityDateDto)
  availabilityCalendar?: AvailabilityDateDto[];

  @IsOptional()
  @ApiPropertyOptional({ example: ['Enfermagem', 'Primeiros socorros'] })
  @IsArray()
  @IsString({ each: true })
  certifications?: string[];

  @IsOptional()
  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/demo/image/upload/profile.jpg' })
  @IsString()
  profileImage?: string;

  @IsOptional()
  @ApiPropertyOptional({ type: PayoutAccountDto })
  @ValidateNested()
  @Type(() => PayoutAccountDto)
  payoutAccount?: PayoutAccountDto;
}
