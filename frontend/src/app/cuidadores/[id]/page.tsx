'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Caregiver, Review, SPECIALTIES, DAYS } from '@/types';
import { StarRating } from '@/components/StarRating';
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
} from 'lucide-react';

export default function CaregiverDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [caregiver, setCaregiver] = useState<Caregiver | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

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
    clientName: '',
    clientPhone: '',
    address: '',
    patientName: '',
    patientAge: '',
    patientCondition: '',
  });

  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [caregiverData, reviewsData] = await Promise.all([
          api.getCaregiver(id as string),
          api.getReviews(id as string),
        ]);
        setCaregiver(caregiverData);
        setReviews(reviewsData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

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
        durationKey: bookingData.durationKey,
        durationHours: bookingData.durationHours,
        pricePerHour: bookingData.pricePerHour,
        totalAmount: bookingData.totalAmount,
        discount: bookingData.discount,
        startDate: bookingForm.startDate,
        endDate: end.toISOString(),
        notes: bookingForm.notes,
        clientName: bookingForm.clientName,
        clientPhone: bookingForm.clientPhone,
        address: bookingForm.address,
        patientName: bookingForm.patientName,
        patientAge: bookingForm.patientAge ? Number(bookingForm.patientAge) : undefined,
        patientCondition: bookingForm.patientCondition,
      });
      setShowBooking(false);
      setBookingSuccess(true);
      setTimeout(() => setBookingSuccess(false), 5000);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newReview = await api.createReview({
        caregiverId: id,
        ...reviewForm,
      });
      setReviews((prev) => [newReview, ...prev]);
      setShowReview(false);
      setReviewForm({ rating: 5, comment: '' });
    } catch (error: any) {
      alert(error.message);
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
        {bookingSuccess && (
          <div className="bg-green-50 text-green-700 px-6 py-4 rounded-xl mb-6 flex items-center gap-3">
            <CheckCircle className="w-5 h-5" />
            <div>
              <p className="font-semibold">Solicitação enviada!</p>
              <p className="text-sm text-green-600">
                O cuidador receberá sua solicitação e entrará em contato.
              </p>
            </div>
          </div>
        )}

        {/* Modal de Agendamento - Tela cheia em mobile, modal grande em desktop */}
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

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">
                              Seu Nome *
                            </label>
                            <input
                              type="text"
                              value={bookingForm.clientName}
                              onChange={(e) =>
                                setBookingForm((prev) => ({
                                  ...prev,
                                  clientName: e.target.value,
                                }))
                              }
                              className="input-field"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">
                              Telefone *
                            </label>
                            <input
                              type="tel"
                              value={bookingForm.clientPhone}
                              onChange={(e) =>
                                setBookingForm((prev) => ({
                                  ...prev,
                                  clientPhone: e.target.value,
                                }))
                              }
                              className="input-field"
                              placeholder="(11) 99999-0000"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-1 block">
                            Data e Hora de Início *
                          </label>
                          <input
                            type="datetime-local"
                            value={bookingForm.startDate}
                            onChange={(e) =>
                              setBookingForm((prev) => ({
                                ...prev,
                                startDate: e.target.value,
                              }))
                            }
                            className="input-field"
                            required
                          />
                          {bookingData.durationHours > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              Duração: {bookingData.durationLabel} ({bookingData.durationHours}h)
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-1 block">
                            Endereço do Atendimento *
                          </label>
                          <input
                            type="text"
                            value={bookingForm.address}
                            onChange={(e) =>
                              setBookingForm((prev) => ({
                                ...prev,
                                address: e.target.value,
                              }))
                            }
                            className="input-field"
                            placeholder="Rua, número, bairro, cidade"
                            required
                          />
                        </div>

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
              <div className="flex flex-wrap gap-2">
                {caregiver.availability?.map((day) => (
                  <span
                    key={day}
                    className="bg-accent-50 text-accent-700 px-4 py-2 rounded-xl text-sm font-medium"
                  >
                    {DAYS[day] || day}
                  </span>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  Avaliações ({reviews.length})
                </h2>
                {isAuthenticated && user?.role === 'client' && (
                  <button
                    onClick={() => setShowReview(!showReview)}
                    className="btn-secondary !py-2 !px-4 text-sm flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Avaliar
                  </button>
                )}
              </div>

              {/* Review Form */}
              {showReview && (
                <form
                  onSubmit={handleReview}
                  className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3"
                >
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Nota
                    </label>
                    <StarRating
                      rating={reviewForm.rating}
                      size={24}
                      interactive
                      onChange={(r) =>
                        setReviewForm((prev) => ({ ...prev, rating: r }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Comentário
                    </label>
                    <textarea
                      value={reviewForm.comment}
                      onChange={(e) =>
                        setReviewForm((prev) => ({
                          ...prev,
                          comment: e.target.value,
                        }))
                      }
                      className="input-field !py-2"
                      rows={3}
                      placeholder="Como foi sua experiência?"
                      required
                    />
                  </div>
                  <button type="submit" className="btn-primary !py-2 text-sm flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5" />
                    Enviar Avaliação
                  </button>
                </form>
              )}

              {/* Reviews List */}
              {reviews.length === 0 ? (
                <p className="text-gray-400 text-sm">Nenhuma avaliação ainda</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review._id}
                      className="border-b border-gray-100 pb-4 last:border-0"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">
                          {(review.clientId as any)?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900">
                            {(review.clientId as any)?.name || 'Anônimo'}
                          </p>
                          <StarRating rating={review.rating} size={12} />
                        </div>
                        <span className="text-xs text-gray-400 ml-auto">
                          {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm pl-11">
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