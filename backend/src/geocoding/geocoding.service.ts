// src/geocoding/geocoding.service.ts
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class GeocodingService {
  private readonly NOMINATIM_URL = 'https://nominatim.openstreetmap.org';
  
  // ⬇️ NOVO: Cache para evitar requisições repetidas
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 1000 * 60 * 60; // 1 hora
  
  // ⬇️ NOVO: Rate limiting
  private lastRequestTime = 0;
  private readonly MIN_REQUEST_INTERVAL = 1100; // 1.1 segundos entre requisições

  // ⬇️ NOVO: Aguardar rate limit
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      const waitTime = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  // ⬇️ NOVO: Verificar cache
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    
    if (cached) {
      const isExpired = Date.now() - cached.timestamp > this.CACHE_TTL;
      
      if (!isExpired) {
        console.log(`📦 Cache hit: ${key}`);
        return cached.data;
      }
      
      // Limpar cache expirado
      this.cache.delete(key);
    }
    
    return null;
  }

  // ⬇️ NOVO: Salvar no cache
  private saveToCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
    
    // Limpar cache antigo se ficar muito grande
    if (this.cache.size > 1000) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
  }

  async searchAddress(query: string) {
    if (!query || query.trim().length < 3) {
      return [];
    }

    const cacheKey = `search:${query.trim().toLowerCase()}`;
    
    // Verificar cache primeiro
    const cached = this.getFromCache(cacheKey);
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
          'User-Agent': 'CuidarBem/1.0 (contact@cuidarbem.com)', // ⬅️ User-Agent obrigatório
          'Accept-Language': 'pt-BR,pt',
        },
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.warn('⚠️ Nominatim rate limit atingido, aguardando...');
          // Aguardar mais tempo e tentar novamente
          await new Promise(resolve => setTimeout(resolve, 2000));
          return this.searchAddress(query); // Retry
        }
        throw new Error(`Nominatim API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Salvar no cache
      this.saveToCache(cacheKey, data);
      
      return data;
    } catch (error: any) {
      console.error('Erro ao buscar endereço:', error.message);
      
      // Retornar array vazio em vez de erro para não quebrar o frontend
      return [];
    }
  }

  async reverseGeocode(lat: number, lon: number) {
    const cacheKey = `reverse:${lat.toFixed(4)},${lon.toFixed(4)}`;
    
    // Verificar cache primeiro
    const cached = this.getFromCache(cacheKey);
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
      this.saveToCache(cacheKey, data);
      
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

    const cacheKey = `cep:${cleanCEP}`;
    
    // Verificar cache primeiro
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // ViaCEP não tem rate limiting rigoroso
      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);

      if (!response.ok) {
        throw new Error('Erro ao buscar CEP');
      }

      const data = await response.json();

      if (data.erro) {
        throw new HttpException('CEP não encontrado', HttpStatus.NOT_FOUND);
      }

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
        // Dados originais do ViaCEP para compatibilidade
        cep: cleanCEP,
        logradouro: data.logradouro || '',
        bairro: data.bairro || '',
        localidade: data.localidade,
        uf: data.uf,
      };

      this.saveToCache(cacheKey, result);
      
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