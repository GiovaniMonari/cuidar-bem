import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WithdrawalDocument = Withdrawal & Document;

@Schema({ timestamps: true })
export class Withdrawal {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  caregiverId: Types.ObjectId;

  @Prop({ required: true, min: 0.01 })
  amount: number;

  @Prop({ required: true, enum: ['pix', 'mercado_pago'] })
  method: 'pix' | 'mercado_pago';

  @Prop({ type: Object, required: true })
  payoutAccount: {
    method: 'pix' | 'mercado_pago';
    pixKeyType?: string;
    pixKey?: string;
  };

  @Prop({
    required: true,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  })
  status: string;

  @Prop()
  processedAt?: Date;

  @Prop()
  failureReason?: string;
}

export const WithdrawalSchema = SchemaFactory.createForClass(Withdrawal);
WithdrawalSchema.index({ caregiverId: 1, status: 1, createdAt: -1 });