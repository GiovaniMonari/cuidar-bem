import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export const USER_MODERATION_ACTIONS = [
  'ban',
  'unban',
  'watchlist',
  'clear_watch',
] as const;

export class UpdateUserModerationDto {
  @IsEnum(USER_MODERATION_ACTIONS)
  action: (typeof USER_MODERATION_ACTIONS)[number];

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason?: string;
}
