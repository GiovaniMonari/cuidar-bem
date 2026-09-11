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
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CheckInBookingDto } from './dto/check-in-booking.dto';

@ApiTags('Bookings')
@ApiBearerAuth()
@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo agendamento' })
  @ApiBody({ type: CreateBookingDto })
  create(@Request() req, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(req.user.userId, dto, req.user);
  }

  @Get('my')
  @ApiOperation({ summary: 'Listar agendamentos do usuário autenticado' })
  findMy(@Request() req) {
    if (req.user.role === 'caregiver') {
      return this.bookingsService.findByCaregiver(req.user.userId);
    }
    return this.bookingsService.findByClient(req.user.userId);
  }

  @Get('can-review/:caregiverId')
  @ApiOperation({ summary: 'Verificar se o usuário pode avaliar um cuidador' })
  @ApiParam({ name: 'caregiverId', description: 'ID do cuidador' })
  canReview(@Request() req, @Param('caregiverId') caregiverId: string) {
    return this.bookingsService.canReview(req.user.userId, caregiverId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar um agendamento por ID' })
  @ApiParam({ name: 'id', description: 'ID do agendamento' })
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @Post(':id/check-in')
  @ApiOperation({ summary: 'Registrar check-in do agendamento' })
  @ApiParam({ name: 'id', description: 'ID do agendamento' })
  @ApiBody({ type: CheckInBookingDto })
  checkIn(@Param('id') id: string, @Request() req, @Body() dto: CheckInBookingDto) {
    return this.bookingsService.checkIn(
      id,
      req.user.userId,
      req.user.role,
      dto.latitude,
      dto.longitude,
    );
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Atualizar status do agendamento' })
  @ApiParam({ name: 'id', description: 'ID do agendamento' })
  @ApiBody({ schema: { type: 'object', required: ['status'], properties: { status: { type: 'string', example: 'confirmed' } } } })
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
