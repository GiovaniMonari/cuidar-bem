import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateResetTokenDto {
  @ApiProperty({ example: 'token-de-redefinicao' })
  @IsString()
  @IsNotEmpty()
  token: string;
}
