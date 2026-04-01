import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument } from './schemas/booking.schema';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
  ) {}

  async create(clientId: string, dto: CreateBookingDto): Promise<BookingDocument> {
    const booking = new this.bookingModel({
      ...dto,
      clientId,
      status: 'pending',
    });
    return (await booking.save()).populate([
      { path: 'clientId', select: 'name email phone' },
      { path: 'caregiverId', populate: { path: 'userId', select: 'name email' } },
    ]);
  }

  async findByClient(clientId: string) {
    return this.bookingModel
      .find({ clientId })
      .populate({
        path: 'caregiverId',
        populate: { path: 'userId', select: 'name email phone' },
      })
      .sort({ createdAt: -1 });
  }

  async findByCaregiver(userId: string) {
    // First find caregiver by userId, then find bookings
    return this.bookingModel
      .find()
      .populate({
        path: 'caregiverId',
        match: { userId },
        populate: { path: 'userId', select: 'name email phone' },
      })
      .populate('clientId', 'name email phone')
      .sort({ createdAt: -1 })
      .then((bookings) => bookings.filter((b) => b.caregiverId));
  }

  async findByCaregiverId(caregiverId: string) {
    return this.bookingModel
      .find({ caregiverId })
      .populate('clientId', 'name email phone')
      .populate({
        path: 'caregiverId',
        populate: { path: 'userId', select: 'name email phone' },
      })
      .sort({ createdAt: -1 });
  }

  async updateStatus(id: string, userId: string, status: string, role: string) {
    const booking = await this.bookingModel.findById(id).populate('caregiverId');
    if (!booking) throw new NotFoundException('Agendamento não encontrado');

    // Check permissions
    const isClient = booking.clientId.toString() === userId;
    const isCaregiver = (booking.caregiverId as any)?.userId?.toString() === userId;

    if (!isClient && !isCaregiver) {
      throw new ForbiddenException('Sem permissão');
    }

    // Clients can cancel; caregivers can confirm, complete, or cancel
    if (role === 'client' && status !== 'cancelled') {
      throw new ForbiddenException('Clientes só podem cancelar agendamentos');
    }

    booking.status = status;
    return booking.save();
  }

  async findOne(id: string) {
    return this.bookingModel
      .findById(id)
      .populate('clientId', 'name email phone')
      .populate({
        path: 'caregiverId',
        populate: { path: 'userId', select: 'name email phone' },
      });
  }
}