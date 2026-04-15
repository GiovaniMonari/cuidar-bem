import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AdminActionLogDocument = AdminActionLog & Document;

@Schema({ timestamps: true })
export class AdminActionLog {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  actorId?: Types.ObjectId;

  @Prop({ enum: ['admin', 'system', 'user'], default: 'system' })
  actorType: string;

  @Prop({ required: true })
  action: string;

  @Prop({ required: true })
  targetType: string;

  @Prop()
  targetId?: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const AdminActionLogSchema = SchemaFactory.createForClass(AdminActionLog);

AdminActionLogSchema.index({ createdAt: -1 });
AdminActionLogSchema.index({ action: 1, createdAt: -1 });
