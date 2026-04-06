import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BookingDocument = Booking & Document;

@Schema({ timestamps: true })
export class Booking {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  clientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Caregiver', required: true })
  caregiverId: Types.ObjectId;

  // NOVO: Tipo de serviço
  @Prop({ required: true })
  serviceType: string;

  @Prop()
  serviceName: string;

  // NOVO: Duração selecionada
  @Prop({ required: true })
  durationKey: string;

  @Prop({ required: true })
  durationHours: number;

  @Prop()
  durationLabel: string;

  // NOVO: Preços calculados
  @Prop({ required: true })
  pricePerHour: number;

  @Prop({ required: true })
  totalAmount: number;

  @Prop({ default: 0 })
  discount: number;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({
    required: true,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
    default: 'pending',
  })
  status: string;

  @Prop()
  notes: string;

  @Prop()
  clientName: string;

  @Prop()
  clientPhone: string;

  @Prop()
  address: string;

  @Prop()
  patientName: string;

  @Prop()
  patientAge: number;

  @Prop()
  patientCondition: string;

  @Prop({ type: [String], default: [] })
  specialRequirements: string[];
}

export const BookingSchema = SchemaFactory.createForClass(Booking);