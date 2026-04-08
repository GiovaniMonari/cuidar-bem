// src/geocoding/geocoding.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { GeocodingService } from './geocoding.service';

@Controller('geocoding')
export class GeocodingController {
  constructor(private readonly geocodingService: GeocodingService) {}

  @Get('search')
  searchAddress(@Query('q') query: string) {
    return this.geocodingService.searchAddress(query);
  }

  @Get('reverse')
  reverseGeocode(
    @Query('lat') lat: string,
    @Query('lon') lon: string,
  ) {
    return this.geocodingService.reverseGeocode(
      parseFloat(lat),
      parseFloat(lon),
    );
  }

  @Get('cep')
  searchByCEP(@Query('cep') cep: string) {
    return this.geocodingService.searchByCEP(cep);
  }
}