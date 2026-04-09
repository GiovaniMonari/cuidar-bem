import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class CheckInBookingDto {
  @Type(() => Number)
  @IsNumber()
  latitude: number;

  @Type(() => Number)
  @IsNumber()
  longitude: number;
}
