import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@ApiTags('Feedback')
@ApiBearerAuth()
@Controller('feedback')
@UseGuards(JwtAuthGuard)
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) { }

  @Post()
  @ApiOperation({ summary: 'Criar feedback de um cuidador' })
  @ApiBody({ type: CreateFeedbackDto })
  async create(@Body() createFeedbackDto: CreateFeedbackDto, @Req() req: any) {
    const { role } = req.user;

    if (role !== 'caregiver') {
      throw new BadRequestException('Apenas cuidadores podem enviar feedback');
    }

    return this.feedbackService.create(createFeedbackDto, req.user.userId);
  }

  // ✅ IMPORTANTE: Esta rota deve vir ANTES de @Get(':id')
  @Get('sent')
  @ApiOperation({ summary: 'Listar feedbacks enviados pelo cuidador autenticado' })
  async findSent(@Req() req: any) {
    const { role } = req.user;

    if (role !== 'caregiver') {
      throw new BadRequestException('Apenas cuidadores têm feedbacks enviados');
    }

    return this.feedbackService.findByCaregiverSent(req.user.userId);
  }

  // ✅ IMPORTANTE: Esta rota deve vir ANTES de @Get(':id')
  @Get('booking/:bookingId')
  @ApiOperation({ summary: 'Listar feedbacks de um agendamento' })
  @ApiParam({ name: 'bookingId', description: 'ID do agendamento' })
  async findByBooking(@Param('bookingId') bookingId: string, @Req() req: any) {
    return this.feedbackService.findByBooking(bookingId, req.user.userId);
  }

  // ✅ IMPORTANTE: Esta rota deve vir ANTES de @Get(':id')
  @Get('check/:bookingId/:dayNumber')
  @ApiOperation({ summary: 'Verificar se já existe feedback para um dia específico' })
  async checkDayFeedback(
    @Param('bookingId') bookingId: string,
    @Param('dayNumber') dayNumber: string,
  ) {
    const dayNum = parseInt(dayNumber, 10);
    if (isNaN(dayNum) || dayNum < 1) {
      throw new BadRequestException('Dia inválido');
    }

    const exists = await this.feedbackService.existsForDay(bookingId, dayNum);
    return { exists, dayNumber: dayNum };
  }

  // ⚠️ Esta rota deve vir POR ÚLTIMO (rotas com parâmetros dinâmicos)
  @Get(':id')
  @ApiOperation({ summary: 'Buscar feedback por id' })
  @ApiParam({ name: 'id', description: 'ID do feedback' })
  async findById(@Param('id') id: string) {
    return this.feedbackService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar feedback existente' })
  @ApiParam({ name: 'id', description: 'ID do feedback' })
  @ApiBody({ type: CreateFeedbackDto })
  async update(
    @Param('id') id: string,
    @Body() updateFeedbackDto: Partial<CreateFeedbackDto>,
    @Req() req: any,
  ) {
    const { role } = req.user;

    if (role !== 'caregiver') {
      throw new BadRequestException('Apenas cuidadores podem atualizar feedbacks');
    }

    return this.feedbackService.update(id, updateFeedbackDto, req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover feedback' })
  @ApiParam({ name: 'id', description: 'ID do feedback' })
  async delete(@Param('id') id: string, @Req() req: any) {
    const { role } = req.user;

    if (role !== 'caregiver') {
      throw new BadRequestException('Apenas cuidadores podem deletar feedbacks');
    }

    return this.feedbackService.delete(id, req.user.userId);
  }
}