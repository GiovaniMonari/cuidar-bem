// reviews.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(req.user.userId, dto);
  }

  @Get('caregiver/:caregiverId')
  findByCaregiver(@Param('caregiverId') caregiverId: string) {
    return this.reviewsService.findByCaregiver(caregiverId);
  }

  @Get('can-review/:caregiverId')
  @UseGuards(JwtAuthGuard)
  canReview(@Request() req, @Param('caregiverId') caregiverId: string) {
    return this.reviewsService.checkCanReview(req.user.userId, caregiverId);
  }

  // ⬇️ NOVO: Endpoint para pegar bookings que podem ser avaliados
  @Get('reviewable-bookings/:caregiverId')
  @UseGuards(JwtAuthGuard)
  getReviewableBookings(@Request() req, @Param('caregiverId') caregiverId: string) {
    return this.reviewsService.getReviewableBookings(req.user.userId, caregiverId);
  }
}