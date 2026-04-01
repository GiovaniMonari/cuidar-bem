import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Review, ReviewDocument } from './schemas/review.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { CaregiversService } from '../caregivers/caregivers.service';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    private caregiversService: CaregiversService,
  ) {}

  async create(clientId: string, dto: CreateReviewDto): Promise<ReviewDocument> {
    const review = new this.reviewModel({ ...dto, clientId });
    const saved = await review.save();

    // Update caregiver rating
    await this.caregiversService.updateRating(dto.caregiverId, dto.rating);

    return saved.populate('clientId', 'name avatar');
  }

  async findByCaregiver(caregiverId: string) {
    return this.reviewModel
      .find({ caregiverId })
      .populate('clientId', 'name avatar')
      .sort({ createdAt: -1 });
  }
}