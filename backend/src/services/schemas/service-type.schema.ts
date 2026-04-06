import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ServiceTypeDocument = ServiceType & Document;

@Schema({ timestamps: true })
export class ServiceType {
  @Prop({ required: true, unique: true })
  key: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  icon: string;

  @Prop({ required: true })
  category: string;

  @Prop({ type: [Object], required: true })
  durations: {
    key: string;
    label: string;
    description?: string;
    hours: number;
    multiplier: number;
  }[];

  @Prop({ required: true })
  basePriceMin: number;

  @Prop({ required: true })
  basePriceMax: number;

  @Prop({ required: true })
  suggestedPrice: number;

  @Prop({ type: [String], default: [] })
  includes: string[];

  @Prop({ type: [String], default: [] })
  requirements: string[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  order: number;
}

export const ServiceTypeSchema = SchemaFactory.createForClass(ServiceType);