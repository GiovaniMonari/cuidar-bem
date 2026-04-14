// reviews.service.ts
import { 
  Injectable, 
  ForbiddenException, 
  BadRequestException, 
  NotFoundException 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from './schemas/review.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { CaregiversService } from '../caregivers/caregivers.service';
import { BookingsService } from '../bookings/bookings.service';
import { User } from '../users/schemas/user.schema';
import { Booking } from '../bookings/schemas/booking.schema';
import { ReviewWithBookingDto } from './dto/review-with-booking.dto';

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

    // Validar ObjectId do booking
    if (!Types.ObjectId.isValid(dto.bookingId)) {
      throw new BadRequestException('ID do atendimento inválido.');
    }

    // Validar ObjectId do caregiver
    if (!Types.ObjectId.isValid(dto.caregiverId)) {
      throw new BadRequestException('ID do cuidador inválido.');
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

  async getReviewableBookings(clientId: string, caregiverId: string) {
    // Buscar todos os bookings completados do cliente com este cuidador
    const completedBookings = await this.bookingsService.getCompletedBookings(
      clientId, 
      caregiverId
    );

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

  async checkCanReview(clientId: string, caregiverId: string) {
    const reviewableBookings = await this.getReviewableBookings(clientId, caregiverId);

    return {
      canReview: reviewableBookings.length > 0,
      bookings: reviewableBookings,
      // Manter compatibilidade com código antigo
      bookingId: reviewableBookings.length > 0 ? reviewableBookings[0]._id : null,
    };
  }

  private async updateCaregiverRating(caregiverId: string) {
    const reviews = await this.reviewModel.find({
      caregiverId: new Types.ObjectId(caregiverId),
    });

    if (reviews.length === 0) return;

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = Math.round((totalRating / reviews.length) * 10) / 10;

    await this.caregiversService.updateRating(caregiverId, avgRating, reviews.length);
  }

 async getReviewsWithBookingDetails(caregiverId: string): Promise<ReviewWithBookingDto[]> {
  console.log('🔍 Buscando reviews para caregiverId:', caregiverId);
  
  try {
    if (!Types.ObjectId.isValid(caregiverId)) {
      throw new BadRequestException('ID do cuidador inválido.');
    }

    const reviews = await this.reviewModel
      .find({ caregiverId: new Types.ObjectId(caregiverId) })
      .sort({ createdAt: -1 })
      .populate({
        path: 'bookingId',
        select: 'serviceType serviceName startDate endDate patientName clientId',
        populate: {
          path: 'clientId',
          select: 'name avatar',
        }
      })
      .lean()
      .exec();

    console.log(`📦 ${reviews.length} review(s) encontrada(s)`);

    if (reviews.length === 0) {
      return [];
    }

    const formattedReviews: ReviewWithBookingDto[] = reviews
      .filter(review => review.bookingId) // Filtra reviews com booking válido
      .map((review: any) => {
        const bookingDetails = review.bookingId;
        const contractedBy = bookingDetails?.clientId;

        return {
          _id: review._id.toString(),
          rating: review.rating,
          comment: review.comment || '',
          createdAt: review.createdAt.toISOString(),
          
          booking: {
            _id: bookingDetails._id.toString(),
            startDate: bookingDetails.startDate?.toISOString(),
            endDate: bookingDetails.endDate?.toISOString(),
            
            contractedBy: {
              _id: contractedBy._id.toString(),
              name: contractedBy.name || 'Cliente não encontrado',
              avatar: contractedBy.avatar || undefined,
            },
          },
        };
      });

      console.log('✅ Reviews formatadas:', formattedReviews.length);
      
      return formattedReviews;
    } catch (error) {
      console.error('❌ Erro ao buscar reviews:', error);
      throw error;
    }
  }
}