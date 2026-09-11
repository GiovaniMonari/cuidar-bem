import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWithdrawalDto {
  @ApiProperty({ example: 150.5, minimum: 0.01, description: 'Valor do saque em reais' })
  @IsNumber()
  @Min(0.01)
  amount: number;
}