import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CaregiverDocument = Caregiver & Document;

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

  // Preço base por hora (mantido para compatibilidade)
  @Prop({ required: true, min: 0 })
  hourlyRate: number;

  // NOVO: Preços por tipo de serviço
  @Prop({
    type: [Object],
    default: [],
  })
  servicePrices: {
    serviceKey: string;
    pricePerHour: number;
    isAvailable: boolean;
  }[];

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  state: string;

  @Prop({ type: [String] })
  availability: string[];

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