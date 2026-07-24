import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq'; // 👈 Importação necessária
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { Withdrawal, WithdrawalSchema } from './schemas/withdrawal.schema';
import { Caregiver, CaregiverSchema } from '../caregivers/schemas/caregiver.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { BookingsModule } from '../bookings/bookings.module';
import { CaregiversModule } from '../caregivers/caregivers.module';
import { UsersModule } from '../users/users.module';
import { EmailModule } from 'src/email/email.module';
import { PAYMENTS_QUEUE } from '../queue/queue.constants'; // 👈 Importe a constante da fila
import { QueueModule } from '../queue/queue.module'; // 👈 Importe o módulo de filas
import { RedisModule } from '../redis/redis.module';
import { MercadoPagoOAuthService } from './mercado-pago-oauth.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: Withdrawal.name, schema: WithdrawalSchema },
      { name: Caregiver.name, schema: CaregiverSchema },
      { name: User.name, schema: UserSchema },
    ]),
    // 📦 Registra a fila de pagamentos especificamente para este módulo injetar no Controller
    BullModule.registerQueue({
      name: PAYMENTS_QUEUE,
    }),
    BookingsModule,
    CaregiversModule,
    UsersModule,
    EmailModule,
    RedisModule,
    // forwardRef evita problemas de dependência circular entre o QueueModule e o PaymentsModule
    forwardRef(() => QueueModule), 
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, MercadoPagoOAuthService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
