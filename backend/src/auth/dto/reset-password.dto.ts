import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'token-de-redefinicao' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'NovaSenhaSegura123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Escolha uma senha mais segura' })
  password: string;
}
