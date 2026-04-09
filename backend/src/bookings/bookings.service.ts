import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
  Logger,
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
  private readonly logger = new Logger(BookingsService.name);
  private readonly checkInRadiusMeters = 200;
  private readonly earlyCheckInWindowMs = 2 * 60 * 60 * 1000;
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

  // ═══════════════════════════════════════════
  // HELPER: Enviar email com log adequado
  // ═══════════════════════════════════════════
  private async sendEmailSafely(
    emailType: string,
    recipient: string,
    sendFn: () => Promise<any>,
  ): Promise<boolean> {
    try {
      this.logger.log(`📧 Enviando ${emailType} para ${recipient}...`);
      const result = await sendFn();

      if (result?.success) {
        this.logger.log(`✅ ${emailType} enviado para ${recipient}`);
        return true;
      } else {
        this.logger.warn(
          `⚠️ ${emailType} falhou para ${recipient}: ${result?.error || 'desconhecido'}`,
        );
        return false;
      }
    } catch (error: any) {
      this.logger.error(
        `❌ Erro ao enviar ${emailType} para ${recipient}: ${error.message}`,
      );
      return false;
    }
  }

  private isValidCoordinate(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
  }

  private toRadians(value: number): number {
    return (value * Math.PI) / 180;
  }

  private calculateDistanceMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const earthRadiusMeters = 6371000;
    const deltaLat = this.toRadians(lat2 - lat1);
    const deltaLon = this.toRadians(lon2 - lon1);
    const lat1Rad = this.toRadians(lat1);
    const lat2Rad = this.toRadians(lat2);

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.sin(deltaLon / 2) *
        Math.sin(deltaLon / 2) *
        Math.cos(lat1Rad) *
        Math.cos(lat2Rad);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusMeters * c;
  }

  // ═══════════════════════════════════════════
  // CREATE BOOKING
  // ═══════════════════════════════════════════
  async create(
    clientId: string,
    dto: CreateBookingDto,
    clientUser: any,
  ): Promise<BookingDocument> {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new ForbiddenException('Datas inválidas para o agendamento.');
    }

    if (end < start) {
      throw new ForbiddenException(
        'A data final não pode ser anterior à inicial.',
      );
    }

    if (!dto.address?.trim()) {
      throw new ForbiddenException(
        'Informe o endereço do atendimento para permitir o check-in do cuidador.',
      );
    }

    if (
      !this.isValidCoordinate(dto.addressLat) ||
      !this.isValidCoordinate(dto.addressLon)
    ) {
      throw new ForbiddenException(
        'Confirme o endereço no mapa para habilitar o check-in do cuidador.',
      );
    }

    const caregiverModelAny: any = this.bookingModel.db.model('Caregiver');
    const caregiver = await caregiverModelAny
      .findById(dto.caregiverId)
      .populate('userId');

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
      $or: [{ startDate: { $lte: end }, endDate: { $gte: start } }],
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

    const saved = await (
      await booking.save()
    ).populate([
      { path: 'clientId', select: 'name email phone avatar' },
      {
        path: 'caregiverId',
        populate: { path: 'userId', select: 'name email phone avatar role' },
      },
    ]);

    const caregiverPopulated = saved.caregiverId as any;
    const caregiverUser = caregiverPopulated?.userId;
    const client = saved.clientId as any;

    this.logger.log(`📋 Booking criado: ${saved._id}`);
    this.logger.log(`   Cliente: ${client?.email || 'sem email'}`);
    this.logger.log(`   Cuidador: ${caregiverUser?.email || 'sem email'}`);

    // ✅ Enviar emails em paralelo para não bloquear resposta
    const emailPromises: Promise<boolean>[] = [];

    // Email para o cuidador
    if (caregiverUser?.email) {
      emailPromises.push(
        this.sendEmailSafely(
          'Nova Solicitação (cuidador)',
          caregiverUser.email,
          () =>
            this.emailService.sendNewBookingRequestEmail({
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
            }),
        ),
      );
    } else {
      this.logger.warn('⚠️ Cuidador sem email cadastrado');
    }

    // Email para o cliente
    if (client?.email) {
      emailPromises.push(
        this.sendEmailSafely(
          'Confirmação Solicitação (cliente)',
          client.email,
          () =>
            this.emailService.sendBookingConfirmationToClientEmail({
              to: client.email,
              clientName: client.name,
              caregiverName: caregiverUser?.name || 'Cuidador',
              serviceName: dto.serviceName || dto.serviceType || 'Atendimento',
              durationLabel: dto.durationLabel || `${dto.durationHours}h`,
              startDate: new Date(dto.startDate).toLocaleString('pt-BR'),
              totalAmount: dto.totalAmount,
            }),
        ),
      );
    } else {
      this.logger.warn('⚠️ Cliente sem email cadastrado');
    }

    // ✅ Aguardar emails mas não falhar se não enviar
    if (emailPromises.length > 0) {
      const results = await Promise.allSettled(emailPromises);
      const successCount = results.filter(
        (r) => r.status === 'fulfilled' && r.value === true,
      ).length;
      this.logger.log(
        `📧 Emails enviados: ${successCount}/${emailPromises.length}`,
      );
    }

    return saved;
  }

  // ═══════════════════════════════════════════
  // CHECK-IN
  // ═══════════════════════════════════════════
  async checkIn(
    id: string,
    userId: string,
    role: string,
    latitude: number,
    longitude: number,
  ) {
    if (role !== 'caregiver') {
      throw new ForbiddenException(
        'Apenas cuidadores podem realizar o check-in.',
      );
    }

    if (
      !this.isValidCoordinate(latitude) ||
      !this.isValidCoordinate(longitude)
    ) {
      throw new BadRequestException(
        'Coordenadas inválidas para o check-in.',
      );
    }

    const booking = await this.bookingModel
      .findById(id)
      .populate({
        path: 'caregiverId',
        populate: { path: 'userId', select: 'name email phone avatar role' },
      })
      .populate('clientId', 'name email phone avatar role');

    if (!booking) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    const caregiver = booking.caregiverId as any;
    const caregiverUser = caregiver?.userId;
    const isCaregiver = caregiverUser?._id?.toString() === userId;

    if (!isCaregiver) {
      throw new ForbiddenException('Sem permissão');
    }

    if (booking.status === 'in_progress' && booking.checkInAt) {
      return booking;
    }

    if (booking.status !== 'confirmed') {
      throw new ForbiddenException(
        'O check-in só pode ser feito em atendimentos confirmados.',
      );
    }

    if (
      !this.isValidCoordinate(booking.addressLat) ||
      !this.isValidCoordinate(booking.addressLon)
    ) {
      throw new ForbiddenException(
        'Este agendamento ainda não possui uma localização validada para check-in.',
      );
    }

    const checkInWindowStart = new Date(
      new Date(booking.startDate).getTime() - this.earlyCheckInWindowMs,
    );

    if (new Date() < checkInWindowStart) {
      throw new ForbiddenException(
        `O check-in só pode ser feito a partir de ${checkInWindowStart.toLocaleString('pt-BR')}.`,
      );
    }

    const distanceMeters = this.calculateDistanceMeters(
      latitude,
      longitude,
      booking.addressLat,
      booking.addressLon,
    );

    if (distanceMeters > this.checkInRadiusMeters) {
      throw new ForbiddenException(
        `Você está a ${Math.round(distanceMeters)}m do local combinado. Aproxime-se até ${this.checkInRadiusMeters}m para realizar o check-in.`,
      );
    }

    booking.status = 'in_progress';
    booking.checkInAt = new Date();
    booking.checkInLat = latitude;
    booking.checkInLon = longitude;
    booking.checkInDistanceMeters = Math.round(distanceMeters);

    const saved = await booking.save();

    this.logger.log(
      `📍 Check-in realizado no booking ${id} a ${saved.checkInDistanceMeters}m do local combinado`,
    );

    const client = booking.clientId as any;

    if (client?.email) {
      await this.sendEmailSafely(
        'Check-in do cuidador',
        client.email,
        () =>
          this.emailService.sendCaregiverCheckInEmail({
            to: client.email,
            clientName: client.name || booking.clientName || 'Cliente',
            caregiverName: caregiverUser?.name || 'Cuidador',
            serviceName:
              booking.serviceName || booking.serviceType || 'Atendimento',
            address: booking.address || 'Endereço informado no agendamento',
            checkInAt: saved.checkInAt
              ? new Date(saved.checkInAt).toLocaleString('pt-BR')
              : new Date().toLocaleString('pt-BR'),
            distanceMeters: saved.checkInDistanceMeters,
          }),
      );
    }

    return saved;
  }

  // ═══════════════════════════════════════════
  // UPDATE STATUS
  // ═══════════════════════════════════════════
  async updateStatus(id: string, userId: string, status: string, role: string) {
    const booking = await this.bookingModel
      .findById(id)
      .populate({
        path: 'caregiverId',
        populate: { path: 'userId', select: 'name email phone avatar role' },
      })
      .populate('clientId', 'name email phone avatar role');

    if (!booking) throw new NotFoundException('Agendamento não encontrado');

    const client = booking.clientId as any;
    const caregiver = booking.caregiverId as any;
    const caregiverUser = caregiver?.userId;

    const isClient = client?._id?.toString() === userId;
    const isCaregiver = caregiverUser?._id?.toString() === userId;

    if (!isClient && !isCaregiver) {
      throw new ForbiddenException('Sem permissão');
    }

    if (
      !['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'].includes(
        status,
      )
    ) {
      throw new BadRequestException('Status inválido para o agendamento.');
    }

    if (role === 'client' && status !== 'cancelled') {
      throw new ForbiddenException('Clientes só podem cancelar agendamentos');
    }

    const previousStatus = booking.status;

    if (status === previousStatus) {
      return booking;
    }

    if (status === 'in_progress') {
      throw new ForbiddenException(
        'Use a ação de check-in para iniciar o atendimento.',
      );
    }

    if (status === 'completed' && previousStatus !== 'in_progress') {
      throw new ForbiddenException(
        'Realize o check-in antes de concluir o atendimento.',
      );
    }

    booking.status = status;
    const saved = await booking.save();

    this.logger.log(
      `📋 Booking ${id} atualizado: ${previousStatus} → ${status}`,
    );

    // ═══════════════════════════════════════════
    // AÇÕES PÓS-ATUALIZAÇÃO
    // ═══════════════════════════════════════════

    // ✅ CONFIRMED: Criar chat + emails
    if (status === 'confirmed' && previousStatus !== 'confirmed') {
      await this.handleBookingConfirmed(booking, id, userId, client, caregiverUser);
    }

    // ✅ CANCELLED: Reembolso + fechar chat
    else if (status === 'cancelled' && previousStatus !== 'cancelled') {
      await this.handleBookingCancelled(booking, id, client, caregiverUser);
    }

    // ✅ COMPLETED: Liberar pagamento + emails + fechar chat
    else if (status === 'completed' && previousStatus !== 'completed') {
      await this.handleBookingCompleted(
        booking,
        id,
        client,
        caregiver,
        caregiverUser,
      );
    }

    return saved;
  }

  // ═══════════════════════════════════════════
  // HANDLERS SEPARADOS (mais organizado)
  // ═══════════════════════════════════════════

  private async handleBookingConfirmed(
    booking: BookingDocument,
    bookingId: string,
    userId: string,
    client: any,
    caregiverUser: any,
  ) {
    try {
      if (client?.email) {
        await this.sendEmailSafely(
          'Confirmação do agendamento',
          client.email,
          () =>
            this.emailService.sendBookingApprovedEmail({
              to: client.email,
              clientName: client.name || booking.clientName || 'Cliente',
              caregiverName: caregiverUser?.name || 'Cuidador',
              serviceName:
                booking.serviceName || booking.serviceType || 'Atendimento',
              bookingDate: new Date(booking.startDate).toLocaleDateString(
                'pt-BR',
              ),
              amount: booking.totalAmount || 0,
            }),
        );
      }

      // Criar conversa
      const conversation = await this.chatService.getOrCreateConversation(
        bookingId,
        userId,
      );
      this.logger.log(
        `💬 Conversa criada para booking ${bookingId}: ${conversation?._id}`,
      );
    } catch (error: any) {
      this.logger.error(
        `❌ Erro ao processar confirmação do booking ${bookingId}: ${error.message}`,
      );
    }
  }

  private async handleBookingCancelled(
    booking: BookingDocument,
    bookingId: string,
    client: any,
    caregiverUser: any,
  ) {
    try {
      // Reembolso
      if (this.paymentsService) {
        const payment = await this.paymentsService.findByBooking(bookingId);
        if (payment && ['held', 'paid'].includes(payment.status)) {
          await this.paymentsService.refundPayment(bookingId);
          this.logger.log(`💸 Reembolso processado para booking ${bookingId}`);
        }
      }

      // Fechar chat se não houver outros bookings ativos
      const clientId = client?._id?.toString();
      const caregiverUserId = caregiverUser?._id?.toString();

      if (clientId && caregiverUserId) {
        const hasOtherActive = await this.chatService.hasActiveBooking(
          clientId,
          caregiverUserId,
        );

        if (!hasOtherActive) {
          await this.chatService.closeConversation(
            clientId,
            caregiverUserId,
            'cancelled',
          );
          this.logger.log(
            `🔒 Chat fechado entre ${clientId} e ${caregiverUserId}`,
          );
        } else {
          this.logger.log(`💬 Mantendo chat aberto - há outros bookings ativos`);
        }
      }
    } catch (error: any) {
      this.logger.error(
        `❌ Erro ao processar cancelamento do booking ${bookingId}: ${error.message}`,
      );
    }
  }

  private async handleBookingCompleted(
    booking: BookingDocument,
    bookingId: string,
    client: any,
    caregiver: any,
    caregiverUser: any,
  ) {
    try {
      let paymentReleased = false;
      let paymentData = {
        amount: booking.totalAmount || 0,
        platformFee: 0,
        caregiverAmount: 0,
      };

      if (this.paymentsService) {
        const payment = await this.paymentsService.findByBooking(bookingId);
        if (!payment) {
          const createdPayment =
            await this.paymentsService.createPayment(bookingId);
          this.logger.log(
            `💳 Pagamento criado após conclusão para booking ${bookingId}`,
          );

          paymentData = {
            amount: createdPayment.amount || booking.totalAmount,
            platformFee: createdPayment.platformFee || 0,
            caregiverAmount:
              createdPayment.caregiverAmount ||
              Math.max(
                (createdPayment.amount || booking.totalAmount) -
                  (createdPayment.platformFee || 0),
                0,
              ),
          };
        } else if (['held', 'paid'].includes(payment.status)) {
          const released = await this.paymentsService.releasePayment(bookingId);
          this.logger.log(
            `💰 Pagamento liberado para booking ${bookingId}`,
          );
          paymentReleased = true;

          // Pegar valores do pagamento para o email
          if (released) {
            paymentData = {
              amount: released.amount || booking.totalAmount,
              platformFee: released.platformFee || released.amount * 0.1,
              caregiverAmount:
                released.caregiverAmount || released.amount * 0.9,
            };
          }
        } else {
          paymentData = {
            amount: payment.amount || booking.totalAmount,
            platformFee: payment.platformFee || 0,
            caregiverAmount:
              payment.caregiverAmount ||
              Math.max((payment.amount || booking.totalAmount) - (payment.platformFee || 0), 0),
          };
        }
      }

      const emailPromises: Promise<boolean>[] = [];

      // ✅ Email para CLIENTE (solicitar avaliação)
      if (client?.email) {
        emailPromises.push(
          this.sendEmailSafely(
            'Serviço Concluído (cliente)',
            client.email,
            () =>
              this.emailService.sendServiceCompletedToClientEmail({
                to: client.email,
                clientName: client.name,
                caregiverName: caregiverUser?.name || 'Cuidador',
                serviceName:
                  booking.serviceName || booking.serviceType || 'Atendimento',
                caregiverId: caregiver._id.toString(),
                bookingId: booking._id.toString(),
                paymentCreated: true,
              }),
          ),
        );
      }

      // ✅ Email para CUIDADOR apenas quando o pagamento tiver sido realmente liberado
      if (caregiverUser?.email && paymentReleased) {
        emailPromises.push(
          this.sendEmailSafely(
            'Pagamento Liberado (cuidador)',
            caregiverUser.email,
            () =>
              this.emailService.sendServiceCompletedToCaregiverEmail({
                to: caregiverUser.email,
                caregiverName: caregiverUser.name,
                clientName: client?.name || 'Cliente',
                serviceName:
                  booking.serviceName || booking.serviceType || 'Atendimento',
                amount: paymentData.amount,
                platformFee: paymentData.platformFee,
                caregiverAmount: paymentData.caregiverAmount,
              }),
          ),
        );
      }

      // Enviar emails
      if (emailPromises.length > 0) {
        const results = await Promise.allSettled(emailPromises);
        const successCount = results.filter(
          (r) => r.status === 'fulfilled' && r.value === true,
        ).length;
        this.logger.log(
          `📧 Emails de conclusão: ${successCount}/${emailPromises.length}`,
        );
      }

      // Fechar chat se não houver outros bookings ativos
      const clientId = client?._id?.toString();
      const caregiverUserId = caregiverUser?._id?.toString();

      if (clientId && caregiverUserId) {
        const hasOtherActive = await this.chatService.hasActiveBooking(
          clientId,
          caregiverUserId,
        );

        if (!hasOtherActive) {
          await this.chatService.closeConversation(
            clientId,
            caregiverUserId,
            'completed',
          );
          this.logger.log(
            `🔒 Chat fechado (serviço concluído) entre ${clientId} e ${caregiverUserId}`,
          );
        }
      }
    } catch (error: any) {
      this.logger.error(
        `❌ Erro ao processar conclusão do booking ${bookingId}: ${error.message}`,
      );
    }
  }

  // ═══════════════════════════════════════════
  // MÉTODOS DE CONSULTA (sem alterações)
  // ═══════════════════════════════════════════

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

  async findOne(id: string) {
    return this.bookingModel
      .findById(id)
      .populate('clientId', 'name email phone avatar role')
      .populate({
        path: 'caregiverId',
        populate: { path: 'userId', select: 'name email phone avatar role' },
      });
  }

  async canReview(
    clientId: string,
    caregiverId: string,
  ): Promise<{ canReview: boolean; bookingId?: string }> {
    const completedBooking = await this.bookingModel
      .findOne({
        clientId,
        caregiverId,
        status: 'completed',
      })
      .sort({ createdAt: -1 });

    if (!completedBooking) {
      return { canReview: false };
    }

    return { canReview: true, bookingId: completedBooking._id.toString() };
  }

  async getCompletedBookings(clientId: string, caregiverId: string) {
    return this.bookingModel
      .find({
        clientId,
        caregiverId,
        status: 'completed',
      })
      .sort({ createdAt: -1 });
  }

  async getActiveBookingsBetween(clientId: string, caregiverUserId: string) {
    const caregiverModelAny: any = this.bookingModel.db.model('Caregiver');
    const caregiver = await caregiverModelAny.findOne({
      userId: caregiverUserId,
    });

    if (!caregiver) {
      return [];
    }

    const now = new Date();

    return this.bookingModel.find({
      clientId: clientId,
      caregiverId: caregiver._id,
      status: { $in: ['pending', 'confirmed', 'in_progress'] },
      endDate: { $gte: now },
    });
  }
}
