import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument } from './schemas/booking.schema';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  // Referência ao PaymentsService será injetada depois
  private paymentsService: any;

  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
  ) {}

  // Setter para injeção circular
  setPaymentsService(paymentsService: any) {
    this.paymentsService = paymentsService;
  }

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
    const booking = await this.bookingModel.findById(id).populate({
      path: 'caregiverId',
      populate: { path: 'userId', select: 'name email phone' },
    });
    if (!booking) throw new NotFoundException('Agendamento não encontrado');

    const isClient = booking.clientId.toString() === userId;
    const isCaregiver = (booking.caregiverId as any)?.userId?._id?.toString() === userId;

    if (!isClient && !isCaregiver) {
      throw new ForbiddenException('Sem permissão');
    }

    if (role === 'client' && status !== 'cancelled') {
      throw new ForbiddenException('Clientes só podem cancelar agendamentos');
    }

    booking.status = status;
    const saved = await booking.save();

    // Integração com pagamentos
    if (this.paymentsService) {
      try {
        if (status === 'confirmed') {
          // Cuidador aceitou → criar cobrança
          await this.paymentsService.createPayment(id);
        } else if (status === 'completed') {
          // Serviço concluído → liberar pagamento
          await this.paymentsService.releasePayment(id);
        } else if (status === 'cancelled') {
          // Cancelado → reembolsar se houver pagamento
          const payment = await this.paymentsService.findByBooking(id);
          if (payment && ['held', 'paid'].includes(payment.status)) {
            await this.paymentsService.refundPayment(id);
          }
        }
      } catch (error) {
        console.error('Erro na integração de pagamento:', error.message);
      }
    }

    return saved;
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