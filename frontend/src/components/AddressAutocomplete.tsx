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
  lat?: string;
  lon?: string;
  isValidated?: boolean;
  onChange: (data: {
    cep?: string;
    address?: string;
    number?: string;
    complement?: string;
    fullAddress?: string;
    lat?: string;
    lon?: string;
  }) => void;
  onValidationChange?: (isValidated: boolean) => void;
}

export function AddressAutocomplete({
  value,
  cep,
  number = '',
  complement = '',
  lat = '',
  lon = '',
  isValidated = false,
  onChange,
  onValidationChange,
}: Props) {
  const [cepLoading, setCepLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: string; lon: string } | null>(null);
  const [localNumber, setLocalNumber] = useState(number);
  const [localComplement, setLocalComplement] = useState(complement);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const [hasResolvedCep, setHasResolvedCep] = useState(false);
  const [cepBaseAddress, setCepBaseAddress] = useState('');
  
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const validationRef = useRef<NodeJS.Timeout | null>(null);

  // Sincronizar props com estado local
  useEffect(() => {
    setLocalNumber(number);
  }, [number]);

  useEffect(() => {
    setLocalComplement(complement);
  }, [complement]);

  useEffect(() => {
    if (lat && lon) {
      setSelectedCoords({ lat, lon });
      return;
    }

    setSelectedCoords(null);
  }, [lat, lon]);

  useEffect(() => {
    const cleanCep = cep.replace(/\D/g, '');

    if (cleanCep.length === 8 && (isValidated || (lat && lon))) {
      setHasResolvedCep(true);
      if (value.trim()) {
        setCepBaseAddress(value.trim());
      }
    }
  }, [cep, isValidated, lat, lon, value]);

  const mapUrl = useMemo(() => {
    if (!selectedCoords) return null;

    return `https://www.openstreetmap.org/export/embed.html?bbox=${
      Number(selectedCoords.lon) - 0.005
    }%2C${Number(selectedCoords.lat) - 0.005}%2C${
      Number(selectedCoords.lon) + 0.005
    }%2C${Number(selectedCoords.lat) + 0.005}&layer=mapnik&marker=${selectedCoords.lat}%2C${selectedCoords.lon}`;
  }, [selectedCoords]);

  const formatCep = useCallback((rawCep?: string) => {
    if (!rawCep) {
      return '';
    }

    return maskCep(rawCep);
  }, []);

  // Montar endereço completo
  const buildFullAddress = useCallback((baseAddress: string, num: string, comp: string) => {
    const trimmedBase = baseAddress.trim();

    if (!trimmedBase) {
      return '';
    }

    const parts = trimmedBase
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);

    const street = parts[0] || trimmedBase;
    const remainder = parts.slice(1).join(', ');
    let streetLine = street;

    if (num) {
      streetLine = `${streetLine}, ${num}`;
    }

    if (comp) {
      streetLine = `${streetLine} - ${comp}`;
    }

    return remainder ? `${streetLine}, ${remainder}` : streetLine;
  }, []);

  const stripCepFromQuery = useCallback((query: string, rawCep: string) => {
    const cleanCep = rawCep.replace(/\D/g, '');

    if (!query.trim()) {
      return '';
    }

    const formattedCep =
      cleanCep.length === 8 ? cleanCep.replace(/(\d{5})(\d{3})/, '$1-$2') : '';

    return query
      .replace(formattedCep, '')
      .replace(cleanCep, '')
      .replace(/\s+,/g, ',')
      .replace(/,\s*,/g, ', ')
      .replace(/,\s*$/, '')
      .trim();
  }, []);

  const resolveCoordinates = useCallback(
    async (baseAddress: string, fullAddress: string, rawCep: string) => {
      const queries = Array.from(
        new Set(
          [
            fullAddress,
            `${fullAddress}, Brasil`,
            stripCepFromQuery(fullAddress, rawCep),
            `${stripCepFromQuery(fullAddress, rawCep)}, Brasil`,
            baseAddress,
            `${baseAddress}, Brasil`,
            stripCepFromQuery(baseAddress, rawCep),
            `${stripCepFromQuery(baseAddress, rawCep)}, Brasil`,
          ]
            .map((item) => item.trim())
            .filter(Boolean),
        ),
      );

      for (const query of queries) {
        const results = await addressService.searchByText(query);
        if (results.length > 0) {
          return results[0];
        }
      }

      return null;
    },
    [stripCepFromQuery],
  );

  useEffect(() => {
    if (validationRef.current) {
      clearTimeout(validationRef.current);
    }

    const cleanCep = cep.replace(/\D/g, '');
    const baseAddress = value.trim() || cepBaseAddress.trim();

    if (cleanCep.length === 8 && lat && lon && isValidated) {
      setIsResolvingLocation(false);
      return;
    }

    if (!hasResolvedCep || cleanCep.length !== 8 || baseAddress.length < 4) {
      setIsResolvingLocation(false);
      return;
    }

    const fullAddress = buildFullAddress(baseAddress, localNumber, localComplement);

    setIsResolvingLocation(true);

    validationRef.current = setTimeout(async () => {
      const resolved = await resolveCoordinates(baseAddress, fullAddress, cleanCep);

      if (resolved) {
        setSelectedCoords({ lat: resolved.lat, lon: resolved.lon });
        onChange({
          address: baseAddress,
          fullAddress,
          lat: resolved.lat,
          lon: resolved.lon,
        });
        onValidationChange?.(true);
      } else {
        setSelectedCoords(null);
        onChange({
          address: baseAddress,
          fullAddress,
          lat: '',
          lon: '',
        });
        onValidationChange?.(false);
      }

      setIsResolvingLocation(false);
    }, 700);

    return () => {
      if (validationRef.current) {
        clearTimeout(validationRef.current);
      }
    };
  }, [
    cep,
    value,
    localNumber,
    localComplement,
    hasResolvedCep,
    cepBaseAddress,
    buildFullAddress,
    resolveCoordinates,
  ]);

  const handleCepSearch = async () => {
    if (!cep || cep.replace(/\D/g, '').length < 8) {
      alert('Digite um CEP válido');
      return;
    }

    setCepLoading(true);
    try {
      const result = await addressService.searchByCep(cep);
      if (result) {
        const formattedCep = formatCep(result.cep);
        const baseAddress = [
          result.logradouro,
          result.bairro,
          result.localidade,
          result.uf,
        ]
          .filter(Boolean)
          .join(', ');

        const fullAddress = buildFullAddress(baseAddress, localNumber, localComplement);
        setHasResolvedCep(true);
        setCepBaseAddress(baseAddress);
        setSelectedCoords(null);
        onValidationChange?.(false);

        onChange({
          cep: formattedCep,
          address: baseAddress,
          number: localNumber,
          complement: localComplement,
          fullAddress,
          lat: '',
          lon: '',
        });

        if (result.lat && result.lon) {
          setSelectedCoords({ lat: result.lat, lon: result.lon });
          onChange({
            cep: formattedCep,
            address: baseAddress,
            number: localNumber,
            complement: localComplement,
            fullAddress,
            lat: result.lat,
            lon: result.lon,
          });
          onValidationChange?.(true);
          setSuggestions([]);
          return;
        }
        
        setSuggestions([]);
      } else {
        setHasResolvedCep(false);
        setCepBaseAddress('');
        setSelectedCoords(null);
        onChange({ lat: '', lon: '' });
        onValidationChange?.(false);
        alert('CEP não encontrado.');
      }
    } catch {
      setHasResolvedCep(false);
      setCepBaseAddress('');
      setSelectedCoords(null);
      onChange({ lat: '', lon: '' });
      onValidationChange?.(false);
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
    setSelectedCoords(null);
    onChange({ address: text, fullAddress, lat: '', lon: '' });
    onValidationChange?.(false);
    if (hasResolvedCep) {
      setCepBaseAddress(text);
    }
    debouncedSearch(text);
  };

  const handleSelectSuggestion = (item: any) => {
    const fullAddress = buildFullAddress(item.display_name, localNumber, localComplement);
    const suggestionCep = formatCep(item.address?.postcode);
    const hasSuggestionCep = suggestionCep.replace(/\D/g, '').length === 8;
    
    onChange({
      cep: hasSuggestionCep ? suggestionCep : undefined,
      address: item.display_name,
      number: localNumber,
      complement: localComplement,
      fullAddress,
      lat: item.lat,
      lon: item.lon,
    });
    setSelectedCoords({ lat: item.lat, lon: item.lon });
    setCepBaseAddress(item.display_name);
    setHasResolvedCep(hasSuggestionCep || hasResolvedCep);
    onValidationChange?.(hasSuggestionCep || hasResolvedCep);
    setSuggestions([]);
  };

  const handleNumberChange = (newNumber: string) => {
    setLocalNumber(newNumber);
    const fullAddress = buildFullAddress(value, newNumber, localComplement);
    setSelectedCoords(null);
    onChange({ 
      number: newNumber, 
      fullAddress,
      lat: '',
      lon: '',
    });
    onValidationChange?.(false);
  };

  const handleComplementChange = (newComplement: string) => {
    setLocalComplement(newComplement);
    const fullAddress = buildFullAddress(value, localNumber, newComplement);
    setSelectedCoords(null);
    onChange({ 
      complement: newComplement, 
      fullAddress,
      lat: '',
      lon: '',
    });
    onValidationChange?.(false);
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
            onChange={(e) => {
              setSelectedCoords(null);
              setHasResolvedCep(false);
              setCepBaseAddress('');
              onChange({
                cep: maskCep(e.target.value),
                lat: '',
                lon: '',
              });
              onValidationChange?.(false);
            }}
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
              'Validar CEP'
            )}
          </button>
        </div>
        {isValidated ? (
          <p className="text-xs text-green-600 mt-2">
            Endereço validado com sucesso pelo CEP.
          </p>
        ) : isResolvingLocation ? (
          <p className="text-xs text-blue-600 mt-2">
            Validando a localização do atendimento para o check-in...
          </p>
        ) : hasResolvedCep ? (
          <p className="text-xs text-amber-600 mt-2">
            CEP encontrado. Revise número/complemento e aguarde a validação da localização.
          </p>
        ) : (
          <p className="text-xs text-amber-600 mt-2">
            Preencha o endereço e clique em `Validar CEP` para carregar o local correto do atendimento.
          </p>
        )}
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
            Digite mais detalhes do endereço para encontrar sugestões. Se editar algo depois, a localização será recalculada.
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
