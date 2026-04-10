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

export class CreateFeedbackDto {
  @IsNotEmpty()
  @IsString()
  bookingId: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  patientMood?: number;

  // ========== CHECKLIST BÁSICO ==========
  
  @IsOptional()
  @IsBoolean()
  tookMedication?: boolean;

  @IsOptional()
  @IsString()
  medicationDetails?: string;

  @IsOptional()
  @IsBoolean()
  ate?: boolean;

  @IsOptional()
  @IsString()
  foodDetails?: string;

  @IsOptional()
  @IsBoolean()
  hydration?: boolean;

  @IsOptional()
  @IsBoolean()
  hygiene?: boolean;

  @IsOptional()
  @IsString()
  hygieneDetails?: string;

  @IsOptional()
  @IsBoolean()
  sleptWell?: boolean;

  @IsOptional()
  @IsString()
  sleepDetails?: string;

  @IsOptional()
  @IsString()
  behavior?: string;

  @IsOptional()
  @IsString()
  behaviorDetails?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  painLevel?: number;

  // ========== CAMPOS ADICIONAIS POR TIPO DE SERVIÇO ==========

  // Acamado
  @IsOptional()
  @IsBoolean()
  bathInBed?: boolean;

  @IsOptional()
  @IsString()
  bathInBedDetails?: string;

  @IsOptional()
  @IsBoolean()
  positionChange?: boolean;

  @IsOptional()
  @IsString()
  positionChangeDetails?: string;

  @IsOptional()
  @IsString()
  skinCondition?: string;

  @IsOptional()
  @IsString()
  skinConditionDetails?: string;

  @IsOptional()
  @IsBoolean()
  diaperChange?: boolean;

  @IsOptional()
  @IsString()
  diaperChangeDetails?: string;

  // Alzheimer
  @IsOptional()
  @IsBoolean()
  cognitiveStimulation?: boolean;

  @IsOptional()
  @IsString()
  cognitiveStimulationDetails?: string;

  @IsOptional()
  @IsString()
  orientation?: string;

  @IsOptional()
  @IsString()
  orientationDetails?: string;

  @IsOptional()
  @IsString()
  agitation?: string;

  @IsOptional()
  @IsString()
  agitationDetails?: string;

  @IsOptional()
  @IsBoolean()
  wandering?: boolean;

  @IsOptional()
  @IsString()
  wanderingDetails?: string;

  @IsOptional()
  @IsBoolean()
  routineFollowed?: boolean;

  @IsOptional()
  @IsString()
  routineFollowedDetails?: string;

  // PcD / Mobilidade
  @IsOptional()
  @IsBoolean()
  mobility?: boolean;

  @IsOptional()
  @IsString()
  mobilityDetails?: string;

  @IsOptional()
  @IsBoolean()
  transfers?: boolean;

  @IsOptional()
  @IsString()
  transfersDetails?: string;

  @IsOptional()
  @IsBoolean()
  physiotherapy?: boolean;

  @IsOptional()
  @IsString()
  physiotherapyDetails?: string;

  @IsOptional()
  @IsBoolean()
  equipmentUsed?: boolean;

  @IsOptional()
  @IsString()
  equipmentUsedDetails?: string;

  // Enfermagem
  @IsOptional()
  @IsBoolean()
  injectables?: boolean;

  @IsOptional()
  @IsString()
  injectablesDetails?: string;

  @IsOptional()
  @IsBoolean()
  dressings?: boolean;

  @IsOptional()
  @IsString()
  dressingsDetails?: string;

  @IsOptional()
  @IsBoolean()
  vitalSigns?: boolean;

  @IsOptional()
  @IsString()
  vitalSignsDetails?: string;

  @IsOptional()
  @IsBoolean()
  catheterCare?: boolean;

  @IsOptional()
  @IsString()
  catheterCareDetails?: string;

  @IsOptional()
  @IsString()
  patientCondition?: string;

  @IsOptional()
  @IsString()
  patientConditionDetails?: string;

  // Pós-operatório
  @IsOptional()
  @IsBoolean()
  complications?: boolean;

  @IsOptional()
  @IsString()
  complicationsDetails?: string;

  // Acompanhamento
  @IsOptional()
  @IsBoolean()
  appointmentAttended?: boolean;

  @IsOptional()
  @IsString()
  appointmentAttendedDetails?: string;

  @IsOptional()
  @IsBoolean()
  prescriptionReceived?: boolean;

  @IsOptional()
  @IsString()
  prescriptionReceivedDetails?: string;

  @IsOptional()
  @IsBoolean()
  medicalVisit?: boolean;

  @IsOptional()
  @IsString()
  medicalVisitDetails?: string;

  @IsOptional()
  @IsBoolean()
  activityCompleted?: boolean;

  @IsOptional()
  @IsString()
  activityCompletedDetails?: string;

  @IsOptional()
  @IsBoolean()
  incidents?: boolean;

  @IsOptional()
  @IsString()
  incidentsDetails?: string;

  // Pernoite
  @IsOptional()
  @IsBoolean()
  bathroomVisits?: boolean;

  @IsOptional()
  @IsString()
  bathroomVisitsDetails?: string;

  // ========== CAMPOS GERAIS ==========

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  symptoms?: string[];

  @IsOptional()
  @IsString()
  healthObservations?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  careActivities?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];

  @IsOptional()
  @IsDateString()
  feedbackDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  dayNumber?: number;

  @IsOptional()
  @IsString()
  serviceType?: string;
}