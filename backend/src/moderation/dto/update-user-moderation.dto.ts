import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const USER_MODERATION_ACTIONS = [
  'ban',
  'unban',
  'watchlist',
  'clear_watch',
] as const;

export class UpdateUserModerationDto {
  @ApiProperty({ enum: USER_MODERATION_ACTIONS, example: 'watchlist' })
  @IsEnum(USER_MODERATION_ACTIONS)
  action: (typeof USER_MODERATION_ACTIONS)[number];

  @ApiPropertyOptional({ example: 'Comportamento reportado por outro usuário.' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason?: string;
}
