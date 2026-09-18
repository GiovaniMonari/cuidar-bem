import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RequestBanReviewDto {
  @ApiProperty({ example: 'usuario@exemplo.com', description: 'E-mail da conta bloqueada' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'Minha conta foi bloqueada por engano.', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}
