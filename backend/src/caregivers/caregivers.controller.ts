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
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CaregiversService } from './caregivers.service';
import { CreateCaregiverDto } from './dto/create-caregiver.dto';
import { FilterCaregiverDto } from './dto/filter-caregiver.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Caregivers')
@Controller('caregivers')
export class CaregiversController {
  constructor(private readonly caregiversService: CaregiversService) {}

  @Get()
  @ApiOperation({ summary: 'Listar cuidadores com filtros opcionais' })
  @ApiQuery({ name: 'city', required: false, type: String })
  @ApiQuery({ name: 'state', required: false, type: String })
  @ApiQuery({ name: 'specialty', required: false, type: String })
  findAll(@Query() filters: FilterCaregiverDto) {
    return this.caregiversService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar um cuidador por id' })
  findOne(@Param('id') id: string) {
    return this.caregiversService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('user/me')
  @ApiOperation({ summary: 'Obter perfil de cuidador autenticado' })
  findMyProfile(@Request() req) {
    return this.caregiversService.findByUserId(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Criar perfil de cuidador' })
  @ApiBody({ type: CreateCaregiverDto })
  create(@Request() req, @Body() dto: CreateCaregiverDto) {
    return this.caregiversService.create(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put(':id')
  @ApiOperation({ summary: 'Atualizar perfil de cuidador' })
  @ApiBody({ type: CreateCaregiverDto })
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