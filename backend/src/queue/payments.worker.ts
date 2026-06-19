// crie em src/queue/payments.worker.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PAYMENTS_QUEUE } from './queue.constants';
import { PaymentsService } from '../payments/payments.service';

@Processor(PAYMENTS_QUEUE)
export class PaymentsWorker extends WorkerHost {
  private readonly logger = new Logger(PaymentsWorker.name);

  constructor(private readonly paymentsService: PaymentsService) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processando Webhook de Pagamento ID: ${job.id}`);

    if (job.name === 'process-payment-update') {
      const { paymentId } = job.data;

      await this.paymentsService.processPaymentStatusChange(paymentId);
    }
  }
}
