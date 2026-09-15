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
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
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
  @ApiParam({ name: 'id', description: 'ID do cuidador' })
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
  @ApiParam({ name: 'id', description: 'ID do cuidador' })
  @ApiBody({ type: CreateCaregiverDto })
  update(
    @Param('id') id: string,
    @Request() req,
    @Body() dto: Partial<CreateCaregiverDto>,
  ) {
    return this.caregiversService.update(id, req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':id/professional-verification')
  @ApiOperation({ summary: 'Enviar documento para verificação profissional' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', required: ['file'], properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => {
      const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
      callback(null, allowed.includes(file.mimetype));
    },
  }))
  submitProfessionalVerification(
    @Param('id') id: string,
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Envie um PDF ou uma imagem do comprovante profissional.');
    }
    return this.caregiversService.submitProfessionalVerification(id, req.user.userId, file);
  }

  @Get(':id/availability')
  @ApiOperation({ summary: 'Consultar disponibilidade de um cuidador' })
  @ApiParam({ name: 'id', description: 'ID do cuidador' })
  getAvailability(@Param('id') id: string) {
    return this.caregiversService.getAvailability(id);
  }

  @Get(':id/booked-dates')
  @ApiOperation({ summary: 'Listar datas ocupadas de um cuidador' })
  @ApiParam({ name: 'id', description: 'ID do cuidador' })
  getBookedDates(@Param('id') id: string) {
    return this.caregiversService.getBookedDates(id);
  }

  @Get(':id/bookings')
  @ApiOperation({ summary: 'Listar agendamentos de um cuidador' })
  @ApiParam({ name: 'id', description: 'ID do cuidador' })
  getCaregiverBookings(@Param('id') id: string) {
    return this.caregiversService.getCaregiverBookings(id);
  }
}