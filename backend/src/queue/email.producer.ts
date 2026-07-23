import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EMAIL_QUEUE } from './queue.constants';
import {
  WelcomeEmailJob,
  PasswordResetEmailJob,
  NewBookingRequestEmailJob,
  BookingConfirmationClientEmailJob,
  BookingApprovedEmailJob,
  CaregiverCheckinEmailJob,
  ServiceCompletedClientEmailJob,
  ServiceCompletedCaregiverEmailJob,
  PaymentPendingEmailJob,
  PaymentConfirmedEmailJob,
  NewFeedbackEmailJob,
} from './email.jobs';

@Injectable()
export class EmailProducer {
  sendNewFeedbackAvailableEmail(data: any) {
      throw new Error('Method not implemented.');
  }
  async sendPaymentEmail(data: PaymentPendingEmailJob) {
    return this.sendPaymentPending(data);
  }
  private readonly logger = new Logger(EmailProducer.name);

  constructor(@InjectQueue(EMAIL_QUEUE) private readonly emailQueue: Queue) {}

  async sendWelcome(data: WelcomeEmailJob) {
    await this.emailQueue.add('welcome', data);
    this.logger.log(`Job welcome enfileirado para ${data.to}`);
  }

  async sendPasswordReset(data: PasswordResetEmailJob) {
    await this.emailQueue.add('password-reset', data);
    this.logger.log(`Job password-reset enfileirado para ${data.to}`);
  }

  async sendNewBookingRequest(data: NewBookingRequestEmailJob) {
    await this.emailQueue.add('new-booking-request', data);
    this.logger.log(`Job new-booking-request enfileirado para ${data.to}`);
  }

  async sendBookingConfirmationClient(data: BookingConfirmationClientEmailJob) {
    await this.emailQueue.add('booking-confirmation-client', data);
    this.logger.log(`Job booking-confirmation-client enfileirado para ${data.to}`);
  }

  async sendBookingApproved(data: BookingApprovedEmailJob) {
    await this.emailQueue.add('booking-approved', data);
    this.logger.log(`Job booking-approved enfileirado para ${data.to}`);
  }

  async sendCaregiverCheckin(data: CaregiverCheckinEmailJob) {
    await this.emailQueue.add('caregiver-checkin', data);
    this.logger.log(`Job caregiver-checkin enfileirado para ${data.to}`);
  }

  async sendServiceCompletedClient(data: ServiceCompletedClientEmailJob) {
    await this.emailQueue.add('service-completed-client', data);
    this.logger.log(`Job service-completed-client enfileirado para ${data.to}`);
  }

  async sendServiceCompletedCaregiver(data: ServiceCompletedCaregiverEmailJob) {
    await this.emailQueue.add('service-completed-caregiver', data);
    this.logger.log(`Job service-completed-caregiver enfileirado para ${data.to}`);
  }

  async sendPaymentPending(data: PaymentPendingEmailJob) {
    return this.enqueuePaymentEmail('payment-pending', data, `payment-pending:${data.bookingId}`);
  }

  async sendPaymentReminder(data: PaymentPendingEmailJob) {
    return this.enqueuePaymentEmail(
      'payment-reminder',
      { ...data, isReminder: true },
      `payment-reminder:${data.bookingId}`,
    );
  }

  private async enqueuePaymentEmail(
    jobName: 'payment-pending' | 'payment-reminder',
    data: PaymentPendingEmailJob,
    jobId: string,
  ) {
    await this.emailQueue.add(jobName, data, {
      jobId,
      attempts: 2,
      backoff: {
        type: 'fixed',
        delay: 10 * 60 * 1000,
      },
      removeOnComplete: false,
      removeOnFail: 100,
    });
    this.logger.log(`Job ${jobName} enfileirado para ${data.to}`);
  }

  async sendPaymentConfirmed(data: PaymentConfirmedEmailJob) {
    await this.emailQueue.add('payment-confirmed', data);
    this.logger.log(`Job payment-confirmed enfileirado para ${data.to}`);
  }

  async sendNewFeedback(data: NewFeedbackEmailJob) {
    await this.emailQueue.add('new-feedback', data);
    this.logger.log(`Job new-feedback enfileirado para ${data.to}`);
  }
}