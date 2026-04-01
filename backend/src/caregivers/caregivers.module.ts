import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CaregiversService } from './caregivers.service';
import { CaregiversController } from './caregivers.controller';
import { Caregiver, CaregiverSchema } from './schemas/caregiver.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Caregiver.name, schema: CaregiverSchema }]),
  ],
  controllers: [CaregiversController],
  providers: [CaregiversService],
  exports: [CaregiversService],
})
export class CaregiversModule {}