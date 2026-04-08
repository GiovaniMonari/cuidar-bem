// reviews.service.ts
import { Injectable, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from './schemas/review.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { CaregiversService } from '../caregivers/caregivers.service';
import { BookingsService } from '../bookings/bookings.service';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    private caregiversService: CaregiversService,
    private bookingsService: BookingsService,
  ) {}

  async create(clientId: string, dto: CreateReviewDto): Promise<ReviewDocument> {
    // Verificar se o bookingId foi informado
    if (!dto.bookingId) {
      throw new BadRequestException('É necessário informar o ID do atendimento.');
    }

    // Buscar o booking
    const booking = await this.bookingsService.findOne(dto.bookingId);

    if (!booking) {
      throw new NotFoundException('Atendimento não encontrado.');
    }

    // Verificar se o booking pertence ao cliente
    const bookingClientId = (booking.clientId as any)?._id?.toString() || booking.clientId?.toString();
    if (bookingClientId !== clientId) {
      throw new ForbiddenException('Você não pode avaliar este atendimento.');
    }

    // Verificar se o booking está completado
    if (booking.status !== 'completed') {
      throw new ForbiddenException('Só é possível avaliar atendimentos concluídos.');
    }

    // Verificar se já existe avaliação para este booking
    const existingReview = await this.reviewModel.findOne({
      bookingId: new Types.ObjectId(dto.bookingId),
    });

    if (existingReview) {
      throw new BadRequestException('Este atendimento já foi avaliado.');
    }

    // Criar a avaliação
    const review = new this.reviewModel({
      clientId: new Types.ObjectId(clientId),
      caregiverId: new Types.ObjectId(dto.caregiverId),
      bookingId: new Types.ObjectId(dto.bookingId),
      rating: dto.rating,
      comment: dto.comment,
    });

    const saved = await review.save();

    // Atualizar rating do cuidador
    await this.updateCaregiverRating(dto.caregiverId);

    return saved.populate('clientId', 'name avatar');
  }

  async findByCaregiver(caregiverId: string) {
    return this.reviewModel
      .find({ caregiverId: new Types.ObjectId(caregiverId) })
      .populate('clientId', 'name avatar')
      .sort({ createdAt: -1 });
  }

  // ⬇️ NOVO: Buscar bookings que podem ser avaliados
  async getReviewableBookings(clientId: string, caregiverId: string) {
    // Buscar todos os bookings completados do cliente com este cuidador
    const completedBookings = await this.bookingsService.getCompletedBookings(clientId, caregiverId);

    // Filtrar os que ainda não foram avaliados
    const reviewableBookings = [];

    for (const booking of completedBookings) {
      const hasReview = await this.reviewModel.findOne({
        bookingId: booking._id,
      });

      if (!hasReview) {
        reviewableBookings.push({
          _id: booking._id.toString(),
          serviceName: booking.serviceName || booking.serviceType || 'Atendimento',
          startDate: booking.startDate,
          endDate: booking.endDate,
          totalAmount: booking.totalAmount,
          durationLabel: booking.durationLabel,
        });
      }
    }

    return reviewableBookings;
  }

  // ⬇️ ATUALIZADO: canReview retorna lista de bookings disponíveis
  async checkCanReview(clientId: string, caregiverId: string) {
    const reviewableBookings = await this.getReviewableBookings(clientId, caregiverId);

    return {
      canReview: reviewableBookings.length > 0,
      bookings: reviewableBookings,
      // Manter compatibilidade com código antigo
      bookingId: reviewableBookings.length > 0 ? reviewableBookings[0]._id : null,
    };
  }

  // ⬇️ NOVO: Atualizar rating do cuidador baseado em todas as reviews
  private async updateCaregiverRating(caregiverId: string) {
    const reviews = await this.reviewModel.find({
      caregiverId: new Types.ObjectId(caregiverId),
    });

    if (reviews.length === 0) return;

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = Math.round((totalRating / reviews.length) * 10) / 10;

    await this.caregiversService.updateRating(caregiverId, avgRating, reviews.length);
  }
}