// services/address.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class AddressService {
  // ⬇️ NOVO: Cache no frontend também
  private cache = new Map<string, any>();

  async searchByCep(cep: string) {
    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length !== 8) {
      return null;
    }

    // Verificar cache
    const cacheKey = `cep:${cleanCep}`;
    if (this.cache.has(cacheKey)) {
      console.log('📦 Frontend cache hit (CEP)');
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch(`${API_URL}/geocoding/cep?cep=${cleanCep}`);
      
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      const result = {
        cep: data.cep || cleanCep,
        logradouro: data.logradouro || data.address?.road || '',
        bairro: data.bairro || data.address?.suburb || '',
        localidade: data.localidade || data.address?.city || '',
        uf: data.uf || data.address?.state || '',
      };

      // Salvar no cache
      this.cache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      return null;
    }
  }

  async searchByText(query: string) {
    if (!query || query.trim().length < 4) {
      return [];
    }

    // Verificar cache
    const cacheKey = `search:${query.trim().toLowerCase()}`;
    if (this.cache.has(cacheKey)) {
      console.log('📦 Frontend cache hit (search)');
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch(
        `${API_URL}/geocoding/search?q=${encodeURIComponent(query.trim())}`
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      
      // Salvar no cache
      if (data && data.length > 0) {
        this.cache.set(cacheKey, data);
      }
      
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar endereço:', error);
      return [];
    }
  }

  async reverseGeocode(lat: number, lon: number) {
    const cacheKey = `reverse:${lat.toFixed(4)},${lon.toFixed(4)}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch(
        `${API_URL}/geocoding/reverse?lat=${lat}&lon=${lon}`
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      this.cache.set(cacheKey, data);
      
      return data;
    } catch (error) {
      console.error('Erro ao buscar coordenadas:', error);
      return null;
    }
  }

  // ⬇️ NOVO: Limpar cache se necessário
  clearCache() {
    this.cache.clear();
  }
}

export const addressService = new AddressService();