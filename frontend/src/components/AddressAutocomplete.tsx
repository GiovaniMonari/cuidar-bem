// components/AddressAutocomplete.tsx
'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { addressService } from '@/services/address';
import { maskCep } from '@/utils/masks';
import {
  MapPin,
  Loader2,
  CheckCircle,
  Home,
  Building,
} from 'lucide-react';

interface Props {
  value: string;
  cep: string;
  number?: string;
  complement?: string;
  onChange: (data: {
    cep?: string;
    address?: string;
    number?: string;
    complement?: string;
    fullAddress?: string;
    lat?: string;
    lon?: string;
  }) => void;
}

export function AddressAutocomplete({ value, cep, number = '', complement = '', onChange }: Props) {
  const [cepLoading, setCepLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: string; lon: string } | null>(null);
  const [localNumber, setLocalNumber] = useState(number);
  const [localComplement, setLocalComplement] = useState(complement);
  
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sincronizar props com estado local
  useEffect(() => {
    setLocalNumber(number);
  }, [number]);

  useEffect(() => {
    setLocalComplement(complement);
  }, [complement]);

  const mapUrl = useMemo(() => {
    if (!selectedCoords) return null;

    return `https://www.openstreetmap.org/export/embed.html?bbox=${
      Number(selectedCoords.lon) - 0.005
    }%2C${Number(selectedCoords.lat) - 0.005}%2C${
      Number(selectedCoords.lon) + 0.005
    }%2C${Number(selectedCoords.lat) + 0.005}&layer=mapnik&marker=${selectedCoords.lat}%2C${selectedCoords.lon}`;
  }, [selectedCoords]);

  // Montar endereço completo
  const buildFullAddress = useCallback((baseAddress: string, num: string, comp: string) => {
    let full = baseAddress;
    
    if (num) {
      // Inserir número após a rua (antes da primeira vírgula)
      const parts = baseAddress.split(',');
      if (parts.length > 0) {
        parts[0] = `${parts[0].trim()}, ${num}`;
        full = parts.join(',');
      } else {
        full = `${baseAddress}, ${num}`;
      }
    }
    
    if (comp) {
      // Adicionar complemento após o número
      const parts = full.split(',');
      if (parts.length > 1) {
        parts[1] = ` ${comp}${parts[1]}`;
        full = parts.join(',');
      } else {
        full = `${full} - ${comp}`;
      }
    }
    
    return full;
  }, []);

  const handleCepSearch = async () => {
    if (!cep || cep.replace(/\D/g, '').length < 8) {
      alert('Digite um CEP válido');
      return;
    }

    setCepLoading(true);
    try {
      const result = await addressService.searchByCep(cep);
      if (result) {
        const baseAddress = [
          result.logradouro,
          result.bairro,
          result.localidade,
          result.uf,
          result.cep,
        ]
          .filter(Boolean)
          .join(', ');

        const fullAddress = buildFullAddress(baseAddress, localNumber, localComplement);

        onChange({
          cep: result.cep,
          address: baseAddress,
          number: localNumber,
          complement: localComplement,
          fullAddress,
        });

        // Buscar coordenadas pelo endereço completo
        const geo = await addressService.searchByText(baseAddress);
        if (geo.length > 0) {
          setSelectedCoords({ lat: geo[0].lat, lon: geo[0].lon });
          onChange({ 
            cep: result.cep,
            address: baseAddress,
            number: localNumber,
            complement: localComplement,
            fullAddress,
            lat: geo[0].lat, 
            lon: geo[0].lon 
          });
        }
        
        setSuggestions([]);
      } else {
        alert('CEP não encontrado.');
      }
    } catch {
      alert('Erro ao buscar CEP.');
    } finally {
      setCepLoading(false);
    }
  };

  const debouncedSearch = useCallback((text: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (text.trim().length < 4) {
      setSuggestions([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const results = await addressService.searchByText(text);
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      } finally {
        setSearchLoading(false);
      }
    }, 1000);
  }, []);

  const handleTextSearch = (text: string) => {
    const fullAddress = buildFullAddress(text, localNumber, localComplement);
    onChange({ address: text, fullAddress });
    debouncedSearch(text);
  };

  const handleSelectSuggestion = (item: any) => {
    const fullAddress = buildFullAddress(item.display_name, localNumber, localComplement);
    
    onChange({
      address: item.display_name,
      number: localNumber,
      complement: localComplement,
      fullAddress,
      lat: item.lat,
      lon: item.lon,
    });
    setSelectedCoords({ lat: item.lat, lon: item.lon });
    setSuggestions([]);
  };

  const handleNumberChange = (newNumber: string) => {
    setLocalNumber(newNumber);
    const fullAddress = buildFullAddress(value, newNumber, localComplement);
    onChange({ 
      number: newNumber, 
      fullAddress 
    });
  };

  const handleComplementChange = (newComplement: string) => {
    setLocalComplement(newComplement);
    const fullAddress = buildFullAddress(value, localNumber, newComplement);
    onChange({ 
      complement: newComplement, 
      fullAddress 
    });
  };

  return (
    <div className="space-y-4">
      {/* CEP */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">
          CEP
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={cep}
            onChange={(e) => onChange({ cep: maskCep(e.target.value) })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCepSearch();
              }
            }}
            className="input-field"
            placeholder="00000-000"
            maxLength={9}
          />
          <button
            type="button"
            onClick={handleCepSearch}
            disabled={cepLoading}
            className="btn-secondary !px-4 !py-2 whitespace-nowrap disabled:opacity-50"
          >
            {cepLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Buscar CEP'
            )}
          </button>
        </div>
      </div>

      {/* Busca por endereço */}
      <div className="relative">
        <label className="text-sm font-medium text-gray-700 mb-1 block">
          Endereço *
        </label>
        <div className="relative">
          <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={value}
            onChange={(e) => handleTextSearch(e.target.value)}
            onFocus={() => value.length >= 4 && suggestions.length === 0 && debouncedSearch(value)}
            className="input-field !pl-10 !pr-10"
            placeholder="Rua, Avenida, bairro, cidade"
            required
          />
          {searchLoading && (
            <Loader2 className="absolute right-3.5 top-3.5 w-4 h-4 text-primary-600 animate-spin" />
          )}
        </div>

        {/* Sugestões */}
        {suggestions.length > 0 && (
          <div className="absolute z-20 w-full mt-1 border border-gray-200 rounded-xl bg-white shadow-lg overflow-hidden max-h-64 overflow-y-auto">
            {suggestions.map((item, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelectSuggestion(item)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 text-sm text-gray-700 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{item.display_name}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Nenhum resultado */}
        {!searchLoading && value.length >= 4 && suggestions.length === 0 && (
          <p className="text-xs text-gray-500 mt-1">
            Digite mais detalhes do endereço para encontrar sugestões
          </p>
        )}
      </div>

      {/* Número e Complemento */}
      <div className="grid grid-cols-2 gap-4">
        {/* Número */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Número *
          </label>
          <div className="relative">
            <Home className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={localNumber}
              onChange={(e) => handleNumberChange(e.target.value)}
              className="input-field !pl-10"
              placeholder="123"
              required
            />
          </div>
        </div>

        {/* Complemento */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Complemento
          </label>
          <div className="relative">
            <Building className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={localComplement}
              onChange={(e) => handleComplementChange(e.target.value)}
              className="input-field !pl-10"
              placeholder="Apto 101, Bloco A"
            />
          </div>
        </div>
      </div>

      {/* Endereço completo (preview) */}
      {value && localNumber && (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <label className="text-xs font-medium text-gray-500 mb-1 block">
            Endereço completo
          </label>
          <p className="text-sm text-gray-800">
            {buildFullAddress(value, localNumber, localComplement)}
          </p>
        </div>
      )}

      {/* Mapa */}
      {mapUrl && (
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Localização confirmada
          </label>
          <div className="rounded-xl overflow-hidden border border-gray-200 h-48">
            <iframe
              title="Mapa do endereço"
              src={mapUrl}
              className="w-full h-full border-0"
              loading="lazy"
            />
          </div>
        </div>
      )}
    </div>
  );
}