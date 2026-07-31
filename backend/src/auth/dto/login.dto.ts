import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'maria@email.com', description: 'E-mail do usuário' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456', description: 'Senha do usuário' })
  @IsString()
  @MinLength(1)
  password: string;
}