import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ClientDocument = Client & Document;

@Schema({ _id: true })
export class Dependent {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, min: 0, max: 130 })
  age: number;

  @Prop({ trim: true, default: '' })
  disorder: string;

  @Prop({ type: [String], default: [] })
  conditions: string[];

  @Prop({ trim: true, default: '' })
  notes: string;
}

export const DependentSchema = SchemaFactory.createForClass(Dependent);

@Schema({ _id: true })
export class SavedAddress {
  @Prop({ required: true, trim: true })
  label: string;

  @Prop({ required: true, trim: true })
  address: string;

  @Prop({ trim: true, default: '' })
  baseAddress: string;

  @Prop({ trim: true, default: '' })
  number: string;

  @Prop({ trim: true, default: '' })
  complement: string;

  @Prop({ trim: true, default: '' })
  cep: string;

  @Prop({ trim: true, default: '' })
  lat: string;

  @Prop({ trim: true, default: '' })
  lon: string;
}

export const SavedAddressSchema = SchemaFactory.createForClass(SavedAddress);

@Schema({ timestamps: true })
export class Client {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Caregiver' }],
    default: [],
  })
  favoriteCaregivers: Types.ObjectId[];

  @Prop({ type: [SavedAddressSchema], default: [] })
  savedAddresses: SavedAddress[];

  @Prop({ type: [DependentSchema], default: [] })
  savedPatients: Dependent[];

  @Prop({ type: DependentSchema, default: null })
  patientProfile: Dependent | null;
}

export const ClientSchema = SchemaFactory.createForClass(Client);
ClientSchema.index({ userId: 1 }, { unique: true });
