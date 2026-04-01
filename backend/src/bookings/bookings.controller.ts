import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  create(@Request() req, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(req.user.userId, dto);
  }

  @Get('my')
  findMy(@Request() req) {
    if (req.user.role === 'caregiver') {
      return this.bookingsService.findByCaregiver(req.user.userId);
    }
    return this.bookingsService.findByClient(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @Put(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Request() req,
    @Body('status') status: string,
  ) {
    return this.bookingsService.updateStatus(
      id,
      req.user.userId,
      status,
      req.user.role,
    );
  }
}