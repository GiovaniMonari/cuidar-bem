import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EmailProducer } from './email.producer';
import { EmailWorker } from './email.worker';
import { EmailModule } from '../email/email.module';
import { EMAIL_QUEUE } from './queue.constants';

@Global()
@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        // CORREÇÃO: Passa a URL completa injetada pela Railway.
        // Se estiver em ambiente local e não encontrar a variável, usa o localhost.
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        keyPrefix: 'cuidarbem',
      },
    }),
    BullModule.registerQueue({
      name: EMAIL_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 60000,
        },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    }),
    EmailModule,
  ],
  providers: [EmailProducer, EmailWorker],
  exports: [EmailProducer],
})
export class QueueModule {}
