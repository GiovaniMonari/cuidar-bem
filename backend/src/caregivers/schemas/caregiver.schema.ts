import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CaregiverDocument = Caregiver & Document;

class ServicePrice {
  @Prop({ required: true })
  serviceKey: string;

  @Prop({ required: true, min: 0 })
  pricePerHour: number;

  @Prop({ default: true })
  isAvailable: boolean;
}

class AvailabilityDate {
  @Prop({ required: true })
  date: string; // YYYY-MM-DD

  @Prop({
    type: [String],
    enum: ['manha', 'tarde', 'noite', 'integral'],
    default: [],
  })
  slots: string[];

  @Prop({ default: true })
  isAvailable: boolean;
}

@Schema({ timestamps: true })
export class Caregiver {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  bio: string;

  @Prop({
    type: [String],
    enum: [
      'cuidado_idosos',
      'cuidado_deficiencia',
      'fisioterapia',
      'enfermagem',
      'companhia',
      'higiene_pessoal',
      'medicacao',
      'mobilidade',
    ],
  })
  specialties: string[];

  @Prop({ required: true, min: 0 })
  experienceYears: number;

  @Prop({ required: true, min: 0 })
  hourlyRate: number;

  @Prop({ type: [ServicePrice], default: [] })
  servicePrices: ServicePrice[];

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  state: string;

  // substitui availability por calendário real
  @Prop({ type: [AvailabilityDate], default: [] })
  availabilityCalendar: AvailabilityDate[];

  @Prop({ type: [String] })
  certifications: string[];

  @Prop({ default: 0 })
  rating: number;

  @Prop({ default: 0 })
  reviewCount: number;

  @Prop({ default: true })
  isAvailable: boolean;

  @Prop()
  profileImage: string;
}

export const CaregiverSchema = SchemaFactory.createForClass(Caregiver);

CaregiverSchema.index({ city: 1, state: 1 });
CaregiverSchema.index({ specialties: 1 });
CaregiverSchema.index({ rating: -1 });
CaregiverSchema.index({ hourlyRate: 1 });
CaregiverSchema.index({ 'availabilityCalendar.date': 1 });