import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Feedback, FeedbackDocument } from './schemas/feedback.schema';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(
    @InjectModel(Feedback.name)
    private feedbackModel: Model<FeedbackDocument>,
    @InjectModel(Booking.name)
    private bookingModel: Model<BookingDocument>,
    private emailService: EmailService, // 👈 Adicione esta linha
  ) {}

  async create(createFeedbackDto: CreateFeedbackDto, userId: string) {
    const { bookingId, feedbackDate, dayNumber, content, ...rest } = createFeedbackDto;

    // Validar booking existe e popular CLIENTE também para enviar email
    const booking = await this.bookingModel
      .findById(bookingId)
      .populate('caregiverId', 'userId')
      .populate('clientId', 'email name'); // 👈 Adicione o populate do cliente
      
    if (!booking) {
      throw new NotFoundException('Serviço não encontrado');
    }

    // Verificar se é o cuidador do serviço
    const caregiverUserId = (booking.caregiverId as any)?.userId?.toString();
    
    this.logger.log(`Criando relatório: User ${userId} vs Caregiver User ${caregiverUserId}`);
    
    if (caregiverUserId !== userId) {
      throw new ForbiddenException('Você não pode enviar relatório deste serviço');
    }

    // Validar se o serviço está em andamento ou foi concluído
    if (!['in_progress', 'completed'].includes(booking.status)) {
      throw new BadRequestException(
        'Relatório só pode ser enviado durante ou após o serviço',
      );
    }

    // Para serviços até 24h, só permite relatório quando concluído
    const durationHours = booking.durationHours || 24;
    const isShortService = durationHours <= 24;

    if (isShortService && booking.status !== 'completed') {
      throw new BadRequestException(
        'Para serviços de até 24h, o relatório só pode ser enviado após a conclusão',
      );
    }

    // Calcular feedbackDate e dayNumber se não fornecidos
    let finalFeedbackDate = feedbackDate ? new Date(feedbackDate) : new Date();
    let finalDayNumber = dayNumber;

    if (!isShortService && !dayNumber) {
      const startDate = new Date(booking.startDate);
      const today = new Date(finalFeedbackDate);
      const dayDiff = Math.floor(
        (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      finalDayNumber = Math.max(1, dayDiff + 1);
    }

    // Verificar se já existe relatório para este dia
    if (finalDayNumber) {
      const existingFeedback = await this.feedbackModel.findOne({
        bookingId,
        dayNumber: finalDayNumber,
      });

      if (existingFeedback) {
        throw new BadRequestException(
          `Já existe um relatório para o dia ${finalDayNumber}`,
        );
      }
    }

    // Criar relatório
    const feedback = new this.feedbackModel({
      bookingId,
      clientId: booking.clientId,
      caregiverId: booking.caregiverId,
      feedbackDate: finalFeedbackDate,
      dayNumber: finalDayNumber,
      content,
      isFinal: isShortService || booking.status === 'completed',
      ...rest,
    });

    const savedFeedback = await feedback.save();
    this.logger.log(`✅ Relatório criado para booking ${bookingId}, dia ${finalDayNumber || 'único'}`);

    // 👇 ENVIAR EMAIL PARA O CLIENTE
    try {
      const clientEmail = (booking.clientId as any)?.email;
      const clientName = (booking.clientId as any)?.name;
      
      // Buscar o nome do cuidador
      const caregiverUser = await this.bookingModel
        .findById(bookingId)
        .populate({
          path: 'caregiverId',
          populate: { path: 'userId', select: 'name' }
        });
      
      const caregiverName = (caregiverUser?.caregiverId as any)?.userId?.name || 'Seu cuidador';

      if (clientEmail) {
        await this.emailService.sendNewFeedbackAvailableEmail({
          to: clientEmail,
          clientName: clientName || 'Cliente',
          caregiverName,
          serviceName: booking.serviceName || 'Atendimento',
          feedbackDate: finalFeedbackDate.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          dayNumber: finalDayNumber,
          isFinal: isShortService || booking.status === 'completed',
        });

        this.logger.log(`📧 Email de relatório enviado para ${clientEmail}`);
      }
    } catch (emailError) {
      this.logger.error(`❌ Erro ao enviar email de relatório`);
      // Não falha a criação do relatório se o email falhar
    }

    return this.findById(savedFeedback._id.toString());
  }

  // Encontrar relatório por ID
  async findById(id: string) {
    const feedback = await this.feedbackModel
      .findById(id)
      .populate('clientId', 'name avatar')
      .populate({
        path: 'caregiverId',
        select: 'userId',
        populate: {
          path: 'userId',
          select: 'name avatar',
        },
      })
      .populate('bookingId', 'serviceName startDate endDate durationHours');

    if (!feedback) {
      throw new NotFoundException('Relatório não encontrado');
    }

    return this.formatFeedback(feedback);
  }

  // Listar relatórios de um serviço (cliente E cuidador podem ver)
  async findByBooking(bookingId: string, userId: string) {
    const booking = await this.bookingModel
      .findById(bookingId)
      .populate('caregiverId', 'userId');
      
    if (!booking) {
      throw new NotFoundException('Serviço não encontrado');
    }

    // Cliente OU cuidador podem ver relatórios do serviço
    const isClient = booking.clientId.toString() === userId;
    const caregiverUserId = (booking.caregiverId as any)?.userId?.toString();
    const isCaregiver = caregiverUserId === userId;

    this.logger.log(`findByBooking: User ${userId}, isClient: ${isClient}, isCaregiver: ${isCaregiver}`);

    if (!isClient && !isCaregiver) {
      throw new ForbiddenException('Você não tem permissão para visualizar estes relatórios');
    }

    const feedbacks = await this.feedbackModel
      .find({ bookingId })
      .populate({
        path: 'caregiverId',
        select: 'userId',
        populate: {
          path: 'userId',
          select: 'name avatar',
        },
      })
      .sort({ dayNumber: 1, feedbackDate: -1 });

    return feedbacks.map(f => this.formatFeedback(f));
  }

  // Listar relatórios enviados pelo cuidador
  async findByCaregiverSent(userId: string) {
    // Buscar todos os bookings onde o usuário é o cuidador
    const bookings = await this.bookingModel
      .find()
      .populate('caregiverId', 'userId');
    
    const myBookingIds = bookings
      .filter(b => (b.caregiverId as any)?.userId?.toString() === userId)
      .map(b => b._id);

    if (myBookingIds.length === 0) {
      return [];
    }

    const feedbacks = await this.feedbackModel
      .find({ bookingId: { $in: myBookingIds } })
      .populate('bookingId', 'serviceName startDate endDate')
      .populate('clientId', 'name avatar')
      .sort({ createdAt: -1 });

    return feedbacks;
  }

  // Verificar se já existe relatório para um dia específico
  async existsForDay(bookingId: string, dayNumber: number): Promise<boolean> {
    const count = await this.feedbackModel.countDocuments({
      bookingId,
      dayNumber,
    });
    return count > 0;
  }

  // Atualizar relatório (apenas cuidador que criou)
  async update(id: string, updateData: Partial<CreateFeedbackDto>, userId: string) {
    const feedback = await this.feedbackModel.findById(id);
      
    if (!feedback) {
      throw new NotFoundException('Relatório não encontrado');
    }

    // Verificar se é o cuidador deste relatório
    const booking = await this.bookingModel
      .findById(feedback.bookingId)
      .populate('caregiverId', 'userId');

    const caregiverUserId = (booking?.caregiverId as any)?.userId?.toString();
    
    if (caregiverUserId !== userId) {
      throw new ForbiddenException('Você não pode editar este relatório');
    }

    // Não permitir edição após 24h
    const createdAt = new Date(feedback['createdAt']);
    const now = new Date();
    const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    if (hoursDiff > 24) {
      throw new BadRequestException('Relatórios só podem ser editados em até 24h após criação');
    }

    await this.feedbackModel.findByIdAndUpdate(id, updateData);

    return this.findById(id);
  }

  // Deletar relatório (apenas cuidador que criou)
  async delete(id: string, userId: string) {
    const feedback = await this.feedbackModel.findById(id);
      
    if (!feedback) {
      throw new NotFoundException('Relatório não encontrado');
    }

    // Verificar se é o cuidador deste relatório
    const booking = await this.bookingModel
      .findById(feedback.bookingId)
      .populate('caregiverId', 'userId');

    const caregiverUserId = (booking?.caregiverId as any)?.userId?.toString();
    
    if (caregiverUserId !== userId) {
      throw new ForbiddenException('Você não pode deletar este relatório');
    }

    await this.feedbackModel.findByIdAndDelete(id);
    this.logger.log(`✅ Relatório ${id} deletado`);

    return { message: 'Relatório deletado com sucesso' };
  }

  // Helper para formatar feedback para o frontend
  private formatFeedback(feedback: any) {
    const f = feedback.toObject ? feedback.toObject() : feedback;
    
    return {
      ...f,
      caregiverId: {
        _id: (f.caregiverId as any)?._id,
        name: (f.caregiverId as any)?.userId?.name || 'Cuidador',
        avatar: (f.caregiverId as any)?.userId?.avatar,
      },
    };
  }
}