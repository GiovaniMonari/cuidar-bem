import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CaregiversService } from './caregivers.service';
import { CreateCaregiverDto } from './dto/create-caregiver.dto';
import { FilterCaregiverDto } from './dto/filter-caregiver.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('caregivers')
export class CaregiversController {
  constructor(private readonly caregiversService: CaregiversService) {}

  @Get()
  findAll(@Query() filters: FilterCaregiverDto) {
    return this.caregiversService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.caregiversService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('user/me')
  findMyProfile(@Request() req) {
    return this.caregiversService.findByUserId(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req, @Body() dto: CreateCaregiverDto) {
    return this.caregiversService.create(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(
    @Param('id') id: string,
    @Request() req,
    @Body() dto: Partial<CreateCaregiverDto>,
  ) {
    return this.caregiversService.update(id, req.user.userId, dto);
  }

  @Get(':id/availability')
  getAvailability(@Param('id') id: string) {
    return this.caregiversService.getAvailability(id);
  }

  @Get(':id/booked-dates')
  getBookedDates(@Param('id') id: string) {
    return this.caregiversService.getBookedDates(id);
  }

  @Get(':id/bookings')
  getCaregiverBookings(@Param('id') id: string) {
    return this.caregiversService.getCaregiverBookings(id);
  }
}