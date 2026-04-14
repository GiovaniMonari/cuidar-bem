'use client';

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { StarRating } from "@/components/StarRating";
import { api } from "@/services/api";
import { UserAvatar } from '@/components/UserAvatar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { Loader2 } from "lucide-react";

interface ReviewWithBooking {
  _id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  booking: {
    serviceType: string;
    serviceName: string;
    startDate: string;
    endDate: string;
    patientName: string;
    contractedBy: {
      name: string;
      avatar?: string;
    };
  };
}

export default function CaregiverRatingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<ReviewWithBooking[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<ReviewWithBooking[]>([]);
  const [filterService, setFilterService] = useState<string>('all');
  const [filterRating, setFilterRating] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Aguardar o carregamento da autenticação
    if (authLoading) {
      return;
    }

    // Verificar se está autenticado
    if (!user) {
      router.push('/login');
      return;
    }

    // Verificar se é cuidador
    if (user.role !== 'caregiver') {
      router.push('/');
      return;
    }

    const fetchReviews = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Buscando avaliações para cuidador:', user.id);
        
        const reviewsData = await api.getMyReviews();
        
        console.log('Avaliações recebidas:', reviewsData);
        
        setReviews(reviewsData);
        setFilteredReviews(reviewsData);
      } catch (error: any) {
        console.error('Erro ao buscar avaliações:', error);
        setError(error.response?.data?.message || 'Erro ao carregar avaliações');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [user, authLoading, router]);

  useEffect(() => {
    let filtered = [...reviews];

    if (filterService !== 'all') {
      filtered = filtered.filter(review => review.booking?.serviceType === filterService);
    }

    if (filterRating > 0) {
      filtered = filtered.filter(review => review.rating === filterRating);
    }

    setFilteredReviews(filtered);
  }, [filterService, filterRating, reviews]);

  const averageRating = reviews.length > 0
    ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(review => review.rating === star).length,
    percentage: reviews.length > 0
      ? (reviews.filter(review => review.rating === star).length / reviews.length) * 100
      : 0
  }));

  const serviceTypes = [...new Set(reviews.map(review => review.booking?.serviceType).filter(Boolean))];

  // Loading da autenticação
  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Loading dos dados
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  // Erro ao carregar
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-semibold text-red-800 mb-2">Erro ao Carregar Avaliações</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Cabeçalho */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </button>
      </div>

      {/* Card de Resumo */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-3xl font-bold mb-6">Minhas Avaliações</h1>
        
        {reviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Resumo de Avaliações */}
            <div className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-lg">
              <div className="text-5xl font-bold text-blue-600 mb-2">
                {averageRating.toFixed(1)}
              </div>
              <StarRating rating={averageRating} size={28} />
              <p className="text-gray-600 mt-2 font-medium">{reviews.length} avaliações</p>
            </div>

            {/* Distribuição de Avaliações */}
            <div className="md:col-span-2">
              <h3 className="font-semibold mb-3 text-lg">Distribuição de Avaliações</h3>
              <div className="space-y-2">
                {ratingDistribution.map(({ star, count, percentage }) => (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-12 text-gray-700">{star} ★</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-yellow-400 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right font-medium">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <p className="text-gray-500 text-lg">Você ainda não recebeu avaliações</p>
            <p className="text-gray-400 text-sm mt-2">Avaliações aparecerão aqui após a conclusão de atendimentos</p>
          </div>
        )}
      </div>

      {/* Filtros */}
      {reviews.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="font-semibold mb-4 text-lg">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Avaliação
              </label>
              <select
                value={filterRating}
                onChange={(e) => setFilterRating(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value={0}>Todas as avaliações</option>
                <option value={5}>5 estrelas</option>
                <option value={4}>4 estrelas</option>
                <option value={3}>3 estrelas</option>
                <option value={2}>2 estrelas</option>
                <option value={1}>1 estrela</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Avaliações */}
      {reviews.length > 0 && (
        <div className="space-y-4">
          {filteredReviews.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="flex flex-col items-center">
                <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <p className="text-gray-500 text-lg">Nenhuma avaliação encontrada com os filtros aplicados</p>
                <button
                  onClick={() => {
                    setFilterService('all');
                    setFilterRating(0);
                  }}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Limpar filtros
                </button>
              </div>
            </div>
          ) : (
            filteredReviews.map((review) => (
              <div key={review._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                {/* Cabeçalho da Avaliação */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      avatar={review.booking?.contractedBy?.avatar}
                      name={review.booking?.contractedBy?.name || 'Cliente'}
                      size={48}
                    />
                    <div>
                      <h3 className="font-semibold text-lg">
                        {review.booking?.contractedBy?.name || 'Cliente'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {format(new Date(review.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <StarRating rating={review.rating} size={20} />
                    <span className="text-sm text-gray-600 mt-1">
                      {review.rating.toFixed(1)} estrelas
                    </span>
                  </div>
                </div>

                {/* Detalhes do Serviço */}
                {review.booking && (
                  <div className="bg-gray-50 rounded-md p-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Início do Serviço</p>
                        <p className="font-medium text-gray-900">
                          {format(new Date(review.booking.startDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Término do Serviço</p>
                        <p className="font-medium text-gray-900">
                          {format(new Date(review.booking.endDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Comentário */}
                {review.comment && (
                  <div className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 rounded-r">
                    <p className="text-gray-700">
                      <span className="font-semibold text-gray-900">Comentário:</span>
                      <br />
                      <span className="italic">"{review.comment}"</span>
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
      
      {/* Contador de Avaliações */}
      {filteredReviews.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
          <p className="text-gray-600">
            Mostrando <span className="font-semibold text-blue-600">{filteredReviews.length}</span> de{' '}
            <span className="font-semibold text-blue-600">{reviews.length}</span> avaliações
          </p>
        </div>
      )}
    </div>
  );
}