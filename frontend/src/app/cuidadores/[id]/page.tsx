'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Caregiver, Review, SPECIALTIES, DAYS } from '@/types';
import { StarRating } from '@/components/StarRating';
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
  AlertCircle,
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

  const [bookingForm, setBookingForm] = useState({
    startDate: '',
    endDate: '',
    notes: '',
    clientName: '',
    clientPhone: '',
    address: '',
    careType: '',
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
    try {
      await api.createBooking({
        caregiverId: id,
        ...bookingForm,
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                <p className="text-gray-400 text-sm">
                  Nenhuma avaliação ainda
                </p>
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
                showBooking ? (
                  <form onSubmit={handleBooking} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Seu Nome
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
                        className="input-field !py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Telefone
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
                        className="input-field !py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Data Início
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
                        className="input-field !py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Data Fim
                      </label>
                      <input
                        type="datetime-local"
                        value={bookingForm.endDate}
                        onChange={(e) =>
                          setBookingForm((prev) => ({
                            ...prev,
                            endDate: e.target.value,
                          }))
                        }
                        className="input-field !py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Tipo de Cuidado
                      </label>
                      <select
                        value={bookingForm.careType}
                        onChange={(e) =>
                          setBookingForm((prev) => ({
                            ...prev,
                            careType: e.target.value,
                          }))
                        }
                        className="input-field !py-2"
                      >
                        <option value="">Selecione</option>
                        {Object.entries(SPECIALTIES).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Endereço
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
                        className="input-field !py-2"
                        placeholder="Endereço do atendimento"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Observações
                      </label>
                      <textarea
                        value={bookingForm.notes}
                        onChange={(e) =>
                          setBookingForm((prev) => ({
                            ...prev,
                            notes: e.target.value,
                          }))
                        }
                        className="input-field !py-2"
                        rows={3}
                        placeholder="Descreva as necessidades..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="btn-primary flex-1">
                        Enviar
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowBooking(false)}
                        className="btn-secondary"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
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
                )
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}