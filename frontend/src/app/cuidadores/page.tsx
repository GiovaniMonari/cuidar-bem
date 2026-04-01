'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';

export default function CaregiverListPage() {
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    city: '',
    state: '',
    specialty: '',
    minRate: '',
    maxRate: '',
    minRating: '',
    page: '1',
  });

  const fetchCaregivers = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      Object.entries(filters).forEach(([key, val]) => {
        if (val) params[key] = val;
      });
      const response = await api.getCaregivers(params);
      setCaregivers(response.data);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Erro ao buscar cuidadores:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaregivers();
  }, [filters.page]);

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
    setTimeout(fetchCaregivers, 0);
  };

  const currentPage = parseInt(filters.page);

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Encontre Cuidadores
          </h1>
          <p className="text-primary-200">
            Profissionais qualificados na sua região
          </p>

          {/* Search Bar */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cidade..."
                value={filters.city}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, city: e.target.value }))
                }
                className="input-field !pl-10"
              />
            </div>
            <select
              value={filters.state}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, state: e.target.value }))
              }
              className="input-field sm:!w-32"
            >
              <option value="">UF</option>
              {STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={filters.specialty}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, specialty: e.target.value }))
              }
              className="input-field sm:!w-52"
            >
              <option value="">Especialidade</option>
              {Object.entries(SPECIALTIES).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <button onClick={handleSearch} className="btn-accent flex items-center gap-2">
              <Search className="w-4 h-4" />
              Buscar
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary !bg-white flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filtros
            </button>
          </div>

          {/* Extra Filters */}
          {showFilters && (
            <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 flex flex-wrap gap-4 items-end">
              <div>
                <label className="text-white/80 text-xs font-medium mb-1 block">
                  Preço mín (R$/h)
                </label>
                <input
                  type="number"
                  value={filters.minRate}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, minRate: e.target.value }))
                  }
                  className="input-field !py-2 !w-28"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-white/80 text-xs font-medium mb-1 block">
                  Preço máx (R$/h)
                </label>
                <input
                  type="number"
                  value={filters.maxRate}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, maxRate: e.target.value }))
                  }
                  className="input-field !py-2 !w-28"
                  placeholder="200"
                />
              </div>
              <div>
                <label className="text-white/80 text-xs font-medium mb-1 block">
                  Avaliação mín
                </label>
                <select
                  value={filters.minRating}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      minRating: e.target.value,
                    }))
                  }
                  className="input-field !py-2 !w-28"
                >
                  <option value="">Todas</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                  <option value="4.5">4.5+</option>
                </select>
              </div>
              <button
                onClick={clearFilters}
                className="text-white/80 hover:text-white text-sm flex items-center gap-1 pb-2"
              >
                <X className="w-3.5 h-3.5" />
                Limpar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
        ) : caregivers.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Nenhum cuidador encontrado
            </h3>
            <p className="text-gray-400">
              Tente ajustar os filtros de busca
            </p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {caregivers.map((caregiver) => (
                <CaregiverCard key={caregiver._id} caregiver={caregiver} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-10">
                <button
                  disabled={currentPage <= 1}
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      page: String(currentPage - 1),
                    }))
                  }
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, page: String(i + 1) }))
                    }
                    className={`w-10 h-10 rounded-lg font-medium ${
                      currentPage === i + 1
                        ? 'bg-primary-600 text-white'
                        : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      page: String(currentPage + 1),
                    }))
                  }
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}