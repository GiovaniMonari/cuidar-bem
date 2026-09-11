import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckInBookingDto {
  @ApiProperty({ example: -23.5613, description: 'Latitude do local do check-in' })
  @Type(() => Number)
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: -46.6565, description: 'Longitude do local do check-in' })
  @Type(() => Number)
  @IsNumber()
  longitude: number;
}
