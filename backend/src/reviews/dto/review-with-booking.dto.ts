// dto/review-with-booking.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewWithBookingDto {
  @ApiProperty({ example: '64f3b8d2c2e8e8f1a4b2c3d4' })
  _id: string;
  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  rating: number;
  @ApiPropertyOptional({ example: 'Atendimento excelente.' })
  comment?: string;
  @ApiProperty({ example: '2026-09-20T18:00:00.000Z', format: 'date-time' })
  createdAt: string;
  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  reviewer?: {
    _id: string;
    name: string;
    avatar?: string;
  };
  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  booking?: {
    _id: string;
    startDate: string;
    endDate: string;
    contractedBy: {
      _id: string;
      name: string;
      avatar?: string;
    };
  };
}