import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { Booking, BookingSchema } from './schemas/booking.schema';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Booking.name, schema: BookingSchema }]),
    EmailModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}