'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Caregiver, Review, SPECIALTIES} from '@/types';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import { StarRating } from '@/components/StarRating';
import { AvailabilityCalendar } from '@/components/AvailabilityCalendar';
import { ServiceSelector } from '@/components/ServiceSelector';
import {
  MapPin,
  Clock,
  Award,
  Phone,
  Mail,
  Calendar,
  ChevronLeft,
  Loader2,
  CheckCircle,
  MessageSquare,
  Send,
  X,
  AlertCircle,
  Star,
} from 'lucide-react';

function CaregiverDetailContent() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();

  // Estados principais
  const [caregiver, setCaregiver] = useState<Caregiver | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableDates, setAvailableDates] = useState<{ date: string; slots: string[]; isAvailable: boolean }[]>([]);

  // Estados do modal de agendamento
  const [showBooking, setShowBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Estados de avaliação
  const [showReview, setShowReview] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Parâmetro de URL para abrir avaliação automaticamente
  const avaliarBookingId = searchParams.get('avaliar');

  // Estado do formulário de agendamento
  const [bookingData, setBookingData] = useState({
    serviceType: '',
    serviceName: '',
    durationKey: '',
    durationLabel: '',
    durationHours: 0,
    pricePerHour: 0,
    totalAmount: 0,
    discount: 0,
  });

  const [bookingForm, setBookingForm] = useState({
    startDate: '',
    notes: '',
    cep: '',
    address: '',
    patientName: '',
    patientAge: '',
    patientCondition: '',
  });

  // Estado do formulário de avaliação
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: '',
  });

  // Carregar dados do cuidador e reviews
    useEffect(() => {
    const fetchData = async () => {
      try {
        const [caregiverData, reviewsData, availabilityData] = await Promise.all([
          api.getCaregiver(id as string),
          api.getReviews(id as string),
          api.getCaregiverAvailability(id as string),
        ]);

        setCaregiver(caregiverData);
        setReviews(reviewsData);
        setAvailableDates(availabilityData || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Verificar se o usuário pode avaliar este cuidador
  useEffect(() => {
    const checkCanReview = async () => {
      if (!isAuthenticated || user?.role !== 'client' || !caregiver) {
        setCanReview(false);
        return;
      }

      try {
        const result = await api.canReviewCaregiver(id as string);
        setCanReview(result.canReview);
        setReviewBookingId(result.bookingId || null);

        // Se veio do email de conclusão com parâmetro avaliar, abrir formulário
        if (avaliarBookingId && result.canReview) {
          setShowReview(true);
          setReviewBookingId(avaliarBookingId);
        }
      } catch (error) {
        console.error('Erro ao verificar permissão de avaliação:', error);
        setCanReview(false);
      }
    };

    checkCanReview();
  }, [id, isAuthenticated, user, caregiver, avaliarBookingId]);

  // Submeter agendamento
  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bookingData.serviceType || !bookingData.durationKey) {
      alert('Por favor, selecione o tipo de serviço e duração');
      return;
    }

    try {
      const start = new Date(bookingForm.startDate);
      const end = new Date(start.getTime() + bookingData.durationHours * 60 * 60 * 1000);

      await api.createBooking({
        caregiverId: id,
        serviceType: bookingData.serviceType,
        serviceName: bookingData.serviceName,
        durationKey: bookingData.durationKey,
        durationLabel: bookingData.durationLabel,
        durationHours: bookingData.durationHours,
        pricePerHour: bookingData.pricePerHour,
        totalAmount: bookingData.totalAmount,
        discount: bookingData.discount,
        startDate: bookingForm.startDate,
        endDate: end.toISOString(),
        notes: bookingForm.notes,
        clientName: user?.name,
        clientPhone: user?.phone,
        address: bookingForm.address,
        patientName: bookingForm.patientName,
        patientAge: bookingForm.patientAge ? Number(bookingForm.patientAge) : undefined,
        patientCondition: bookingForm.patientCondition,
      });

      setShowBooking(false);
      setBookingSuccess(true);
      
      // Resetar formulário
      setBookingData({
        serviceType: '',
        serviceName: '',
        durationKey: '',
        durationLabel: '',
        durationHours: 0,
        pricePerHour: 0,
        totalAmount: 0,
        discount: 0,
      });
        setBookingForm({
        startDate: '',
        notes: '',
        cep: '',
        address: '',
        patientName: '',
        patientAge: '',
        patientCondition: '',
      });

      setTimeout(() => setBookingSuccess(false), 5000);
    } catch (error: any) {
      alert(error.message);
    }
  };

  // Submeter avaliação
  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewLoading(true);

    try {
      const newReview = await api.createReview({
        caregiverId: id,
        bookingId: reviewBookingId || avaliarBookingId,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });

      setReviews((prev) => [newReview, ...prev]);
      setShowReview(false);
      setCanReview(false); // Não pode mais avaliar este serviço
      setReviewForm({ rating: 5, comment: '' });
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 5000);

      // Atualizar rating do cuidador localmente
      if (caregiver) {
        const totalRating = caregiver.rating * caregiver.reviewCount + reviewForm.rating;
        const newCount = caregiver.reviewCount + 1;
        setCaregiver({
          ...caregiver,
          rating: totalRating / newCount,
          reviewCount: newCount,
        });
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (!caregiver) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Cuidador não encontrado</p>
      </div>
    );
  }

  const caregiverUser = caregiver.userId;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => router.back()}
            className="text-white/80 hover:text-white flex items-center gap-1 mb-6 text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </button>

          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
              {caregiverUser?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white">
                {caregiverUser?.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-white/80">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {caregiver.city}, {caregiver.state}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {caregiver.experienceYears} anos de experiência
                </span>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <StarRating rating={caregiver.rating} size={20} />
                <span className="text-white font-bold text-lg">
                  {caregiver.rating.toFixed(1)}
                </span>
                <span className="text-white/60 text-sm">
                  ({caregiver.reviewCount} avaliações)
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">
                R$ {caregiver.hourlyRate}
                <span className="text-lg font-normal text-white/60">/hora</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mensagem de sucesso do agendamento */}
        {bookingSuccess && (
          <div className="bg-green-50 text-green-700 px-6 py-4 rounded-xl mb-6 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Solicitação enviada com sucesso!</p>
              <p className="text-sm text-green-600">
                O cuidador receberá sua solicitação por email e responderá em breve.
              </p>
            </div>
          </div>
        )}

        {/* Mensagem de sucesso da avaliação */}
        {reviewSuccess && (
          <div className="bg-green-50 text-green-700 px-6 py-4 rounded-xl mb-6 flex items-center gap-3">
            <Star className="w-5 h-5 flex-shrink-0 fill-green-500" />
            <div>
              <p className="font-semibold">Avaliação enviada!</p>
              <p className="text-sm text-green-600">
                Obrigado por avaliar. Sua opinião ajuda outros clientes!
              </p>
            </div>
          </div>
        )}

        {/* Modal de Agendamento */}
        {showBooking && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="bg-white rounded-2xl w-full max-w-4xl my-4 shadow-2xl">
              {/* Header do Modal */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Solicitar Atendimento
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    com {caregiverUser?.name}
                  </p>
                </div>
                <button
                  onClick={() => setShowBooking(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Conteúdo do Modal */}
              <form onSubmit={handleBooking} className="p-6">
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Coluna 1: Seleção de Serviço */}
                  <div className="space-y-4">
                    <ServiceSelector
                      caregiverPrices={caregiver.servicePrices || []}
                      defaultPrice={caregiver.hourlyRate}
                      onSelect={(data) => setBookingData(data)}
                    />
                  </div>

                  {/* Coluna 2: Dados do Agendamento */}
                  <div className="space-y-4">
                    {bookingData.serviceType ? (
                      <>
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          <span className="bg-primary-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
                            3
                          </span>
                          Dados do Agendamento
                        </h3>

                        <div className="bg-gray-50 rounded-xl p-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Dados do Solicitante
                          </h4>
                          <div className="space-y-1 text-sm">
                            <p className="text-gray-900">
                              <strong>Nome:</strong> {user?.name || 'Não informado'}
                            </p>
                            <p className="text-gray-900">
                              <strong>Telefone:</strong> {user?.phone || 'Não informado'}
                            </p>
                          </div>
                        </div>

                                                <div>
                          <label className="text-sm font-medium text-gray-700 mb-1 block">
                            Data disponível *
                          </label>
                          <select
                            value={bookingForm.startDate}
                            onChange={(e) =>
                              setBookingForm((prev) => ({
                                ...prev,
                                startDate: e.target.value,
                              }))
                            }
                            className="input-field"
                            required
                          >
                            <option value="">Selecione uma data</option>
                            {availableDates
                            .filter((item) => item.isAvailable)
                            .sort((a, b) => a.date.localeCompare(b.date))
                            .map((item) => (
                              <option key={item.date} value={`${item.date}T08:00`}>
                                {new Date(item.date + 'T00:00:00').toLocaleDateString('pt-BR', {
                                  weekday: 'long',
                                  day: '2-digit',
                                  month: 'long',
                                  year: 'numeric',
                                })}
                              </option>
                            ))}
                          </select>
                          {bookingData.durationHours > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              Duração: {bookingData.durationLabel} ({bookingData.durationHours}h)
                            </p>
                          )}
                        </div>

                        <AddressAutocomplete
                          value={bookingForm.address}
                          cep={bookingForm.cep}
                          onChange={(data) =>
                            setBookingForm((prev) => ({
                              ...prev,
                              cep: data.cep ?? prev.cep,
                              address: data.address ?? prev.address,
                            }))
                          }
                        />

                        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                          <h4 className="text-sm font-medium text-gray-700">
                            Dados do Paciente (opcional)
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={bookingForm.patientName}
                              onChange={(e) =>
                                setBookingForm((prev) => ({
                                  ...prev,
                                  patientName: e.target.value,
                                }))
                              }
                              className="input-field"
                              placeholder="Nome do paciente"
                            />
                            <input
                              type="number"
                              value={bookingForm.patientAge}
                              onChange={(e) =>
                                setBookingForm((prev) => ({
                                  ...prev,
                                  patientAge: e.target.value,
                                }))
                              }
                              className="input-field"
                              placeholder="Idade"
                            />
                          </div>
                          <input
                            type="text"
                            value={bookingForm.patientCondition}
                            onChange={(e) =>
                              setBookingForm((prev) => ({
                                ...prev,
                                patientCondition: e.target.value,
                              }))
                            }
                            className="input-field"
                            placeholder="Condição de saúde (ex: Alzheimer, pós-AVC)"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-1 block">
                            Observações adicionais
                          </label>
                          <textarea
                            value={bookingForm.notes}
                            onChange={(e) =>
                              setBookingForm((prev) => ({
                                ...prev,
                                notes: e.target.value,
                              }))
                            }
                            className="input-field"
                            rows={3}
                            placeholder="Informações importantes, rotina do paciente, etc."
                          />
                        </div>

                        {/* Resumo do Valor */}
                        <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl p-4 border border-primary-200">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-medium text-gray-700 block">Total a pagar</span>
                              <span className="text-xs text-gray-500">
                                {bookingData.serviceName} • {bookingData.durationLabel}
                              </span>
                            </div>
                            <span className="text-2xl font-bold text-primary-600">
                              R$ {bookingData.totalAmount.toFixed(2)}
                            </span>
                          </div>
                          {bookingData.discount > 0 && (
                            <p className="text-xs text-green-600 text-right mt-1">
                              Você economiza R$ {bookingData.discount.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full text-center py-12">
                        <div>
                          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500 font-medium">
                            Selecione o serviço e duração
                          </p>
                          <p className="text-gray-400 text-sm mt-1">
                            para preencher os dados do agendamento
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer do Modal */}
                {bookingData.serviceType && (
                  <div className="flex gap-3 mt-6 pt-6 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setShowBooking(false)}
                      className="btn-secondary flex-1 sm:flex-none"
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="btn-primary flex-1 sm:flex-none sm:min-w-[200px]">
                      Solicitar Agendamento
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <div className="card p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Sobre</h2>
              <p className="text-gray-600 leading-relaxed">{caregiver.bio}</p>
            </div>

            {/* Specialties */}
            <div className="card p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                Especialidades
              </h2>
              <div className="flex flex-wrap gap-2">
                {caregiver.specialties.map((spec) => (
                  <span
                    key={spec}
                    className="bg-primary-50 text-primary-700 px-4 py-2 rounded-xl text-sm font-medium"
                  >
                    {SPECIALTIES[spec] || spec}
                  </span>
                ))}
              </div>
            </div>

            {/* Certifications */}
            {caregiver.certifications?.length > 0 && (
              <div className="card p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3">
                  Certificações
                </h2>
                <div className="space-y-2">
                  {caregiver.certifications.map((cert, i) => (
                    <div key={i} className="flex items-center gap-2 text-gray-600">
                      <Award className="w-4 h-4 text-accent-500" />
                      {cert}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Availability */}
                        <div className="card p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                Disponibilidade
              </h2>
              {caregiver.availabilityCalendar?.length > 0 ? (
                <>
                  <p className="text-sm text-gray-500 mb-4">
                    Dias disponíveis para atendimento
                  </p>
                  <AvailabilityCalendar
                    selectedDates={caregiver.availabilityCalendar}
                    readOnly
                  />
                </>
              ) : (
                <p className="text-gray-400 text-sm">
                  Nenhuma data disponível cadastrada no momento.
                </p>
              )}
            </div>

            {/* Reviews */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  Avaliações ({reviews.length})
                </h2>
                
                {/* Botão de avaliar - só aparece se pode avaliar */}
                {isAuthenticated && user?.role === 'client' && canReview && (
                  <button
                    onClick={() => setShowReview(!showReview)}
                    className="btn-accent !py-2 !px-4 text-sm flex items-center gap-1.5"
                  >
                    <Star className="w-3.5 h-3.5" />
                    Avaliar
                  </button>
                )}
              </div>

              {/* Mensagem se não pode avaliar */}
              {isAuthenticated && user?.role === 'client' && !canReview && (
                <div className="bg-blue-50 rounded-xl p-4 mb-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-700 font-medium">
                      Como funciona a avaliação?
                    </p>
                    <p className="text-sm text-blue-600 mt-1">
                      Você poderá avaliar este cuidador após contratar um serviço e ele ser concluído.
                      Isso garante que as avaliações sejam de clientes reais.
                    </p>
                  </div>
                </div>
              )}

              {/* Formulário de Avaliação */}
              {showReview && canReview && (
                <form
                  onSubmit={handleReview}
                  className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-5 mb-6 space-y-4 border border-yellow-200"
                >
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Como você avalia o atendimento?
                    </label>
                    <div className="flex items-center gap-3">
                      <StarRating
                        rating={reviewForm.rating}
                        size={32}
                        interactive
                        onChange={(r) =>
                          setReviewForm((prev) => ({ ...prev, rating: r }))
                        }
                      />
                      <span className="text-lg font-bold text-gray-700">
                        {reviewForm.rating}/5
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Conte sua experiência
                    </label>
                    <textarea
                      value={reviewForm.comment}
                      onChange={(e) =>
                        setReviewForm((prev) => ({
                          ...prev,
                          comment: e.target.value,
                        }))
                      }
                      className="input-field"
                      rows={4}
                      placeholder="Como foi o atendimento? O cuidador foi pontual? Atendeu bem às necessidades? Recomendaria?"
                      required
                    />
                  </div>

                  <div className="flex gap-2">
                    <button 
                      type="submit" 
                      disabled={reviewLoading}
                      className="btn-primary flex items-center gap-1.5"
                    >
                      {reviewLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Enviar Avaliação
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReview(false)}
                      className="btn-secondary"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}

              {/* Lista de Reviews */}
              {reviews.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400">Nenhuma avaliação ainda</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Seja o primeiro a avaliar após um atendimento!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review._id}
                      className="border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-sm font-bold text-white">
                          {(review.clientId as any)?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {(review.clientId as any)?.name || 'Cliente'}
                          </p>
                          <div className="flex items-center gap-2">
                            <StarRating rating={review.rating} size={14} />
                            <span className="text-xs text-gray-400">
                              {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed pl-[52px]">
                        {review.comment}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <div className="card p-6 sticky top-24">
              <h3 className="font-bold text-lg text-gray-900 mb-4">
                Solicitar Atendimento
              </h3>

              {isAuthenticated && user?.role === 'client' ? (
                <div className="space-y-3">
                  <button
                    onClick={() => setShowBooking(true)}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    Agendar Atendimento
                  </button>
                  {caregiverUser?.phone && (
                    <a
                      href={`tel:${caregiverUser.phone}`}
                      className="btn-secondary w-full flex items-center justify-center gap-2"
                    >
                      <Phone className="w-4 h-4" />
                      Ligar
                    </a>
                  )}
                  {caregiverUser?.email && (
                    <a
                      href={`mailto:${caregiverUser.email}`}
                      className="btn-secondary w-full flex items-center justify-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      Email
                    </a>
                  )}
                </div>
              ) : !isAuthenticated ? (
                <div className="text-center">
                  <p className="text-gray-500 text-sm mb-4">
                    Faça login para solicitar atendimento
                  </p>
                  <a href="/login" className="btn-primary w-full inline-block text-center">
                    Fazer Login
                  </a>
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center">
                  Apenas clientes podem solicitar atendimento
                </p>
              )}

              {/* Info adicional */}
              <div className="mt-6 pt-6 border-t border-gray-100 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Valor/hora</span>
                  <span className="font-bold text-primary-600">
                    R$ {caregiver.hourlyRate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Experiência</span>
                  <span className="font-medium text-gray-900">
                    {caregiver.experienceYears} anos
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Avaliação</span>
                  <span className="font-medium text-gray-900 flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    {caregiver.rating.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente principal com Suspense (necessário para useSearchParams)
export default function CaregiverDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      }
    >
      <CaregiverDetailContent />
    </Suspense>
  );
}