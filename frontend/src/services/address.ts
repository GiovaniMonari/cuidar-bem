export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export interface NominatimAddress {
  display_name: string;
  lat: string;
  lon: string;
}

class AddressService {
  async searchByCep(cep: string): Promise<ViaCepResponse | null> {
    const cleanCep = cep.replace(/\D/g, '');

    if (cleanCep.length !== 8) return null;

    const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    const data = await res.json();

    if (data.erro) return null;
    return data;
  }

  async searchByText(query: string): Promise<NominatimAddress[]> {
    if (!query || query.trim().length < 3) return [];

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=br&limit=5&q=${encodeURIComponent(query)}`,
      {
        headers: {
          'Accept-Language': 'pt-BR',
        },
      },
    );

    return res.json();
  }
}

export const addressService = new AddressService();