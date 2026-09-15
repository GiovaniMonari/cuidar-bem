import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  IsBoolean,
  Equals,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({ example: '64f3b8d2c2e8e8f1a4b2c3d4', description: 'ID do cuidador selecionado' })
  @IsString()
  @IsNotEmpty()
  caregiverId: string;

  @ApiProperty({ example: 'companionship', description: 'Tipo do serviço' })
  @IsString()
  @IsNotEmpty()
  serviceType: string;

  @IsOptional()
  @ApiPropertyOptional({ example: 'Banho e companhia' })
  @IsString()
  serviceName?: string;

  @IsString()
  @ApiProperty({ example: 'full_day' })
  @IsNotEmpty()
  durationKey: string;

  @IsOptional()
  @ApiPropertyOptional({ example: 'Dia inteiro' })
  @IsString()
  durationLabel?: string;

  @IsNumber()
  @ApiProperty({ example: 8, minimum: 1 })
  @Min(1)
  durationHours: number;

  @IsNumber()
  @ApiProperty({ example: 35, minimum: 0 })
  @Min(0)
  pricePerHour: number;

  @IsNumber()
  @ApiProperty({ example: 280, minimum: 0 })
  @Min(0)
  totalAmount: number;

  @IsOptional()
  @ApiPropertyOptional({ example: 20, minimum: 0 })
  @IsNumber()
  discount?: number;

  @IsDateString()
  @ApiProperty({ example: '2026-09-20T08:00:00.000Z', format: 'date-time' })
  startDate: string;

  @IsOptional()
  @ApiPropertyOptional({ example: '2026-09-20T16:00:00.000Z', format: 'date-time' })
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @ApiPropertyOptional({ example: 'Acompanhar rotina da manhã.' })
  @IsString()
  notes?: string;

  @IsOptional()
  @ApiPropertyOptional({ example: 'Maria da Silva' })
  @IsString()
  clientName!: string;

  @IsOptional()
  @ApiPropertyOptional({ example: '(11) 99999-9999' })
  @IsString()
  clientPhone!: string;

  @IsOptional()
  @ApiPropertyOptional({ example: 'Av. Paulista, 1000, São Paulo - SP' })
  @IsString()
  address?: string;

  @IsOptional()
  @ApiPropertyOptional({ example: -23.5613, type: Number })
  @Type(() => Number)
  @IsNumber()
  addressLat?: number;

  @IsOptional()
  @ApiPropertyOptional({ example: -46.6565, type: Number })
  @Type(() => Number)
  @IsNumber()
  addressLon?: number;

  @IsOptional()
  @ApiPropertyOptional({ example: 'João da Silva' })
  @IsString()
  patientName!: string;

  @IsOptional()
  @ApiPropertyOptional({ example: 78, type: Number })
  @IsNumber()
  patientAge!: number;

  @IsOptional()
  @ApiPropertyOptional({ example: 'Mobilidade reduzida' })
  @IsString()
  patientCondition!: string;

  @IsOptional()
  @ApiPropertyOptional({ example: ['medicação às 10h', 'auxílio para caminhar'] })
  @IsArray()
  @IsString({ each: true })
  specialRequirements?: string[];

  @ApiProperty({
    description: 'Confirmação de ciência sobre a responsabilidade pelo atendimento',
    example: true,
  })
  @IsBoolean()
  @Equals(true, { message: 'É necessário aceitar o contrato de consentimento.' })
  serviceConsentAccepted: boolean;
}
