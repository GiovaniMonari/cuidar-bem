'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';
import { CaregiverCard } from '@/components/CaregiverCard';
import { Footer } from '@/components/Footer';
import {
  Heart,
  Loader2,
  RefreshCcw,
} from 'lucide-react';
import { useFavorites } from '../hooks/useFavorites';

export default function FavoritosPage() {
  const [caregivers, setCaregivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { removeFavorite, refresh } = useFavorites();

  const fetchFavorites = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await api.getFavoriteCaregivers();
      const validCaregivers = data.filter((item: any) => item && item._id);

      setCaregivers(validCaregivers);
    } catch (err) {
      console.error('Erro ao buscar favoritos:', err);
      setError('Não foi possível carregar seus favoritos.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualiza a lista quando o hook de favoritos mudar (remoção)
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handleRemoveFavorite = async (caregiverId: string) => {
    await removeFavorite(caregiverId);
    
    // Remove imediatamente da UI (melhor UX)
    setCaregivers((prev) => prev.filter((c) => c._id !== caregiverId));
  };

  const handleRefresh = () => {
    refresh();
    fetchFavorites();
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
        <p className="text-gray-600">Carregando seus favoritos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header com Gradiente */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Heart className="w-12 h-12 text-white fill-white" />
              <h1 className="text-5xl font-bold text-white tracking-tight">
                Meus Favoritos
              </h1>
            </div>
            <p className="text-rose-100 text-xl max-w-md">
              Os cuidadores que você mais gostou, sempre à mão
            </p>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {error ? (
            <div className="text-center py-20 bg-white rounded-3xl shadow-sm">
              <p className="text-red-600 mb-6 text-lg">{error}</p>
              <button
                onClick={fetchFavorites}
                className="px-8 py-3.5 bg-primary-600 text-white rounded-2xl hover:bg-primary-700 transition-all font-medium"
              >
                Tentar novamente
              </button>
            </div>
          ) : caregivers.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
              <div className="max-w-md mx-auto">
                <Heart className="w-24 h-24 text-gray-200 mx-auto mb-8" />
                <h3 className="text-3xl font-bold text-gray-800 mb-3">
                  Nenhum favorito ainda
                </h3>
                <p className="text-gray-500 text-lg mb-10">
                  Quando você favoritar cuidadores durante sua busca, 
                  eles aparecerão aqui para facilitar seu acesso.
                </p>
                <a
                  href="/cuidadores"
                  className="inline-flex items-center gap-2 px-10 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg"
                >
                  Explorar Cuidadores
                </a>
              </div>
            </div>
          ) : (
            <>

              {/* Grid de Cuidadores */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {caregivers.map((caregiver) => (
                  <CaregiverCard
                    key={caregiver._id}
                    caregiver={caregiver}
                    isFavorited={true}
                    onToggleFavorite={handleRemoveFavorite}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}