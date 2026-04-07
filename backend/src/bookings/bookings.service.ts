import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument } from './schemas/booking.schema';
import { CreateBookingDto } from './dto/create-booking.dto';
import { EmailService } from '../email/email.service';
import { ChatService } from '../chat/chat.service';
import { getDatesInRange } from '../common/utils/date-range';

@Injectable()
export class BookingsService {
  private paymentsService: any;

  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    private emailService: EmailService,
    @Inject(forwardRef(() => ChatService))
    private chatService: ChatService,
  ) {}

  setPaymentsService(paymentsService: any) {
    this.paymentsService = paymentsService;
  }

  async create(clientId: string, dto: CreateBookingDto, clientUser: any): Promise<BookingDocument> {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new ForbiddenException('Datas inválidas para o agendamento.');
    }

    if (end < start) {
      throw new ForbiddenException('A data final não pode ser anterior à inicial.');
    }

    const caregiverModelAny: any = this.bookingModel.db.model('Caregiver');
    const caregiver = await caregiverModelAny.findById(dto.caregiverId).populate('userId');

    if (!caregiver) {
      throw new NotFoundException('Cuidador não encontrado');
    }

    const selectedService = caregiver.servicePrices?.find(
      (service: any) =>
        service.serviceKey === dto.serviceType && service.isAvailable,
    );

    if (!selectedService) {
      throw new ForbiddenException(
        'Este cuidador não oferece o serviço selecionado.',
      );
    }

    if (Number(selectedService.pricePerHour) !== Number(dto.pricePerHour)) {
      throw new ForbiddenException(
        'O valor informado não corresponde ao preço atual do cuidador para este serviço.',
      );
    }

    const bookingDates = getDatesInRange(start, end);

    const availableDates = caregiver.availabilityCalendar || [];
    const availableDateStrings = availableDates
      .filter((item: any) => item.isAvailable)
      .map((item: any) => item.date);

    const unavailableDates = bookingDates.filter(
      (date) => !availableDateStrings.includes(date),
    );

    if (unavailableDates.length > 0) {
      throw new ForbiddenException(
        `O cuidador não está disponível para todas as datas do período. Datas indisponíveis: ${unavailableDates.join(', ')}`,
      );
    }

    const existingBookings = await this.bookingModel.find({
      caregiverId: dto.caregiverId,
      status: { $in: ['pending', 'confirmed', 'in_progress'] },
      $or: [
        {
          startDate: { $lte: end },
          endDate: { $gte: start },
        },
      ],
    });

    if (existingBookings.length > 0) {
      throw new ForbiddenException(
        'Este cuidador já possui agendamento em uma ou mais datas deste período.',
      );
    }

    const booking = new this.bookingModel({
      ...dto,
      clientId,
      status: 'pending',
    });

    const saved = await (await booking.save()).populate([
      { path: 'clientId', select: 'name email phone avatar' },
      { path: 'caregiverId', populate: { path: 'userId', select: 'name email phone avatar role' } },
    ]);

    const caregiverPopulated = saved.caregiverId as any;
    const caregiverUser = caregiverPopulated?.userId;
    const client = saved.clientId as any;

    // Email para o cuidador
    if (caregiverUser?.email) {
      try {
        await this.emailService.sendNewBookingRequestEmail({
          to: caregiverUser.email,
          caregiverName: caregiverUser.name,
          clientName: dto.clientName || client?.name || 'Cliente',
          clientPhone: dto.clientPhone || client?.phone || '',
          serviceName: dto.serviceName || dto.serviceType || 'Atendimento',
          durationLabel: dto.durationLabel || `${dto.durationHours}h`,
          startDate: new Date(dto.startDate).toLocaleString('pt-BR'),
          address: dto.address || '',
          totalAmount: dto.totalAmount,
          notes: dto.notes,
        });
      } catch (error: any) {
        console.error('Erro ao enviar email para cuidador:', error.message);
      }
    }

    // Email para o cliente
    if (client?.email) {
      try {
        await this.emailService.sendBookingConfirmationToClientEmail({
          to: client.email,
          clientName: client.name,
          caregiverName: caregiverUser?.name || 'Cuidador',
          serviceName: dto.serviceName || dto.serviceType || 'Atendimento',
          durationLabel: dto.durationLabel || `${dto.durationHours}h`,
          startDate: new Date(dto.startDate).toLocaleString('pt-BR'),
          totalAmount: dto.totalAmount,
        });
      } catch (error: any) {
        console.error('Erro ao enviar email para cliente:', error.message);
      }
    }

    return saved;
  }

  async findByClient(clientId: string) {
    return this.bookingModel
      .find({ clientId })
      .populate({
        path: 'caregiverId',
        populate: { path: 'userId', select: 'name email phone avatar role' },
      })
      .sort({ createdAt: -1 });
  }

  async findByCaregiver(userId: string) {
    return this.bookingModel
      .find()
      .populate({
        path: 'caregiverId',
        match: { userId },
        populate: { path: 'userId', select: 'name email phone avatar role' },
      })
      .populate('clientId', 'name email phone avatar role')
      .sort({ createdAt: -1 })
      .then((bookings) => bookings.filter((b) => b.caregiverId));
  }

  async findByCaregiverId(caregiverId: string) {
    return this.bookingModel
      .find({ caregiverId })
      .populate('clientId', 'name email phone avatar role')
      .populate({
        path: 'caregiverId',
        populate: { path: 'userId', select: 'name email phone avatar role' },
      })
      .sort({ createdAt: -1 });
  }

  async updateStatus(id: string, userId: string, status: string, role: string) {
    const booking = await this.bookingModel
      .findById(id)
      .populate({
        path: 'caregiverId',
        populate: { path: 'userId', select: 'name email phone avatar role' },
      })
      .populate('clientId', 'name email phone avatar role');

    if (!booking) throw new NotFoundException('Agendamento não encontrado');

    const isClient = (booking.clientId as any)?._id?.toString() === userId;
    const isCaregiver = (booking.caregiverId as any)?.userId?._id?.toString() === userId;

    if (!isClient && !isCaregiver) {
      throw new ForbiddenException('Sem permissão');
    }

    if (role === 'client' && status !== 'cancelled') {
      throw new ForbiddenException('Clientes só podem cancelar agendamentos');
    }

    booking.status = status;
    const saved = await booking.save();

    try {
      if (status === 'confirmed') {
        if (this.paymentsService) {
          await this.paymentsService.createPayment(id);
        }

        const conversation = await this.chatService.getOrCreateConversation(id, userId);
        console.log(`💬 Conversa criada automaticamente para booking ${id}:`, conversation?._id);
      } else if (status === 'completed') {
        if (this.paymentsService) {
          const payment = await this.paymentsService.findByBooking(id);
          if (payment && ['held', 'paid'].includes(payment.status)) {
            await this.paymentsService.releasePayment(id);
          }
        }

        const caregiver = booking.caregiverId as any;
        const caregiverUser = caregiver?.userId;
        const client = booking.clientId as any;

        if (client?.email) {
          await this.emailService.sendServiceCompletedToClientEmail({
            to: client.email,
            clientName: client.name,
            caregiverName: caregiverUser?.name || 'Cuidador',
            serviceName: booking.serviceName || booking.serviceType || 'Atendimento',
            caregiverId: caregiver._id.toString(),
            bookingId: booking._id.toString(),
          });
        }
      } else if (status === 'cancelled') {
        if (this.paymentsService) {
          const payment = await this.paymentsService.findByBooking(id);
          if (payment && ['held', 'paid'].includes(payment.status)) {
            await this.paymentsService.refundPayment(id);
          }
        }
      }
    } catch (error: any) {
      console.error('Erro na integração:', error.message);
    }

    return saved;
  }

  async findOne(id: string) {
    return this.bookingModel
      .findById(id)
      .populate('clientId', 'name email phone avatar role')
      .populate({
        path: 'caregiverId',
        populate: { path: 'userId', select: 'name email phone avatar role' },
      });
  }

  async canReview(clientId: string, caregiverId: string): Promise<{ canReview: boolean; bookingId?: string }> {
    const completedBooking = await this.bookingModel.findOne({
      clientId,
      caregiverId,
      status: 'completed',
    }).sort({ createdAt: -1 });

    if (!completedBooking) {
      return { canReview: false };
    }

    return { canReview: true, bookingId: completedBooking._id.toString() };
  }

  async getCompletedBookings(clientId: string, caregiverId: string) {
    return this.bookingModel.find({
      clientId,
      caregiverId,
      status: 'completed',
    }).sort({ createdAt: -1 });
  }
}