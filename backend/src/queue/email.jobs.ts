export type EmailJobName =
  | 'welcome'
  | 'password-reset'
  | 'new-booking-request'
  | 'booking-confirmation-client'
  | 'booking-approved'
  | 'caregiver-checkin'
  | 'service-completed-client'
  | 'service-completed-caregiver'
  | 'payment-pending'
  | 'payment-confirmed'
  | 'new-feedback';

export type WelcomeEmailJob = {
  to: string;
  name: string;
  role: 'client' | 'caregiver';
};

export type PasswordResetEmailJob = {
  to: string;
  name: string;
  resetUrl: string;
  expiresInMinutes: number;
};

export type NewBookingRequestEmailJob = {
  to: string;
  caregiverName: string;
  clientName: string;
  clientPhone: string;
  serviceName: string;
  durationLabel: string;
  startDate: string;
  address: string;
  totalAmount: number;
  notes?: string;
};

export type BookingConfirmationClientEmailJob = {
  to: string;
  clientName: string;
  caregiverName: string;
  serviceName: string;
  durationLabel: string;
  startDate: string;
  totalAmount: number;
};

export type BookingApprovedEmailJob = {
  to: string;
  clientName: string;
  caregiverName: string;
  serviceName: string;
  bookingDate: string;
  amount: number;
};

export type CaregiverCheckinEmailJob = {
  to: string;
  clientName: string;
  caregiverName: string;
  serviceName: string;
  address: string;
  checkInAt: string;
  distanceMeters?: number;
};

export type ServiceCompletedClientEmailJob = {
  to: string;
  clientName: string;
  caregiverName: string;
  serviceName: string;
  caregiverId: string;
  bookingId: string;
  paymentCreated?: boolean;
};

export type ServiceCompletedCaregiverEmailJob = {
  to: string;
  caregiverName: string;
  clientName: string;
  serviceName: string;
  amount: number;
  platformFee: number;
  caregiverAmount: number;
};

export type PaymentPendingEmailJob = {
  to: string;
  clientName: string;
  caregiverName: string;
  amount: number;
  paymentUrl: string;
  pixKey?: string;
  bookingDate: string;
  serviceType: string;
};

export type PaymentConfirmedEmailJob = {
  to: string;
  clientName: string;
  caregiverName: string;
  amount: number;
  bookingDate: string;
};

export type NewFeedbackEmailJob = {
  to: string;
  clientName: string;
  caregiverName: string;
  serviceName: string;
  feedbackDate: string;
  dayNumber?: number;
  isFinal: boolean;
};

export type EmailJobData =
  | { name: 'welcome'; data: WelcomeEmailJob }
  | { name: 'password-reset'; data: PasswordResetEmailJob }
  | { name: 'new-booking-request'; data: NewBookingRequestEmailJob }
  | { name: 'booking-confirmation-client'; data: BookingConfirmationClientEmailJob }
  | { name: 'booking-approved'; data: BookingApprovedEmailJob }
  | { name: 'caregiver-checkin'; data: CaregiverCheckinEmailJob }
  | { name: 'service-completed-client'; data: ServiceCompletedClientEmailJob }
  | { name: 'service-completed-caregiver'; data: ServiceCompletedCaregiverEmailJob }
  | { name: 'payment-pending'; data: PaymentPendingEmailJob }
  | { name: 'payment-confirmed'; data: PaymentConfirmedEmailJob }
  | { name: 'new-feedback'; data: NewFeedbackEmailJob };