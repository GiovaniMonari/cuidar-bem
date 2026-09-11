import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ example: '64f3b8d2c2e8e8f1a4b2c3d4' })
  @IsString()
  @IsNotEmpty()
  caregiverId: string;

  @ApiPropertyOptional({ example: '64f3b8d2c2e8e8f1a4b2c3d4' })
  @IsOptional()
  @IsString()
  bookingId?: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ example: 'Atendimento cuidadoso e pontual.' })
  @IsString()
  @IsNotEmpty()
  comment: string;
}