import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ required: true, unique: true })
  transactionId: string;

  @Prop({ type: Types.ObjectId, ref: 'Booking', required: true })
  bookingId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  clientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Caregiver', required: true })
  caregiverId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ default: 0 })
  platformFee: number;

  @Prop({ default: 0 })
  caregiverAmount: number;

  @Prop({
    required: true,
    enum: [
      'pending',        // Aguardando pagamento
      'paid',           // Pago - dinheiro retido no mediador
      'held',           // Retido até conclusão do serviço
      'released',       // Liberado para o cuidador
      'refunded',       // Devolvido ao cliente
      'cancelled',      // Cancelado
      'failed',         // Falhou
    ],
    default: 'pending',
  })
  status: string;

  @Prop()
  mpPreferenceId: string;

  @Prop()
  mpPaymentId: string;

  @Prop()
  mpStatus: string;

  @Prop()
  paymentUrl: string;

  @Prop()
  qrCode: string;

  @Prop()
  qrCodeBase64: string;

  @Prop()
  pixKey: string;

  @Prop()
  paidAt: Date;

  @Prop()
  releasedAt: Date;

  @Prop()
  refundedAt: Date;

  @Prop({ type: Object })
  payerInfo: {
    email: string;
    name: string;
    cpf: string;
  };

  @Prop({ type: [Object], default: [] })
  history: {
    status: string;
    date: Date;
    description: string;
  }[];
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

PaymentSchema.index({ bookingId: 1 });
PaymentSchema.index({ mpPaymentId: 1 });
PaymentSchema.index({ transactionId: 1 });