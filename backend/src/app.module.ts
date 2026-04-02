import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CaregiversModule } from './caregivers/caregivers.module';
import { BookingsModule } from './bookings/bookings.module';
import { ReviewsModule } from './reviews/reviews.module';
import { PaymentsModule } from './payments/payments.module';
import { EmailModule } from './email/email.module';
import { BookingsService } from './bookings/bookings.service';
import { PaymentsService } from './payments/payments.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/cuidar-bem',
    ),
    EmailModule,
    AuthModule,
    UsersModule,
    CaregiversModule,
    BookingsModule,
    ReviewsModule,
    PaymentsModule,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(
    private bookingsService: BookingsService,
    private paymentsService: PaymentsService,
  ) {}

  onModuleInit() {
    // Resolver dependência circular
    this.bookingsService.setPaymentsService(this.paymentsService);
  }
}