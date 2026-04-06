import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ServicesService } from './services.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  findAll(@Query('category') category?: string) {
    return this.servicesService.findAll(category);
  }

  @Get(':key')
  findByKey(@Param('key') key: string) {
    return this.servicesService.findByKey(key);
  }

  @Get(':key/calculate')
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
  resetServices() {
    return this.servicesService.resetServices();
  }
}