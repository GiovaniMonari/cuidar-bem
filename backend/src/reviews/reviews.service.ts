import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
    // Verificar se o cliente pode avaliar este cuidador
    const { canReview, bookingId: completedBookingId } = await this.bookingsService.canReview(
      clientId,
      dto.caregiverId,
    );

    if (!canReview) {
      throw new ForbiddenException(
        'Você só pode avaliar um cuidador após a conclusão de um serviço contratado.',
      );
    }

    // Verificar se já existe avaliação para este booking específico
    const bookingIdToUse = dto.bookingId || completedBookingId;
    
    if (bookingIdToUse) {
      const existingReview = await this.reviewModel.findOne({
        clientId,
        bookingId: bookingIdToUse,
      });

      if (existingReview) {
        throw new BadRequestException('Você já avaliou este atendimento.');
      }
    }

    // Verificar se já avaliou este cuidador recentemente (sem bookingId)
    if (!bookingIdToUse) {
      const recentReview = await this.reviewModel.findOne({
        clientId,
        caregiverId: dto.caregiverId,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // últimas 24h
      });

      if (recentReview) {
        throw new BadRequestException('Você já avaliou este cuidador recentemente.');
      }
    }

    const review = new this.reviewModel({
      ...dto,
      clientId,
      bookingId: bookingIdToUse,
    });
    const saved = await review.save();

    // Atualizar rating do cuidador
    await this.caregiversService.updateRating(dto.caregiverId, dto.rating);

    return saved.populate('clientId', 'name avatar');
  }

  async findByCaregiver(caregiverId: string) {
    return this.reviewModel
      .find({ caregiverId })
      .populate('clientId', 'name avatar')
      .sort({ createdAt: -1 });
  }

  async checkCanReview(clientId: string, caregiverId: string) {
    return this.bookingsService.canReview(clientId, caregiverId);
  }
}