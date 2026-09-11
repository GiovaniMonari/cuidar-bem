import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'maria@email.com', description: 'E-mail da conta' })
  @IsEmail({}, { message: 'Digite um e-mail válido' })
  email: string;
}
