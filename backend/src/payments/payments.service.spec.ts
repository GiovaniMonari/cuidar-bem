jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid'),
}));

import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  it('returns an existing payment without creating a duplicate charge', async () => {
    const existingPayment = { _id: 'payment-1', status: 'pending' };
    const bookingsService = {
      findOne: jest.fn().mockResolvedValue({ _id: 'booking-1', totalAmount: 100 }),
    };
    const paymentModel = {
      findOne: jest.fn().mockResolvedValue(existingPayment),
    };
    const service = new PaymentsService(
      paymentModel as any,
      {} as any,
      {} as any,
      bookingsService as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    await expect(service.createPayment('booking-1')).resolves.toBe(existingPayment);
    expect(paymentModel.findOne).toHaveBeenCalledWith({ bookingId: 'booking-1' });
  });

  it('calculates the 10 percent platform fee and caregiver amount', () => {
    const service = new PaymentsService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    expect((service as any).calculateAmounts(123.45)).toEqual({
      platformFee: 12.35,
      caregiverAmount: 111.1,
    });
  });

  it('returns a webhook URL only for absolute backend URLs', () => {
    const service = new PaymentsService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    process.env.BACKEND_URL = 'https://api.example.com';
    expect((service as any).getNotificationUrl()).toBe(
      'https://api.example.com/api/payments/webhook',
    );

    process.env.BACKEND_URL = 'api.example.com';
    expect((service as any).getNotificationUrl()).toBeUndefined();
    delete process.env.BACKEND_URL;
  });
});