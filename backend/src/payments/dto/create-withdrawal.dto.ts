import { IsNumber, Min } from 'class-validator';

export class CreateWithdrawalDto {
  @IsNumber()
  @Min(0.01)
  amount: number;
}