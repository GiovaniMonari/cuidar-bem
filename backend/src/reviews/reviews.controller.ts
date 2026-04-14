// reviews.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Types } from 'mongoose';
import { ReviewWithBookingDto } from './dto/review-with-booking.dto';
import { CaregiversService } from '../caregivers/caregivers.service'; // Add this import

@Controller('reviews')
export class ReviewsController {
  constructor(
    private readonly reviewsService: ReviewsService,
    private readonly caregiversService: CaregiversService, // Add this injection
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(req.user.userId, dto);
  }

  @Get('caregiver/:caregiverId')
  findByCaregiver(@Param('caregiverId') caregiverId: string) {
    if (!Types.ObjectId.isValid(caregiverId)) {
      throw new BadRequestException('ID do cuidador inválido.');
    }
    return this.reviewsService.findByCaregiver(caregiverId);
  }

  @Get('can-review/:caregiverId')
  @UseGuards(JwtAuthGuard)
  canReview(@Request() req, @Param('caregiverId') caregiverId: string) {
    if (!Types.ObjectId.isValid(caregiverId)) {
      throw new BadRequestException('ID do cuidador inválido.');
    }
    return this.reviewsService.checkCanReview(req.user.userId, caregiverId);
  }

  @Get('reviewable-bookings/:caregiverId')
  @UseGuards(JwtAuthGuard)
  getReviewableBookings(@Request() req, @Param('caregiverId') caregiverId: string) {
    if (!Types.ObjectId.isValid(caregiverId)) {
      throw new BadRequestException('ID do cuidador inválido.');
    }
    return this.reviewsService.getReviewableBookings(req.user.userId, caregiverId);
  }

  @Get('my-reviews')
  @UseGuards(JwtAuthGuard)
  async getMyReviews(@Request() req): Promise<ReviewWithBookingDto[]> {
    const userId = req.user.userId;
    
    // Busca o caregiverId a partir do userId
    const caregiver = await this.caregiversService.findByUserId(userId);
    
    if (!caregiver) {
      throw new NotFoundException('Perfil de cuidador não encontrado');
    }
    
    return this.reviewsService.getReviewsWithBookingDetails(caregiver._id.toString());
  }
}