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

  @Get('caregiver/:id')
  findByCaregiver(@Param('id') id: string) {
    return this.reviewsService.findByCaregiver(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('can-review/:caregiverId')
  canReview(@Request() req, @Param('caregiverId') caregiverId: string) {
    return this.reviewsService.checkCanReview(req.user.userId, caregiverId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(req.user.userId, dto);
  }
}