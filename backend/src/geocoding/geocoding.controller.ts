// src/geocoding/geocoding.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { GeocodingService } from './geocoding.service';

@ApiTags('Geocoding')
@Controller('geocoding')
export class GeocodingController {
  constructor(private readonly geocodingService: GeocodingService) {}

  @Get('search')
  @ApiOperation({ summary: 'Buscar endereço por texto' })
  @ApiQuery({ name: 'q', description: 'Texto para busca do endereço' })
  searchAddress(@Query('q') query: string) {
    return this.geocodingService.searchAddress(query);
  }

  @Get('reverse')
  @ApiOperation({ summary: 'Buscar endereço a partir de latitude e longitude' })
  @ApiQuery({ name: 'lat', type: Number })
  @ApiQuery({ name: 'lon', type: Number })
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
  @ApiOperation({ summary: 'Buscar endereço por CEP' })
  @ApiQuery({ name: 'cep', description: 'CEP para consulta' })
  searchByCEP(@Query('cep') cep: string) {
    return this.geocodingService.searchByCEP(cep);
  }
}