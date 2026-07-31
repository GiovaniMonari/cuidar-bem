import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar serviços disponíveis' })
  @ApiQuery({ name: 'category', required: false, type: String })
  findAll(@Query('category') category?: string) {
    return this.servicesService.findAll(category);
  }

  @Get(':key')
  @ApiOperation({ summary: 'Buscar um serviço pelo identificador' })
  @ApiParam({ name: 'key', description: 'Chave do serviço' })
  findByKey(@Param('key') key: string) {
    return this.servicesService.findByKey(key);
  }

  @Get(':key/calculate')
  @ApiOperation({ summary: 'Calcular preço de um serviço' })
  @ApiParam({ name: 'key', description: 'Chave do serviço' })
  @ApiQuery({ name: 'duration', required: true, type: String })
  @ApiQuery({ name: 'pricePerHour', required: false, type: Number })
  calculatePrice(
    @Param('key') serviceKey: string,
    @Query('duration') durationKey: string,
    @Query('pricePerHour') pricePerHour?: string,
  ) {
    return this.servicesService.calculatePrice(
      serviceKey,
      durationKey,
      pricePerHour ? Number(pricePerHour) : undefined,
    );
  }

  // Endpoint para resetar serviços (apenas desenvolvimento)
  @Post('reset')
  @ApiOperation({ summary: 'Resetar catálogo de serviços (apenas desenvolvimento)' })
  resetServices() {
    return this.servicesService.resetServices();
  }
}