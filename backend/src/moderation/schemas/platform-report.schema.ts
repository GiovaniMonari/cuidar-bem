import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PlatformReportDocument = PlatformReport & Document;

@Schema({ timestamps: true })
export class PlatformReport {
  @Prop({ type: Types.ObjectId, ref: 'Booking' })
  bookingId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Conversation' })
  conversationId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reporterId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reportedUserId: Types.ObjectId;

  @Prop({ required: true, enum: ['chat', 'service'] })
  source: string;

  @Prop({
    required: true,
    enum: [
      'inappropriate_behavior',
      'delay_or_no_show',
      'offensive_language',
      'fraud_attempt',
      'other',
    ],
  })
  reason: string;

  @Prop()
  description?: string;

  @Prop({ enum: ['pending', 'under_review', 'resolved', 'dismissed'], default: 'pending' })
  status: string;

  @Prop({ enum: ['none', 'watchlist', 'ban'], default: 'none' })
  autoAction: string;

  @Prop({ default: 0 })
  severityScore: number;

  @Prop({ type: Object, default: {} })
  moderationSnapshot: Record<string, any>;

  @Prop()
  adminNotes?: string;

  @Prop({ enum: ['none', 'watchlist', 'ban', 'dismiss', 'unban'], default: 'none' })
  resolvedAction: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reviewedBy?: Types.ObjectId;

  @Prop()
  reviewedAt?: Date;
}

export const PlatformReportSchema = SchemaFactory.createForClass(PlatformReport);

PlatformReportSchema.index({ reportedUserId: 1, createdAt: -1 });
PlatformReportSchema.index({ reporterId: 1, createdAt: -1 });
PlatformReportSchema.index({ source: 1, status: 1, createdAt: -1 });
PlatformReportSchema.index({ reason: 1, createdAt: -1 });
