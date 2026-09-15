import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ClientDocument = Client & Document;

@Schema({ timestamps: true })
export class Client {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Caregiver' }],
    default: [],
  })
  favoriteCaregivers: Types.ObjectId[];

  @Prop({ type: [Object], default: [] })
  savedAddresses: Record<string, unknown>[];

  @Prop({ type: [Object], default: [] })
  savedPatients: Record<string, unknown>[];
}

export const ClientSchema = SchemaFactory.createForClass(Client);
ClientSchema.index({ userId: 1 }, { unique: true });
