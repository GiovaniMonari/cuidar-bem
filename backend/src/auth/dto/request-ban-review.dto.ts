import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class RequestBanReviewDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}
