'use client';

import { useState, useRef } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { addressService } from '@/services/address';

interface Props {
  value: string;
  onChange: (data: {
    city: string;
    state: string;
    lat?: string;
    lon?: string;
  }) => void;
}

const cache = new Map<string, any[]>();

export function CityAutocomplete({ value, onChange }: Props) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastQueryRef = useRef('');

  const formatLabel = (item: any) => {
    const addr = item.address || {};

    const city =
      addr.city || addr.town || addr.village || '';

    const state = addr.state || '';

    // 👇 "Campinas - SP"
    return `${city} - ${state}`;
  };

  const normalizeResults = (results: any[]) => {
    return results
      .filter((item: any) => {
        const addr = item.address || {};

        const city =
          addr.city || addr.town || addr.village;

        const state = addr.state;

        if (!city || !state) return false;

        // remove rua/bairro
        if (addr.road || addr.neighbourhood || addr.suburb) return false;

        return true;
      })
      .slice(0, 5); // 🔥 limite
  };

  const handleSearch = (text: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.length < 3) {
      setSuggestions([]);
      return;
    }

    // 🚫 evita repetir mesma busca
    if (text === lastQueryRef.current) return;

    lastQueryRef.current = text;

    // ⚡ cache
    if (cache.has(text)) {
      setSuggestions(cache.get(text)!);
      return;
    }

    setLoading(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const results = await addressService.searchByText(
          `${text}, Brasil`
        );

        const filtered = normalizeResults(results);

        cache.set(text, filtered); // salva cache

        setSuggestions(filtered);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 500);
  };

  const handleSelect = (item: any) => {
    const addr = item.address || {};

    const city =
      addr.city || addr.town || addr.village || '';

    const state = addr.state || '';

    onChange({
      city,
      state,
      lat: item.lat,
      lon: item.lon,
    });

    setSuggestions([]);
  };

  return (
    <div className="relative">
      <label className="text-sm font-medium text-gray-700 mb-1 block">
        Cidade *
      </label>

      <div className="relative">
        <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />

        <input
          type="text"
          value={value}
          onChange={(e) => {
            handleSearch(e.target.value);
            onChange({ city: e.target.value, state: '' });
          }}
          className="input-field !pl-10 !pr-10"
          placeholder="Digite sua cidade"
        />

        {loading && (
          <Loader2 className="absolute right-3.5 top-3.5 w-4 h-4 animate-spin" />
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="absolute z-20 w-full mt-1 bg-white border rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(item)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{formatLabel(item)}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}