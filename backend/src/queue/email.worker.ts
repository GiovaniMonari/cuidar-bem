import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { EmailService } from '../email/email.service';
import { EMAIL_QUEUE } from './queue.constants';

@Processor(EMAIL_QUEUE)
export class EmailWorker extends WorkerHost {
  private readonly logger = new Logger(EmailWorker.name);

  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processando job ${job.name} id=${job.id}`);

    switch (job.name) {
      case 'welcome':
        await this.emailService.sendWelcomeEmail(job.data);
        break;
      case 'password-reset':
        await this.emailService.sendPasswordResetEmail(job.data);
        break;
      case 'new-booking-request':
        await this.emailService.sendNewBookingRequestEmail(job.data);
        break;
      case 'booking-confirmation-client':
        await this.emailService.sendBookingConfirmationToClientEmail(job.data);
        break;
      case 'booking-approved':
        await this.emailService.sendBookingApprovedEmail(job.data);
        break;
      case 'caregiver-checkin':
        await this.emailService.sendCaregiverCheckInEmail(job.data);
        break;
      case 'service-completed-client':
        await this.emailService.sendServiceCompletedToClientEmail(job.data);
        break;
      case 'service-completed-caregiver':
        await this.emailService.sendServiceCompletedToCaregiverEmail(job.data);
        break;
      case 'payment-pending':
        await this.emailService.sendPaymentEmail(job.data);
        break;
      case 'payment-confirmed':
        await this.emailService.sendPaymentConfirmedEmail(job.data);
        break;
      case 'new-feedback':
        await this.emailService.sendNewFeedbackAvailableEmail(job.data);
        break;
      default:
        this.logger.warn(`Job desconhecido: ${job.name}`);
    }

    this.logger.log(`Job ${job.name} id=${job.id} concluído`);
  }
}