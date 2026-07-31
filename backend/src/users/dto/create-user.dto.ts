import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'Maria da Silva', description: 'Nome completo do usuário' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'maria@email.com', description: 'E-mail único do usuário' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456', minLength: 6, description: 'Senha do usuário' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'client', description: 'Perfil do usuário', enum: ['client', 'caregiver'] })
  @IsEnum(['client', 'caregiver'])
  role: string;

  @ApiPropertyOptional({ example: '(11) 99999-9999', description: 'Telefone de contato' })
  @IsOptional()
  @IsString()
  phone?: string;
}