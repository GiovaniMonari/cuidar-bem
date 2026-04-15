import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, enum: ['client', 'caregiver', 'admin'] })
  role: string;

  @Prop()
  phone: string;

  @Prop()
  avatar: string;

  @Prop()
  avatarPublicId: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isOnline: boolean;

  @Prop({ enum: ['active', 'watchlist', 'banned'], default: 'active' })
  moderationStatus: string;

  @Prop({ default: 0 })
  moderationScore: number;

  @Prop()
  moderationReason: string;

  @Prop()
  banReason: string;

  @Prop({ enum: ['manual', 'automatic', null], default: null })
  banSource: string | null;

  @Prop()
  bannedAt: Date;

  @Prop()
  unbannedAt: Date;

  @Prop()
  lastModerationAt: Date;

  @Prop()
  lastLoginAt: Date;

  @Prop()
  lastSeenAt: Date;

  @Prop({ select: false })
  passwordResetTokenHash: string;

  @Prop({ select: false })
  passwordResetExpiresAt: Date;

  @Prop({ select: false })
  passwordResetRequestedAt: Date;

  @Prop({ enum: ['none', 'pending', 'accepted', 'rejected'], default: 'none' })
  reviewRequestStatus: string;

  @Prop()
  reviewRequestMessage: string;

  @Prop()
  reviewRequestedAt: Date;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Caregiver' }],
    default: [],
    ref: 'Caregiver',
  })
  favoriteCaregivers: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);
