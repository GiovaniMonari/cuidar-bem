'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/services/api';
import { Caregiver, SPECIALTIES, STATES } from '@/types';
import { CaregiverCard } from '@/components/CaregiverCard';
import { Footer } from '@/components/Footer';
import {
  Search,
  Filter,
  MapPin,
  X,
  Loader2,
  Heart,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

// Hook para debounce (busca automática após parar de digitar)
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

function CaregiverListContent() {
  const searchParams = useSearchParams();
  const initialSpecialty = searchParams.get('specialty') || '';

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

  // Debounce para cidade (busca automática 500ms após parar de digitar)
  const debouncedCity = useDebounce(filters.city, 500);

  const fetchCaregivers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      Object.entries(filters).forEach(([key, val]) => {
        if (val) {
          // Normaliza a cidade para busca flexível
          if (key === 'city') {
            params[key] = val.trim();
          } else {
            params[key] = val;
          }
        }
      });
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
    setFilters(prev => ({ ...prev, specialty: initialSpecialty, page: '1' }));
  }, [initialSpecialty]);

  // Busca automática quando cidade, estado ou especialidade mudam
  useEffect(() => {
    fetchCaregivers();
  }, [debouncedCity, filters.state, filters.specialty, filters.page]);

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

  const hasActiveFilters = filters.city || filters.state || filters.specialty || 
    filters.minRate || filters.maxRate || filters.minRating;

  const currentPage = parseInt(filters.page);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header de Busca com Gradiente Moderno */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 relative overflow-hidden">
        {/* Elementos decorativos de fundo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          {/* Título e Descrição */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Sparkles className="w-6 h-6 text-yellow-300" />
              <h1 className="text-4xl font-bold text-white">
                {filters.specialty 
                  ? SPECIALTIES[filters.specialty] || filters.specialty
                  : 'Encontre o Cuidador Ideal'}
              </h1>
            </div>
            <p className="text-primary-100 text-lg">
              {filters.specialty 
                ? `Profissionais especializados prontos para ajudar`
                : 'Conectamos você aos melhores profissionais de saúde'}
            </p>
          </div>

          {/* Barra de Busca Principal - Design Moderno */}
          <div className="bg-white rounded-2xl shadow-2xl p-6 backdrop-blur-sm">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Campo de Cidade com Ícone */}
              <div className="md:col-span-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Localização
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400" />
                  <input
                    type="text"
                    placeholder="Digite sua cidade..."
                    value={filters.city}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, city: e.target.value, page: '1' }))
                    }
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all outline-none text-gray-700 placeholder-gray-400"
                  />
                  {filters.city && (
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, city: '' }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1.5 ml-1">
                  Ex: São Paulo, Rio, Belo Horizonte
                </p>
              </div>

              {/* Estado */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  value={filters.state}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, state: e.target.value, page: '1' }))
                  }
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all outline-none text-gray-700 bg-white"
                >
                  <option value="">Todos</option>
                  {STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Especialidade */}
              <div className="md:col-span-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Especialidade
                </label>
                <select
                  value={filters.specialty}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, specialty: e.target.value, page: '1' }))
                  }
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all outline-none text-gray-700 bg-white"
                >
                  <option value="">Todas as Especialidades</option>
                  {Object.entries(SPECIALTIES).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Botões de Ação */}
              <div className="md:col-span-2 flex flex-col justify-end gap-2">
                <button 
                  onClick={handleSearch} 
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl active:scale-95"
                >
                  <Search className="w-5 h-5" />
                  Buscar
                </button>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`w-full font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all ${
                    showFilters 
                      ? 'bg-gray-800 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  {showFilters ? 'Ocultar' : 'Filtros'}
                </button>
              </div>
            </div>

            {/* Filtros Avançados - Expansível */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t-2 border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filtros Avançados
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preço Mínimo (R$/h)
                    </label>
                    <input
                      type="number"
                      value={filters.minRate}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, minRate: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all outline-none"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preço Máximo (R$/h)
                    </label>
                    <input
                      type="number"
                      value={filters.maxRate}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, maxRate: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all outline-none"
                      placeholder="200"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Avaliação Mínima
                    </label>
                    <select
                      value={filters.minRating}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          minRating: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all outline-none bg-white"
                    >
                      <option value="">Todas</option>
                      <option value="3"> 3.0+</option>
                      <option value="4"> 4.0+</option>
                      <option value="4.5"> 4.5+</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Tags de Filtros Ativos */}
            {hasActiveFilters && (
              <div className="mt-4 pt-4 border-t-2 border-gray-100">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-gray-600">Filtros ativos:</span>
                  {filters.city && (
                    <span className="inline-flex items-center gap-1.5 bg-primary-100 text-primary-700 px-3 py-1.5 rounded-full text-sm font-medium">
                      <MapPin className="w-3.5 h-3.5" />
                      {filters.city}
                      <button
                        onClick={() => setFilters(prev => ({ ...prev, city: '' }))}
                        className="hover:bg-primary-200 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}
                  {filters.state && (
                    <span className="inline-flex items-center gap-1.5 bg-primary-100 text-primary-700 px-3 py-1.5 rounded-full text-sm font-medium">
                      {filters.state}
                      <button
                        onClick={() => setFilters(prev => ({ ...prev, state: '' }))}
                        className="hover:bg-primary-200 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}
                  {filters.specialty && (
                    <span className="inline-flex items-center gap-1.5 bg-primary-100 text-primary-700 px-3 py-1.5 rounded-full text-sm font-medium">
                      {SPECIALTIES[filters.specialty]}
                      <button
                        onClick={() => setFilters(prev => ({ ...prev, specialty: '' }))}
                        className="hover:bg-primary-200 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}
                  {(filters.minRate || filters.maxRate) && (
                    <span className="inline-flex items-center gap-1.5 bg-primary-100 text-primary-700 px-3 py-1.5 rounded-full text-sm font-medium">
                      R$ {filters.minRate || '0'} - {filters.maxRate || '∞'}
                      <button
                        onClick={() => setFilters(prev => ({ ...prev, minRate: '', maxRate: '' }))}
                        className="hover:bg-primary-200 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}
                  {filters.minRating && (
                    <span className="inline-flex items-center gap-1.5 bg-primary-100 text-primary-700 px-3 py-1.5 rounded-full text-sm font-medium">
                       {filters.minRating}+
                      <button
                        onClick={() => setFilters(prev => ({ ...prev, minRating: '' }))}
                        className="hover:bg-primary-200 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}
                  <button
                    onClick={clearFilters}
                    className="text-sm text-gray-600 hover:text-gray-800 font-medium underline underline-offset-2"
                  >
                    Limpar tudo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-20">
              <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
              <p className="text-gray-500">Buscando cuidadores...</p>
            </div>
          ) : caregivers.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
              <div className="max-w-md mx-auto">
                <Heart className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-700 mb-3">
                  Nenhum cuidador encontrado
                </h3>
                <p className="text-gray-500 mb-6">
                  Não encontramos cuidadores com os filtros selecionados.
                  <br />
                  Tente ajustar sua busca.
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Limpar todos os filtros
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Cabeçalho de Resultados */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-gray-700 font-medium text-lg">
                    {caregivers.length} profissional{caregivers.length !== 1 ? 'is' : ''} encontrado{caregivers.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Página {currentPage} de {totalPages}
                  </p>
                </div>
              </div>

              {/* Grid de Cuidadores */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {caregivers.map((caregiver) => (
                  <CaregiverCard key={caregiver._id} caregiver={caregiver} />
                ))}
              </div>

              {/* Paginação Melhorada */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-12">
                  <div className="flex items-center gap-2">
                    <button
                      disabled={currentPage <= 1}
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          page: String(currentPage - 1),
                        }))
                      }
                      className="p-2.5 rounded-lg bg-white border-2 border-gray-200 hover:border-primary-500 hover:bg-primary-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 7) {
                          pageNum = i + 1;
                        } else if (currentPage <= 4) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 3) {
                          pageNum = totalPages - 6 + i;
                        } else {
                          pageNum = currentPage - 3 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() =>
                              setFilters((prev) => ({ ...prev, page: String(pageNum) }))
                            }
                            className={`min-w-[40px] h-10 rounded-lg font-semibold transition-all ${
                              currentPage === pageNum
                                ? 'bg-primary-600 text-white shadow-lg scale-110'
                                : 'bg-white border-2 border-gray-200 hover:border-primary-500 hover:bg-primary-50 text-gray-700'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      disabled={currentPage >= totalPages}
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          page: String(currentPage + 1),
                        }))
                      }
                      className="p-2.5 rounded-lg bg-white border-2 border-gray-200 hover:border-primary-500 hover:bg-primary-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <span className="text-sm text-gray-500">
                    de {totalPages} {totalPages === 1 ? 'página' : 'páginas'}
                  </span>
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
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      }
    >
      <CaregiverListContent />
    </Suspense>
  );
}