// components/AddressAutocomplete.tsx
'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { addressService } from '@/services/address';
import { buildFullAddress } from '@/utils/addressFields';
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
  const [addressValidationLoading, setAddressValidationLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: string; lon: string } | null>(null);
  const [localNumber, setLocalNumber] = useState(number);
  const [localComplement, setLocalComplement] = useState(complement);
  const [hasResolvedCep, setHasResolvedCep] = useState(false);
  const [cepBaseAddress, setCepBaseAddress] = useState('');
  const [cepLookupState, setCepLookupState] = useState<'idle' | 'not-found' | 'error'>(
    'idle',
  );
  const [candidateCoordinates, setCandidateCoordinates] = useState<{
    lat: string;
    lon: string;
    baseAddress: string;
    cep: string;
  } | null>(null);
  
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const cepDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastAutoSearchedCepRef = useRef('');
  const cepRequestRef = useRef(0);

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

  useEffect(() => {
    const cleanCep = cep.replace(/\D/g, '');
    const baseAddress = value.trim();

    if (!lat || !lon || !baseAddress) {
      return;
    }

    setCandidateCoordinates((current) => {
      if (
        current &&
        current.lat === lat &&
        current.lon === lon &&
        current.baseAddress === baseAddress &&
        current.cep === cleanCep
      ) {
        return current;
      }

      return {
        lat,
        lon,
        baseAddress,
        cep: cleanCep,
      };
    });
  }, [cep, lat, lon, value]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      if (cepDebounceRef.current) {
        clearTimeout(cepDebounceRef.current);
      }
    };
  }, []);

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

  const searchCep = useCallback(
    async (rawCep: string, options?: { showAlert?: boolean }) => {
      const cleanCep = rawCep.replace(/\D/g, '');

      if (cleanCep.length !== 8) {
        if (options?.showAlert) {
          alert('Digite um CEP válido');
        }

        return null;
      }

      const requestId = ++cepRequestRef.current;
      setCepLoading(true);
      setCepLookupState('idle');

      try {
        const result = await addressService.searchByCep(cleanCep);

        if (requestId !== cepRequestRef.current) {
          return null;
        }

        if (!result) {
          setHasResolvedCep(false);
          setCepBaseAddress('');
          setSelectedCoords(null);
          setCandidateCoordinates(null);
          setCepLookupState('not-found');
          onChange({ lat: '', lon: '' });
          onValidationChange?.(false);

          if (options?.showAlert) {
            alert('CEP não encontrado.');
          }

          return null;
        }

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
        setCandidateCoordinates(
          result.lat && result.lon
            ? {
                lat: result.lat,
                lon: result.lon,
                baseAddress,
                cep: cleanCep,
              }
            : null,
        );
        setSuggestions([]);
        setCepLookupState('idle');
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

        return {
          cleanCep,
          formattedCep,
          baseAddress,
          fullAddress,
        };
      } catch {
        if (requestId !== cepRequestRef.current) {
          return null;
        }

        setHasResolvedCep(false);
        setCepBaseAddress('');
        setSelectedCoords(null);
        setCandidateCoordinates(null);
        setCepLookupState('error');
        onChange({ lat: '', lon: '' });
        onValidationChange?.(false);

        if (options?.showAlert) {
          alert('Erro ao buscar CEP.');
        }

        return null;
      } finally {
        if (requestId === cepRequestRef.current) {
          setCepLoading(false);
        }
      }
    },
    [
      buildFullAddress,
      formatCep,
      localComplement,
      localNumber,
      onChange,
      onValidationChange,
    ],
  );

  const handleCepChange = (rawValue: string) => {
    const maskedCep = maskCep(rawValue);
    const cleanCep = maskedCep.replace(/\D/g, '');

    if (cepDebounceRef.current) {
      clearTimeout(cepDebounceRef.current);
    }

    setSelectedCoords(null);
    setHasResolvedCep(false);
    setCepBaseAddress('');
    setCandidateCoordinates(null);
    setCepLookupState('idle');
    onChange({
      cep: maskedCep,
      lat: '',
      lon: '',
    });
    onValidationChange?.(false);

    if (cleanCep.length !== 8) {
      lastAutoSearchedCepRef.current = '';
      return;
    }

    if (cleanCep === lastAutoSearchedCepRef.current) {
      return;
    }

    cepDebounceRef.current = setTimeout(() => {
      lastAutoSearchedCepRef.current = cleanCep;
      void searchCep(cleanCep);
    }, 500);
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
    if (
      candidateCoordinates &&
      candidateCoordinates.baseAddress.trim().toLowerCase() !== text.trim().toLowerCase()
    ) {
      setCandidateCoordinates(null);
    }
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
      lat: '',
      lon: '',
    });
    setSelectedCoords(null);
    setCepBaseAddress(item.display_name);
    setHasResolvedCep(hasSuggestionCep || hasResolvedCep);
    setCandidateCoordinates({
      lat: item.lat,
      lon: item.lon,
      baseAddress: item.display_name,
      cep: (hasSuggestionCep ? suggestionCep : cep).replace(/\D/g, ''),
    });
    setCepLookupState('idle');
    onValidationChange?.(false);
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

  const handleValidateAddress = async () => {
    const cleanCep = cep.replace(/\D/g, '');
    let baseAddress = value.trim() || cepBaseAddress.trim();
    const trimmedNumber = localNumber.trim();
    const trimmedComplement = localComplement.trim();

    if (cleanCep.length !== 8) {
      alert('Informe um CEP válido para o atendimento.');
      return;
    }

    if (!baseAddress) {
      alert('Informe o endereço do atendimento.');
      return;
    }

    if (!trimmedNumber) {
      alert('Informe o número do endereço.');
      return;
    }

    if (cepDebounceRef.current) {
      clearTimeout(cepDebounceRef.current);
    }

    setAddressValidationLoading(true);
    setSuggestions([]);
    onValidationChange?.(false);

    try {
      if (!hasResolvedCep) {
        lastAutoSearchedCepRef.current = cleanCep;
        const cepResult = await searchCep(cleanCep, { showAlert: true });

        if (!cepResult) {
          return;
        }

        baseAddress = value.trim() || cepResult.baseAddress;
      }

      const fullAddress = buildFullAddress(baseAddress, trimmedNumber, trimmedComplement);
      const resolved = await resolveCoordinates(baseAddress, fullAddress, cleanCep);
      const fallbackCoordinates =
        candidateCoordinates &&
        candidateCoordinates.cep === cleanCep &&
        candidateCoordinates.baseAddress.trim().toLowerCase() ===
          baseAddress.trim().toLowerCase()
          ? candidateCoordinates
          : null;
      const finalCoordinates = resolved
        ? { lat: resolved.lat, lon: resolved.lon }
        : fallbackCoordinates;

      if (!finalCoordinates) {
        setSelectedCoords(null);
        onChange({
          address: baseAddress,
          number: trimmedNumber,
          complement: trimmedComplement,
          fullAddress,
          lat: '',
          lon: '',
        });
        onValidationChange?.(false);
        alert('Não foi possível validar o endereço com os dados preenchidos.');
        return;
      }

      setSelectedCoords({
        lat: finalCoordinates.lat,
        lon: finalCoordinates.lon,
      });
      setHasResolvedCep(true);
      setCepBaseAddress(baseAddress);
      setCandidateCoordinates({
        lat: finalCoordinates.lat,
        lon: finalCoordinates.lon,
        baseAddress,
        cep: cleanCep,
      });
      setCepLookupState('idle');
      onChange({
        cep: formatCep(cleanCep),
        address: baseAddress,
        number: trimmedNumber,
        complement: trimmedComplement,
        fullAddress,
        lat: finalCoordinates.lat,
        lon: finalCoordinates.lon,
      });
      onValidationChange?.(true);
    } finally {
      setAddressValidationLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* CEP */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">
          CEP
        </label>
        <input
          type="text"
          value={cep}
          onChange={(e) => handleCepChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (cepDebounceRef.current) {
                clearTimeout(cepDebounceRef.current);
              }
              lastAutoSearchedCepRef.current = cep.replace(/\D/g, '');
              void searchCep(cep, { showAlert: true });
            }
          }}
          className="input-field"
          placeholder="00000-000"
          maxLength={9}
        />
        {isValidated ? (
          <p className="text-xs text-green-600 mt-2">
            Endereço validado com sucesso.
          </p>
        ) : addressValidationLoading ? (
          <p className="text-xs text-blue-600 mt-2">
            Validando o endereço completo para confirmar a localização do atendimento...
          </p>
        ) : cepLoading ? (
          <p className="text-xs text-blue-600 mt-2">
            Validando o CEP automaticamente...
          </p>
        ) : cepLookupState === 'not-found' ? (
          <p className="text-xs text-red-600 mt-2">
            CEP não encontrado. Confira os números e tente novamente.
          </p>
        ) : cepLookupState === 'error' ? (
          <p className="text-xs text-red-600 mt-2">
            Não foi possível consultar o CEP agora. Tente novamente em instantes.
          </p>
        ) : hasResolvedCep ? (
          <p className="text-xs text-amber-600 mt-2">
            CEP validado. Revise os dados abaixo e clique em Validar endereço.
          </p>
        ) : (
          <p className="text-xs text-amber-600 mt-2">
            Digite o CEP para preencher o endereço automaticamente.
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
            Digite mais detalhes do endereço para encontrar sugestões. Se editar algo depois, valide o endereço novamente.
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

      <div className="space-y-2">
        <button
          type="button"
          onClick={handleValidateAddress}
          disabled={cepLoading || addressValidationLoading}
          className="btn-secondary w-full !py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {addressValidationLoading ? (
            <span className="inline-flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Validando endereço...
            </span>
          ) : (
            'Validar endereço'
          )}
        </button>
        <p className="text-xs text-gray-500">
          Use este botão depois de revisar CEP, endereço, número e complemento.
        </p>
      </div>

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
