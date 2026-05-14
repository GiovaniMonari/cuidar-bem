// app/cuidadores/page.tsx
'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/services/api';
import { Caregiver, SPECIALTIES, STATES } from '@/types';
import { CaregiverCard } from '@/components/CaregiverCard';
import { Footer } from '@/components/Footer';
import {
  Search, MapPin, X, Loader2,
  ChevronLeft, ChevronRight,
  Star,
} from 'lucide-react';
import { useFavorites } from '../hooks/useFavorites';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

function CaregiverSkeleton() {
  return (
    <Card className="overflow-hidden border-none shadow-sm rounded-3xl">
      <div className="h-48 bg-gray-100 animate-pulse" />
      <CardContent className="p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="flex justify-between items-center pt-4">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-10 w-24 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

// Wrapper para lidar com selects controlados
// Base UI pode não aceitar "" como value, então usamos "all" como sentinela
function FilterSelect({
  value,
  onValueChange,
  placeholder,
  options,
  allLabel = "Todos",
  className,
  triggerClassName,
}: {
  value: string;
  onValueChange: (val: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  allLabel?: string;
  className?: string;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const selectValue = value || 'todos';

  const handleSelect = (val: string) => {
    setOpen(false);
    onValueChange(val === 'todos' ? '' : val);
  };

  return (
    <Select
      value={selectValue}
      open={open}
      onOpenChange={setOpen}
      onValueChange={(...args: any[]) => {
        let finalVal = '';
        
        const val1 = args[0];
        const val2 = args[1];

        if (typeof val1 === 'string') finalVal = val1;
        else if (typeof val2 === 'string') finalVal = val2;
        else if (Array.isArray(val1)) finalVal = String(val1[0] || '');
        else if (Array.isArray(val2)) finalVal = String(val2[0] || '');
        else if (val1 && typeof val1 === 'object' && 'value' in val1) finalVal = val1.value;
        else if (val2 && typeof val2 === 'object' && 'value' in val2) finalVal = val2.value;
        else finalVal = String(val1 || '');

        if (finalVal === 'undefined' || finalVal === 'null') finalVal = '';

        handleSelect(finalVal || 'todos');
      }}
    >
      <SelectTrigger className={cn("h-14 bg-gray-50 border-transparent focus:bg-white focus:ring-primary-100 rounded-2xl font-medium", triggerClassName)}>
        <SelectValue placeholder={placeholder}>
          {selectValue === 'todos' ? allLabel : options.find((opt) => opt.value === selectValue)?.label || placeholder}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className={className}>
        <SelectItem 
          value="todos"
          onClick={() => handleSelect('todos')}
        >
          {allLabel}
        </SelectItem>
        {options.map((opt) => (
          <SelectItem 
            key={opt.value} 
            value={opt.value}
            onClick={() => handleSelect(opt.value)}
          >
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function CaregiverListContent() {
  const searchParams = useSearchParams();
  const initialSpecialty = searchParams.get('specialty') || '';
  const { isFavorited, toggleFavorite } = useFavorites();

  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    city: '',
    state: '',
    specialty: initialSpecialty,
    minRate: '',
    maxRate: '',
    minRating: '',
    page: '1',
  });

  const debouncedCity = useDebounce(filters.city, 500);

  const fetchCaregivers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      Object.entries(filters).forEach(([key, val]) => {
        if (val) {
          params[key] = key === 'city' ? val.trim() : val;
        }
      });
      console.log('Fetching with params:', params); // Debug
      const response = await api.getCaregivers(params);
      setCaregivers(response.data);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Erro ao buscar cuidadores:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    setFilters((prev) => ({ ...prev, specialty: initialSpecialty, page: '1' }));
  }, [initialSpecialty]);

  useEffect(() => {
    fetchCaregivers();
  }, [debouncedCity, filters.state, filters.specialty, filters.minRating, filters.page]);

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, page: '1' }));
    fetchCaregivers();
  };

  const clearFilters = () => {
    setFilters({
      city: '',
      state: '',
      specialty: '',
      minRate: '',
      maxRate: '',
      minRating: '',
      page: '1',
    });
  };

  const hasActiveFilters =
    filters.city || filters.state || filters.specialty ||
    filters.minRate || filters.maxRate || filters.minRating;

  const currentPage = parseInt(filters.page);

  // Opções para os selects
  const stateOptions = STATES.map((s) => ({ value: s, label: s }));
  const specialtyOptions = Object.entries(SPECIALTIES).map(([key, label]) => ({
    value: key,
    label,
  }));
  const ratingOptions = [
    { value: '3', label: '3.0+ Estrelas' },
    { value: '4', label: '4.0+ Estrelas' },
    { value: '4.5', label: '4.5+ Estrelas' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 relative overflow-hidden pb-12">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary-400/10 rounded-full -ml-32 -mb-32 blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 mb-6">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
            <span className="text-white text-xs font-bold uppercase tracking-widest">
              Apoiando famílias em todo o Brasil
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-4">
            {filters.specialty
              ? SPECIALTIES[filters.specialty] || filters.specialty
              : 'Cuidados com Alma.'}
          </h1>
          <p className="text-primary-100 text-lg md:text-xl font-medium max-w-2xl mx-auto opacity-90">
            Encontre profissionais verificados e apaixonados pelo que fazem, pertinho de você.
          </p>
        </div>

        {/* Search Card */}
        <div className="max-w-6xl mx-auto px-4 relative z-10 -mb-8">
          <Card className="border-none shadow-2xl rounded-[32px] overflow-hidden bg-white/95 backdrop-blur-sm">
            <div className="p-2 sm:p-4 grid grid-cols-1 md:grid-cols-3 gap-2">
              {/* Cidade */}
              <div className="relative group">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400 z-10 group-focus-within:text-primary-600 transition-colors" />
                <Input
                  type="text"
                  placeholder="Cidade (ex: São Paulo)"
                  value={filters.city}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, city: e.target.value, page: '1' }))
                  }
                  className="h-14 pl-12 pr-10 bg-gray-50 border-transparent focus:bg-white focus:ring-primary-100 rounded-2xl font-medium transition-all"
                />
                {filters.city && (
                  <button
                    onClick={() => setFilters((prev) => ({ ...prev, city: '' }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Estado */}
              <FilterSelect
                value={filters.state}
                onValueChange={(val) => {
                  console.log('State changed to:', val); // Debug
                  setFilters((prev) => ({ ...prev, state: val, page: '1' }));
                }}
                placeholder="Estado"
                options={stateOptions}
                allLabel="Todos os Estados"
              />

              {/* Especialidade */}
              <FilterSelect
                value={filters.specialty}
                onValueChange={(val) => {
                  console.log('Specialty changed to:', val); // Debug
                  setFilters((prev) => ({ ...prev, specialty: val, page: '1' }));
                }}
                placeholder="Especialidade"
                options={specialtyOptions}
                allLabel="Todas as Especialidades"
              />
            </div>

            {/* Filtros Avançados */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-gray-100 px-4 pb-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-gray-600 font-bold text-xs uppercase tracking-wider">
                      Preço Mínimo (R$/h)
                    </Label>
                    <Input
                      type="number"
                      value={filters.minRate}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, minRate: e.target.value }))
                      }
                      className="h-12 bg-gray-50 border-transparent focus:bg-white rounded-xl"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-600 font-bold text-xs uppercase tracking-wider">
                      Preço Máximo (R$/h)
                    </Label>
                    <Input
                      type="number"
                      value={filters.maxRate}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, maxRate: e.target.value }))
                      }
                      className="h-12 bg-gray-50 border-transparent focus:bg-white rounded-xl"
                      placeholder="200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-600 font-bold text-xs uppercase tracking-wider">
                      Avaliação Mínima
                    </Label>
                    <FilterSelect
                      value={filters.minRating}
                      onValueChange={(val) =>
                        setFilters((prev) => ({ ...prev, minRating: val }))
                      }
                      placeholder="Todas"
                      options={ratingOptions}
                      allLabel="Todas"
                      triggerClassName="h-12"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Botão filtros + tags */}
            <div className="px-4 pb-4">
              <Button
                variant="ghost"
                onClick={() => setShowFilters(!showFilters)}
                className="text-xs font-bold text-gray-500 hover:text-primary-600 gap-1.5 h-auto py-2 px-3 rounded-xl"
              >
                {showFilters ? 'Ocultar filtros avançados' : 'Filtros avançados'}
              </Button>

              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest mr-2">
                    Filtros:
                  </span>
                  {filters.city && (
                    <Badge
                      variant="secondary"
                      className="gap-1 pl-2 pr-1 py-1.5 bg-primary-50 text-primary-700 rounded-full font-bold"
                    >
                      <MapPin className="w-3 h-3" />
                      {filters.city}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 rounded-full hover:bg-primary-100"
                        onClick={() => setFilters((prev) => ({ ...prev, city: '' }))}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  )}
                  {filters.state && (
                    <Badge
                      variant="secondary"
                      className="gap-1 pl-3 pr-1 py-1.5 bg-primary-50 text-primary-700 rounded-full font-bold"
                    >
                      {filters.state}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 rounded-full hover:bg-primary-100"
                        onClick={() => setFilters((prev) => ({ ...prev, state: '' }))}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  )}
                  {filters.specialty && (
                    <Badge
                      variant="secondary"
                      className="gap-1 pl-3 pr-1 py-1.5 bg-primary-50 text-primary-700 rounded-full font-bold"
                    >
                      {SPECIALTIES[filters.specialty]}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 rounded-full hover:bg-primary-100"
                        onClick={() => setFilters((prev) => ({ ...prev, specialty: '' }))}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  )}
                  {filters.minRating && (
                    <Badge
                      variant="secondary"
                      className="gap-1 pl-3 pr-1 py-1.5 bg-yellow-50 text-yellow-700 rounded-full font-bold"
                    >
                      <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                      {filters.minRating}+
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 rounded-full hover:bg-yellow-100"
                        onClick={() => setFilters((prev) => ({ ...prev, minRating: '' }))}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  )}
                  <Button
                    variant="link"
                    onClick={clearFilters}
                    className="text-xs font-bold text-gray-500 hover:text-primary-600 h-auto p-0"
                  >
                    Limpar tudo
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <CaregiverSkeleton key={i} />
              ))}
            </div>
          ) : caregivers.length === 0 ? (
            <Card className="border-none shadow-sm rounded-[32px] p-16 text-center bg-white/50 border-2 border-dashed border-gray-200">
              <div className="max-w-md mx-auto space-y-6">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-3xl font-black text-gray-900 tracking-tight">
                  Nenhum cuidador encontrado
                </h3>
                <p className="text-gray-500 font-medium leading-relaxed">
                  Não encontramos cuidadores com os filtros selecionados. Tente ajustar sua busca.
                </p>
                {hasActiveFilters && (
                  <Button
                    onClick={clearFilters}
                    variant="default"
                    className="rounded-2xl h-12 px-8 font-bold"
                  >
                    Limpar todos os filtros
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                    {caregivers.length} Profissiona
                    {caregivers.length !== 1 ? 'is' : 'l'} encontrado
                    {caregivers.length !== 1 ? 's' : ''}
                  </h2>
                  <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">
                    Página {currentPage} de {totalPages}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {caregivers.map((caregiver) => (
                  <CaregiverCard
                    key={caregiver._id}
                    caregiver={caregiver}
                    isFavorited={isFavorited(caregiver._id)}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col items-center gap-6 mt-20">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={currentPage <= 1}
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, page: String(currentPage - 1) }))
                      }
                      className="h-12 w-12 rounded-2xl border-gray-200 hover:border-primary-500 transition-all"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>

                    <div className="flex items-center gap-2">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) pageNum = i + 1;
                        else if (currentPage <= 3) pageNum = i + 1;
                        else if (currentPage >= totalPages - 2)
                          pageNum = totalPages - 4 + i;
                        else pageNum = currentPage - 2 + i;

                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? 'default' : 'outline'}
                            onClick={() =>
                              setFilters((prev) => ({ ...prev, page: String(pageNum) }))
                            }
                            className={cn(
                              'h-12 w-12 rounded-2xl font-black transition-all',
                              currentPage === pageNum
                                ? 'shadow-lg shadow-primary-500/20 scale-110'
                                : 'border-gray-200'
                            )}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="icon"
                      disabled={currentPage >= totalPages}
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, page: String(currentPage + 1) }))
                      }
                      className="h-12 w-12 rounded-2xl border-gray-200 hover:border-primary-500 transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function CaregiverListPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
          <p className="text-gray-500 font-black uppercase tracking-widest animate-pulse">
            Carregando Cuidadores...
          </p>
        </div>
      }
    >
      <CaregiverListContent />
    </Suspense>
  );
}