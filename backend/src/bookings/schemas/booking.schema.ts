import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BookingDocument = Booking & Document;

@Schema({ timestamps: true })
export class Booking {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  clientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Caregiver', required: true })
  caregiverId: Types.ObjectId;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({
    required: true,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending',
  })
  status: string;

  @Prop()
  notes: string;

  @Prop()
  totalAmount: number;

  @Prop()
  clientName: string;

  @Prop()
  clientPhone: string;

  @Prop()
  address: string;

  @Prop()
  careType: string;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);