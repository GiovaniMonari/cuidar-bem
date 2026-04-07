'use client';

import { useState } from 'react';
import { addressService } from '@/services/address';
import {
  MapPin,
  Search,
  Loader2,
  CheckCircle,
} from 'lucide-react';

interface Props {
  value: string;
  cep: string;
  onChange: (data: {
    cep?: string;
    address?: string;
  }) => void;
}

export function AddressAutocomplete({ value, cep, onChange }: Props) {
  const [cepLoading, setCepLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const handleCepSearch = async () => {
    if (!cep) return;

    setCepLoading(true);
    try {
      const result = await addressService.searchByCep(cep);
      if (result) {
        const fullAddress = [
          result.logradouro,
          result.bairro,
          result.localidade,
          result.uf,
          result.cep,
        ]
          .filter(Boolean)
          .join(', ');

        onChange({
          cep: result.cep,
          address: fullAddress,
        });
      } else {
        alert('CEP não encontrado.');
      }
    } catch {
      alert('Erro ao buscar CEP.');
    } finally {
      setCepLoading(false);
    }
  };

  const handleTextSearch = async (text: string) => {
    onChange({ address: text });

    if (text.length < 4) {
      setSuggestions([]);
      return;
    }

    setSearchLoading(true);
    try {
      const results = await addressService.searchByText(text);
      setSuggestions(results);
    } catch {
      setSuggestions([]);
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* CEP */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">
          CEP
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={cep}
            onChange={(e) => onChange({ cep: e.target.value })}
            className="input-field"
            placeholder="00000-000"
          />
          <button
            type="button"
            onClick={handleCepSearch}
            className="btn-secondary !px-4 !py-2 whitespace-nowrap"
          >
            {cepLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Buscar CEP'
            )}
          </button>
        </div>
      </div>

      {/* Endereço */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">
          Endereço do Atendimento *
        </label>
        <div className="relative">
          <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={value}
            onChange={(e) => handleTextSearch(e.target.value)}
            className="input-field !pl-10"
            placeholder="Rua, número, bairro, cidade"
            required
          />
        </div>

        {/* Sugestões */}
        {searchLoading && (
          <div className="mt-2 text-sm text-gray-500 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Buscando endereços...
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="mt-2 border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
            {suggestions.map((item, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  onChange({ address: item.display_name });
                  setSuggestions([]);
                }}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 text-sm text-gray-700"
              >
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{item.display_name}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}