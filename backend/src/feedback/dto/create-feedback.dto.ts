import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  Min, 
  Max, 
  IsArray, 
  IsDateString, 
  IsBoolean, 
  IsNumber 
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFeedbackDto {
  @ApiProperty({ example: '64f3b8d2c2e8e8f1a4b2c3d4' })
  @IsNotEmpty()
  @IsString()
  bookingId: string;

  @ApiProperty({ example: 'Paciente passou bem durante o período.' })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiPropertyOptional({ example: 5, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  patientMood?: number;

  // ========== CHECKLIST BÁSICO ==========
  
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  tookMedication?: boolean;

  @ApiPropertyOptional({ example: 'Tomou medicação da manhã.' })
  @IsOptional()
  @IsString()
  medicationDetails?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  ate?: boolean;

  @ApiPropertyOptional({ example: 'Alimentou-se no almoço.' })
  @IsOptional()
  @IsString()
  foodDetails?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  hydration?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  hygiene?: boolean;

  @ApiPropertyOptional({ example: 'Higiene realizada.' })
  @IsOptional()
  @IsString()
  hygieneDetails?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  sleptWell?: boolean;

  @ApiPropertyOptional({ example: 'Sono tranquilo.' })
  @IsOptional()
  @IsString()
  sleepDetails?: string;

  @ApiPropertyOptional({ example: 'Calmo e colaborativo.' })
  @IsOptional()
  @IsString()
  behavior?: string;

  @ApiPropertyOptional({ example: 'Sem alterações de comportamento.' })
  @IsOptional()
  @IsString()
  behaviorDetails?: string;

  @ApiPropertyOptional({ example: 1, minimum: 0, maximum: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  painLevel?: number;

  // ========== CAMPOS ADICIONAIS POR TIPO DE SERVIÇO ==========

  // Acamado
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  bathInBed?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bathInBedDetails?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  positionChange?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  positionChangeDetails?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  skinCondition?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  skinConditionDetails?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  diaperChange?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  diaperChangeDetails?: string;

  // Alzheimer
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  cognitiveStimulation?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cognitiveStimulationDetails?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orientation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orientationDetails?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  agitation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  agitationDetails?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  wandering?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  wanderingDetails?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  routineFollowed?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  routineFollowedDetails?: string;

  // PcD / Mobilidade
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  mobility?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mobilityDetails?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  transfers?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  transfersDetails?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  physiotherapy?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  physiotherapyDetails?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  equipmentUsed?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  equipmentUsedDetails?: string;

  // Enfermagem
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  injectables?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  injectablesDetails?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  dressings?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dressingsDetails?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  vitalSigns?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vitalSignsDetails?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  catheterCare?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  catheterCareDetails?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  patientCondition?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  patientConditionDetails?: string;

  // Pós-operatório
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  complications?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  complicationsDetails?: string;

  // Acompanhamento
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  appointmentAttended?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  appointmentAttendedDetails?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  prescriptionReceived?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  prescriptionReceivedDetails?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  medicalVisit?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  medicalVisitDetails?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  activityCompleted?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  activityCompletedDetails?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  incidents?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  incidentsDetails?: string;

  // Pernoite
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  bathroomVisits?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bathroomVisitsDetails?: string;

  // ========== CAMPOS GERAIS ==========

  @ApiPropertyOptional({ type: [String], example: ['cansaço'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  symptoms?: string[];

  @ApiPropertyOptional({ example: 'Sem observações adicionais.' })
  @IsOptional()
  @IsString()
  healthObservations?: string;

  @ApiPropertyOptional({ type: [String], example: ['caminhada'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  careActivities?: string[];

  @ApiPropertyOptional({ type: [String], example: ['https://example.com/photo.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];

  @ApiPropertyOptional({ example: '2026-09-20', format: 'date' })
  @IsOptional()
  @IsDateString()
  feedbackDate?: string;

  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  dayNumber?: number;

  @ApiPropertyOptional({ example: 'acompanhamento' })
  @IsOptional()
  @IsString()
  serviceType?: string;
}