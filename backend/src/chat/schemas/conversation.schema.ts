// conversation.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConversationDocument = Conversation & Document;

@Schema({ timestamps: true })
export class Conversation {
  @Prop({ type: Types.ObjectId, ref: 'Booking' })
  bookingId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  clientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  caregiverUserId: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: '' })
  lastMessage: string;

  @Prop()
  lastMessageAt: Date;

  // ⬇️ NOVOS CAMPOS
  @Prop({ type: Date })
  closedAt: Date;

  @Prop({ type: String, enum: ['cancelled', 'expired', 'completed', null], default: null })
  closedReason: string;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

// Índice único por par cliente/cuidador
ConversationSchema.index({ clientId: 1, caregiverUserId: 1 }, { unique: true });