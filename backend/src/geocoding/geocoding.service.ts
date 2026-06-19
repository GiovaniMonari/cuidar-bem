import { Injectable, HttpException, HttpStatus, Inject, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.constants';

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private readonly NOMINATIM_URL = 'https://nominatim.openstreetmap.org';
  
  // 🔄 CONFIGURAÇÃO DO CACHE NO REDIS
  private readonly CACHE_TTL_SECONDS = 60 * 60; // 1 hora em segundos (0.1.1)
  
  // ⬇️ Rate limiting interno (Mantido por instância)
  private lastRequestTime = 0;
  private readonly MIN_REQUEST_INTERVAL = 1100; // 1.1 segundos entre requisições

  constructor(
    // Injeta o cliente ioredis que consolidamos nas etapas anteriores
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  // ⬇️ Aguardar rate limit
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      const waitTime = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  // ⬇️ AUXILIAR: Buscar dados estruturados do Redis
  private async getFromRedisCache(key: string): Promise<any | null> {
    try {
      const cached = await this.redis.get(key);
      if (cached) {
        this.logger.log(`📦 Cache hit (Redis): ${key}`);
        return JSON.parse(cached);
      }
    } catch (error: any) {
      this.logger.error(`Falha ao ler cache do Redis para a chave ${key}: ${error.message}`);
    }
    return null;
  }

  // ⬇️ AUXILIAR: Salvar dados com expiração nativa no Redis
  private async saveToRedisCache(key: string, data: any): Promise<void> {
    try {
      // Salva a string JSON definindo o TTL usando a flag 'EX' (0.1.1)
      await this.redis.set(
        key,
        JSON.stringify(data),
        'EX',
        this.CACHE_TTL_SECONDS
      );
    } catch (error: any) {
      this.logger.error(`Falha ao salvar cache no Redis para a chave ${key}: ${error.message}`);
    }
  }

  private async geocodeCandidates(queries: string[]) {
    const uniqueQueries = Array.from(
      new Set(queries.map((query) => query.trim()).filter(Boolean)),
    );

    for (const query of uniqueQueries) {
      const results = await this.searchAddress(query);
      if (Array.isArray(results) && results.length > 0) {
        return results[0];
      }
    }

    return null;
  }

  async searchAddress(query: string) {
    if (!query || query.trim().length < 3) {
      return [];
    }

    const cacheKey = `cuidarbem:geocoding:search:${query.trim().toLowerCase()}`;
    
    // Verificar cache distribuído primeiro
    const cached = await this.getFromRedisCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Aguardar rate limit
      await this.waitForRateLimit();

      const params = new URLSearchParams({
        format: 'json',
        addressdetails: '1',
        countrycodes: 'br',
        limit: '5',
        q: query.trim(),
      });

      console.log(`🌍 Nominatim request: ${query}`);

      const response = await fetch(`${this.NOMINATIM_URL}/search?${params}`, {
        headers: {
          'User-Agent': 'CuidarBem/1.0 (contact@cuidarbem.com)',
          'Accept-Language': 'pt-BR,pt',
        },
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.warn('⚠️ Nominatim rate limit atingido, aguardando...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          return this.searchAddress(query); // Retry
        }
        throw new Error(`Nominatim API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Salvar no Redis
      await this.saveToRedisCache(cacheKey, data);
      
      return data;
    } catch (error: any) {
      console.error('Erro ao buscar endereço:', error.message);
      return [];
    }
  }

  async reverseGeocode(lat: number, lon: number) {
    const cacheKey = `cuidarbem:geocoding:reverse:${lat.toFixed(4)},${lon.toFixed(4)}`;
    
    // Verificar cache distribuído primeiro
    const cached = await this.getFromRedisCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      await this.waitForRateLimit();

      const params = new URLSearchParams({
        format: 'json',
        lat: lat.toString(),
        lon: lon.toString(),
        addressdetails: '1',
      });

      const response = await fetch(`${this.NOMINATIM_URL}/reverse?${params}`, {
        headers: {
          'User-Agent': 'CuidarBem/1.0 (contact@cuidarbem.com)',
          'Accept-Language': 'pt-BR,pt',
        },
      });

      if (!response.ok) {
        if (response.status === 429) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          return this.reverseGeocode(lat, lon);
        }
        throw new Error(`Nominatim API error: ${response.status}`);
      }

      const data = await response.json();
      await this.saveToRedisCache(cacheKey, data);
      
      return data;
    } catch (error: any) {
      console.error('Erro ao buscar coordenadas:', error.message);
      return null;
    }
  }

  async searchByCEP(cep: string) {
    const cleanCEP = cep.replace(/\D/g, '');

    if (cleanCEP.length !== 8) {
      throw new HttpException('CEP inválido', HttpStatus.BAD_REQUEST);
    }

    const cacheKey = `cuidarbem:geocoding:cep:${cleanCEP}`;
    
    // Verificar cache distribuído primeiro
    const cached = await this.getFromRedisCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);

      if (!response.ok) {
        const errorBody = await response.text().catch(() => 'Não foi possível ler o body');
        console.error(
          `Erro HTTP ViaCEP (${response.status} ${response.statusText}): ${errorBody.slice(0, 500)}`,
        );
        throw new Error('Erro ao buscar CEP');
      }

      const data = await response.json();

      if (data.erro) {
        throw new HttpException('CEP não encontrado', HttpStatus.NOT_FOUND);
      }

      const geocoded = await this.geocodeCandidates([
        `${cleanCEP}, Brasil`,
        `${data.logradouro || ''}, ${data.localidade}, ${data.uf}, Brasil`,
        `${data.logradouro || ''}, ${data.bairro || ''}, ${data.localidade}, ${data.uf}, Brasil`,
        `${data.bairro || ''}, ${data.localidade}, ${data.uf}, Brasil`,
      ]);

      const result = {
        display_name: `${data.logradouro || ''}, ${data.bairro || ''}, ${data.localidade} - ${data.uf}, ${cleanCEP}, Brasil`.replace(/^, /, ''),
        address: {
          road: data.logradouro || '',
          suburb: data.bairro || '',
          city: data.localidade,
          state: data.uf,
          postcode: cleanCEP,
          country: 'Brasil',
         },
        lat: geocoded?.lat || '',
        lon: geocoded?.lon || '',
        cep: cleanCEP,
        logradouro: data.logradouro || '',
        bairro: data.bairro || '',
        localidade: data.localidade,
        uf: data.uf,
      };

      await this.saveToRedisCache(cacheKey, result);
      
      return result;
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Erro ao buscar CEP:', error.message);
      throw new HttpException(
        'Erro ao buscar CEP',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
