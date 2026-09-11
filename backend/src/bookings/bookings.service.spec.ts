import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { BookingsService } from './bookings.service';

describe('BookingsService check-in validation', () => {
  const bookingModel = { findById: jest.fn() };
  const emailProducer = {};
  const chatService = {};
  let service: BookingsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BookingsService(bookingModel as any, emailProducer as any, chatService as any);
  });

  it('allows check-in only for caregivers', async () => {
    await expect(service.checkIn('booking-1', 'user-1', 'client', -23.5, -46.6)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(bookingModel.findById).not.toHaveBeenCalled();
  });

  it('rejects missing or non-finite coordinates before database access', async () => {
    await expect(service.checkIn('booking-1', 'user-1', 'caregiver', NaN, -46.6)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.checkIn('booking-1', 'user-1', 'caregiver', -23.5, Infinity)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(bookingModel.findById).not.toHaveBeenCalled();
  });
});