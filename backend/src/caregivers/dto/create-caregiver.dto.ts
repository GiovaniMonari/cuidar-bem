import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateCaregiverDto {
  @IsString()
  bio: string;

  @IsArray()
  @IsString({ each: true })
  specialties: string[];

  @IsNumber()
  @Min(0)
  experienceYears: number;

  @IsNumber()
  @Min(0)
  hourlyRate: number;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  availability?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certifications?: string[];

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsString()
  profileImage?: string;
}