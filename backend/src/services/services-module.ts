import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { ServiceType, ServiceTypeSchema } from './schemas/service-type.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ServiceType.name, schema: ServiceTypeSchema },
    ]),
  ],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}