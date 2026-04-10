import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FeedbackDocument = Feedback & Document;

@Schema({ timestamps: true })
export class Feedback {
  @Prop({ type: Types.ObjectId, ref: 'Booking', required: true })
  bookingId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  clientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Caregiver', required: true })
  caregiverId: Types.ObjectId;

  // Tipo de serviço (para saber qual checklist foi usado)
  @Prop()
  serviceType?: string;

  // Data do feedback em relação ao serviço
  @Prop({ required: true })
  feedbackDate: Date;

  // Texto do feedback
  @Prop({ required: true })
  content: string;

  // Avaliação do paciente (opcional)
  @Prop({ min: 1, max: 5 })
  patientMood?: number;

  // ═══════════════════════════════════════════
  // CHECKLIST BÁSICO (comum a todos os serviços)
  // ═══════════════════════════════════════════

  @Prop({ default: null })
  tookMedication?: boolean;

  @Prop()
  medicationDetails?: string;

  @Prop({ default: null })
  ate?: boolean;

  @Prop()
  foodDetails?: string;

  @Prop({ default: null })
  hydration?: boolean;

  @Prop({ default: null })
  hygiene?: boolean;

  @Prop()
  hygieneDetails?: string;

  @Prop({ default: null })
  sleptWell?: boolean;

  @Prop()
  sleepDetails?: string;

  @Prop()
  behavior?: string;

  @Prop()
  behaviorDetails?: string;

  @Prop({ min: 0, max: 10, default: null })
  painLevel?: number;

  // ═══════════════════════════════════════════
  // CAMPOS PARA ACAMADO
  // ═══════════════════════════════════════════

  @Prop({ default: null })
  bathInBed?: boolean;

  @Prop()
  bathInBedDetails?: string;

  @Prop({ default: null })
  positionChange?: boolean;

  @Prop()
  positionChangeDetails?: string;

  @Prop()
  skinCondition?: string;

  @Prop()
  skinConditionDetails?: string;

  @Prop({ default: null })
  diaperChange?: boolean;

  @Prop()
  diaperChangeDetails?: string;

  // ═══════════════════════════════════════════
  // CAMPOS PARA ALZHEIMER/DEMÊNCIA
  // ═══════════════════════════════════════════

  @Prop({ default: null })
  cognitiveStimulation?: boolean;

  @Prop()
  cognitiveStimulationDetails?: string;

  @Prop()
  orientation?: string;

  @Prop()
  orientationDetails?: string;

  @Prop()
  agitation?: string;

  @Prop()
  agitationDetails?: string;

  @Prop({ default: null })
  wandering?: boolean;

  @Prop()
  wanderingDetails?: string;

  @Prop({ default: null })
  routineFollowed?: boolean;

  @Prop()
  routineFollowedDetails?: string;

  // ═══════════════════════════════════════════
  // CAMPOS PARA PCD / MOBILIDADE
  // ═══════════════════════════════════════════

  @Prop()
  mobility?: string;

  @Prop()
  mobilityDetails?: string;

  @Prop({ default: null })
  transfers?: boolean;

  @Prop()
  transfersDetails?: string;

  @Prop({ default: null })
  physiotherapy?: boolean;

  @Prop()
  physiotherapyDetails?: string;

  @Prop({ default: null })
  equipmentUsed?: boolean;

  @Prop()
  equipmentUsedDetails?: string;

  // ═══════════════════════════════════════════
  // CAMPOS PARA PCD INTELECTUAL/TEA
  // ═══════════════════════════════════════════

  @Prop()
  communication?: string;

  @Prop()
  communicationDetails?: string;

  @Prop({ default: null })
  sensoryIssues?: boolean;

  @Prop()
  sensoryIssuesDetails?: string;

  @Prop({ default: null })
  therapyActivities?: boolean;

  @Prop()
  therapyActivitiesDetails?: string;

  // ═══════════════════════════════════════════
  // CAMPOS PARA ENFERMAGEM
  // ═══════════════════════════════════════════

  @Prop({ default: null })
  injectables?: boolean;

  @Prop()
  injectablesDetails?: string;

  @Prop({ default: null })
  dressings?: boolean;

  @Prop()
  dressingsDetails?: string;

  @Prop({ default: null })
  vitalSigns?: boolean;

  @Prop()
  vitalSignsDetails?: string;

  @Prop({ default: null })
  catheterCare?: boolean;

  @Prop()
  catheterCareDetails?: string;

  @Prop()
  patientCondition?: string;

  @Prop()
  patientConditionDetails?: string;

  // ═══════════════════════════════════════════
  // CAMPOS PARA PÓS-OPERATÓRIO
  // ═══════════════════════════════════════════

  @Prop({ default: null })
  complications?: boolean;

  @Prop()
  complicationsDetails?: string;

  // ═══════════════════════════════════════════
  // CAMPOS PARA ACOMPANHAMENTO
  // ═══════════════════════════════════════════

  @Prop({ default: null })
  appointmentAttended?: boolean;

  @Prop()
  appointmentAttendedDetails?: string;

  @Prop({ default: null })
  prescriptionReceived?: boolean;

  @Prop()
  prescriptionReceivedDetails?: string;

  @Prop({ default: null })
  medicalVisit?: boolean;

  @Prop()
  medicalVisitDetails?: string;

  @Prop({ default: null })
  activityCompleted?: boolean;

  @Prop()
  activityCompletedDetails?: string;

  @Prop({ default: null })
  incidents?: boolean;

  @Prop()
  incidentsDetails?: string;

  // ═══════════════════════════════════════════
  // CAMPOS PARA PERNOITE
  // ═══════════════════════════════════════════

  @Prop({ default: null })
  bathroomVisits?: boolean;

  @Prop()
  bathroomVisitsDetails?: string;

  // ═══════════════════════════════════════════
  // CAMPOS GERAIS
  // ═══════════════════════════════════════════

  @Prop({ type: [String], default: [] })
  symptoms?: string[];

  @Prop()
  healthObservations?: string;

  @Prop({ type: [String], default: [] })
  careActivities: string[];

  @Prop({ type: [String], default: [] })
  photos: string[];

  @Prop({ default: false })
  isFinal: boolean;

  @Prop()
  dayNumber?: number;
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);

// Índices para consultas frequentes
FeedbackSchema.index({ bookingId: 1 });
FeedbackSchema.index({ caregiverId: 1 });
FeedbackSchema.index({ clientId: 1 });
FeedbackSchema.index({ bookingId: 1, dayNumber: 1 });
FeedbackSchema.index({ feedbackDate: -1 });