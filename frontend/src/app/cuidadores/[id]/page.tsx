'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { bookingFormSchema, reviewSchema, type ReviewFormData, type BookingFormData } from '@/validations/schemas';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { AvailabilityDate, Caregiver, Review, SPECIALTIES } from '@/types';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import { StarRating } from '@/components/StarRating';
import { UserAvatar } from '@/components/UserAvatar';
import { ServiceSelector } from '@/components/ServiceSelector';
import {
  MapPin,
  Clock,
  Award,
  User,
  Shield,
  Lock,
  Phone,
  Mail,
  Calendar,
  ChevronLeft,
  Loader2,
  CheckCircle,
  CheckCircle2,
  MessageSquare,
  Send,
  X,
  AlertCircle,
  Star,
  MessageCircle,
} from 'lucide-react';
import { saveAddress } from '@/utils/savedAddresses';
import { SavedAddresses } from '@/components/SavedAddress';
import {
  combineDateAndTime,
  getAvailableStartTimes,
  getComputedEndDateTime,
  getSuggestedEndDate,
  isHourlyDuration,
  isMultiDayDuration,
} from '@/utils/booking';
import { buildFullAddress } from '@/utils/addressFields';
import { getDatesInRange } from '@/utils/dateRange';
import { AvailabilityCalendar } from '@/components/AvailabilityCalendar';
import { useCaregiverData } from '@/hooks/useCaregiverData';
import { useBookingForm } from '@/hooks/useBookingForm';
import { useReviewForm } from '@/hooks/useReviewForm';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function CaregiverDetailContent() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const caregiverId = id as string;
  const [showBooking, setShowBooking] = useState(false);
  const [shouldLoadAvailability, setShouldLoadAvailability] = useState(false);

  // Custom Hooks
  const {
    caregiver,
    setCaregiver,
    reviews,
    reviewsLoading,
    setReviews,
    availableDates,
    bookedDates,
    availabilityLoading,
    loading,
    canReview,
    setCanReview,
    reviewableBookings,
    setReviewableBookings,
    canChat,
    chatBookingId,
    refreshAvailability
  } = useCaregiverData(caregiverId, user, isAuthenticated, {
    loadAvailability: shouldLoadAvailability,
  });

  const [chatLoading, setChatLoading] = useState(false);
  
  const {
    form: bookingFormHook,
    bookingData,
    setBookingData,
    bookingLoading,
    bookingError,
    setBookingError,
    dateRangeError,
    isRangeAvailable,
    isAddressValidated,
    setIsAddressValidated,
    hourlyDateOptions,
    availableStartTimesOnHour,
    computedHourlyEnd,
    validateDateRange,
    handleBookingSubmit,
  } = useBookingForm({
    caregiverId,
    availableDates,
    user,
    onSuccess: () => {
      setShowBooking(false);
      toast.success('Solicitação enviada com sucesso!', {
        description: 'O cuidador responderá em breve.'
      });
      refreshAvailability();
    }
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors: bookingErrors },
  } = bookingFormHook;

  const bookingForm = watch();

  const [showReview, setShowReview] = useState(false);

  const {
    form: reviewFormHook,
    reviewLoading,
    selectedBookingForReview,
    setSelectedBookingForReview,
    onReviewSubmit: handleReviewSubmit,
  } = useReviewForm({
    caregiverId,
    onSuccess: (newReview) => {
      setReviews((prev) => [newReview, ...prev]);
      setShowReview(false);
      toast.success('Avaliação enviada!', {
        description: 'Obrigado por sua opinião.'
      });
      
      const remaining = reviewableBookings.filter(b => b._id !== selectedBookingForReview);
      setReviewableBookings(remaining);
      if (remaining.length === 0) setCanReview(false);
      else if (remaining.length === 1) setSelectedBookingForReview(remaining[0]._id);
      else setSelectedBookingForReview(null);

      if (caregiver) {
        const totalRating = caregiver.rating * caregiver.reviewCount + newReview.rating;
        const newCount = caregiver.reviewCount + 1;
        setCaregiver({ ...caregiver, rating: totalRating / newCount, reviewCount: newCount });
      }
    }
  });

  const {
    register: registerReview,
    handleSubmit: handleSubmitReview,
    setValue: setValueReview,
    watch: watchReview,
    formState: { errors: reviewErrors },
  } = reviewFormHook;

  const reviewForm = watchReview();

  useEffect(() => {
    if (showBooking && !shouldLoadAvailability) {
      setShouldLoadAvailability(true);
    }
  }, [showBooking, shouldLoadAvailability]);

  // URL Param logic for review
  useEffect(() => {
    const avaliarBookingId = searchParams.get('avaliar');
    if (avaliarBookingId && canReview) {
      const exists = reviewableBookings.some(b => b._id === avaliarBookingId);
      if (exists) {
        setSelectedBookingForReview(avaliarBookingId);
        setShowReview(true);
      }
    }
  }, [searchParams, canReview, reviewableBookings, setSelectedBookingForReview]);

  // Handlers
  const handleSelectBookingDate = (date: string) => {
    setValue('startDate', date);
    setValue('startTime', '');
    setValue('endTime', '');
  };

  const openBookingDialog = () => {
    setShouldLoadAvailability(true);
    setShowBooking(true);
  };

  const handleStartChat = async () => {
    if (!chatBookingId) {
      alert('Para conversar com este cuidador, primeiro solicite um atendimento.');
      return;
    }

    setChatLoading(true);
    try {
      const conversation = await api.getOrCreateConversation(chatBookingId);
      router.push(`/chat?conversation=${conversation._id}`);
    } catch (error: any) {
      alert(error.message || 'Erro ao iniciar chat');
    } finally {
      setChatLoading(false);
    }
  };

  // Loading / Not found
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 py-12 animate-pulse">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <Skeleton className="w-32 h-32 rounded-2xl bg-white/10" />
              <div className="flex-1 space-y-4 pt-2">
                <Skeleton className="h-10 w-64 bg-white/10" />
                <Skeleton className="h-6 w-48 bg-white/10" />
                <Skeleton className="h-8 w-32 bg-white/10" />
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-48 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-64 w-full rounded-2xl" />
              <Skeleton className="h-48 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!caregiver) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-sm text-center border border-gray-100 max-w-sm">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Cuidador não encontrado</h2>
          <p className="text-gray-500 mt-2">O perfil que você está procurando pode ter sido removido ou o link está incorreto.</p>
          <Button onClick={() => router.push('/cuidadores')} className="mt-6 w-full">
            Voltar para a busca
          </Button>
        </div>
      </div>
    );
  }

  const caregiverUser = caregiver.userId;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 py-12 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-400/10 rounded-full -ml-32 -mb-32 blur-2xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-white hover:bg-white/10 flex items-center gap-2 mb-8 px-2 -ml-2 group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Voltar para a busca
          </Button>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="relative group">
              <UserAvatar
                name={caregiverUser?.name}
                avatar={caregiverUser?.avatar}
                size={128}
                className="rounded-3xl border-4 border-white/20 flex-shrink-0 shadow-2xl transition-transform group-hover:scale-105"
              />
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 border-4 border-primary-700 w-8 h-8 rounded-full shadow-lg" title="Disponível agora" />
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                <h1 className="text-4xl font-black text-white tracking-tight">{caregiverUser?.name}</h1>
                <Badge className="bg-white/10 hover:bg-white/20 text-white border-white/20 w-fit mx-auto sm:mx-0">
                  Verificado
                </Badge>
              </div>

              <div className="flex flex-wrap justify-center md:justify-start items-center gap-6 mt-4 text-white/90">
                <span className="flex items-center gap-2 font-medium">
                  <MapPin className="w-5 h-5 text-primary-300" />
                  {caregiver.city}, {caregiver.state}
                </span>
                <span className="flex items-center gap-2 font-medium">
                  <Clock className="w-5 h-5 text-primary-300" />
                  {caregiver.experienceYears} anos de exp.
                </span>
                <div className="flex items-center gap-3 bg-black/10 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/5">
                  <StarRating rating={caregiver.rating} size={18} />
                  <span className="text-white font-black">{caregiver.rating.toFixed(1)}</span>
                  <span className="text-white/60 text-xs font-bold uppercase">({caregiver.reviewCount})</span>
                </div>
              </div>
            </div>

            <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white p-6 shadow-2xl min-w-[200px]">
              <p className="text-sm font-bold uppercase tracking-wider text-primary-200 mb-1">Valor base</p>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold">R$</span>
                <span className="text-4xl font-black">{caregiver.hourlyRate}</span>
                <span className="text-lg font-medium text-white/60">/hora</span>
              </div>
              <p className="text-[10px] text-white/40 mt-2 uppercase font-black">Preço flexível por serviço</p>
            </Card>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Modal de Agendamento */}
        <Dialog
          open={showBooking}
          onOpenChange={(open) => {
            if (open) setShouldLoadAvailability(true);
            setShowBooking(open);
          }}
        >
          <DialogContent className="sm:max-w-6xl w-[95vw] p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
            <form onSubmit={handleSubmit(handleBookingSubmit)} className="flex flex-col max-h-[90vh]">
              <DialogHeader className="p-6 border-b border-gray-100 bg-white flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-2xl font-black text-gray-900 tracking-tight">Solicitar Atendimento</DialogTitle>
                    <DialogDescription className="text-sm text-gray-500 font-medium mt-1">
                      Agendamento com <span className="text-primary-600 font-bold">{caregiverUser?.name}</span>
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="flex-1 overflow-y-auto p-8 bg-white">
                <div className="max-w-5xl mx-auto">
                {availabilityLoading && (
                  <div className="mb-5 bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    <p className="text-sm text-blue-800">
                      Carregando disponibilidade do cuidador...
                    </p>
                  </div>
                )}

                {bookingError && (
                  <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{bookingError}</p>
                  </div>
                )}

                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Coluna 1: Serviço */}
                  <div className="space-y-4">
                    <ServiceSelector
                      caregiverPrices={caregiver.servicePrices}
                      onSelect={(selected) => {
                        setBookingData(selected);
                        setValue('serviceType', selected.serviceType, { shouldValidate: true });
                        setValue('durationKey', selected.durationKey, { shouldValidate: true });
                      }}
                    />
                    {bookingErrors.serviceType && (
                      <p className="mt-2 text-xs text-red-500 font-medium bg-red-50 p-2 rounded-lg flex items-center gap-1.5 border border-red-100">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {bookingErrors.serviceType.message}
                      </p>
                    )}
                    {bookingErrors.durationKey && (
                      <p className="mt-2 text-xs text-red-500 font-medium bg-red-50 p-2 rounded-lg flex items-center gap-1.5 border border-red-100">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {bookingErrors.durationKey.message}
                      </p>
                    )}
                  </div>

                  {/* Coluna 2: Dados */}
                  <div className="space-y-4">
                    {bookingData.serviceType ? (
                      <>
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          <span className="bg-primary-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
                            3
                          </span>
                          Dados do Agendamento
                        </h3>

                        {/* Dados do solicitante */}
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

                        {/* Seleção de data/hora */}
                        {isHourlyDuration(bookingData.durationKey) ? (
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Escolha o dia do atendimento *
                              </label>
                              <div className="rounded-xl border border-gray-200 overflow-hidden">
                                <AvailabilityCalendar
                                  selectedDates={hourlyDateOptions}
                                  bookedDates={bookedDates}
                                  readOnly
                                  compact
                                  onSelectDate={handleSelectBookingDate}
                                  selectedDate={bookingForm.startDate ?? null}
                                />
                              </div>
                              {bookingErrors.startDate && (
                                <p className="mt-1 text-xs text-red-500">
                                  {bookingErrors.startDate.message}
                                </p>
                              )}
                            </div>

                            {bookingForm.startDate && (
                              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                                <label className="text-sm font-medium text-gray-700 mb-2 block">
                                  Escolha o horário de início *
                                </label>
                                <p className="text-xs text-gray-500 mb-2">
                                  Entre atendimentos existe um intervalo de 1 hora para deslocamento.
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {availableStartTimesOnHour.map((time) => (
                                    <button
                                      key={time}
                                      type="button"
                                      onClick={() => setValue('startTime', time)}
                                      className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                                        bookingForm.startTime === time
                                          ? 'bg-primary-600 text-white border-primary-600'
                                          : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300'
                                      }`}
                                    >
                                      {time}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-1 block">
                                Horário de fim
                              </label>
                              <input
                                type="text"
                                value={bookingForm.endTime ?? ''}
                                className="input-field bg-gray-100"
                                readOnly
                              />
                            </div>

                            {bookingForm.startDate && availableStartTimesOnHour.length === 0 && (
                              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                                <p className="text-sm text-red-700">
                                  Não há horários livres suficientes nesta data para a duração selecionada.
                                </p>
                              </div>
                            )}

                            {computedHourlyEnd && (
                              <div className="bg-primary-50 border border-primary-200 rounded-xl p-3">
                                <p className="text-sm text-primary-700">
                                  Atendimento previsto para terminar em{' '}
                                  <strong>
                                    {new Date(
                                      computedHourlyEnd.endDate +
                                        'T' +
                                        computedHourlyEnd.endTime +
                                        ':00',
                                    ).toLocaleString('pt-BR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </strong>
                                  .
                                </p>
                              </div>
                            )}

                            <p className="text-xs text-gray-500">
                              Duração selecionada: {bookingData.durationLabel}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-1 block">
                                Data de início *
                              </label>
                              <select
                                value={bookingForm.startDate ?? ''}
                                onChange={(e) => {
                                  const startDate = e.target.value;
                                  const suggestedEnd = getSuggestedEndDate(
                                    new Date(startDate + 'T00:00:00'),
                                    bookingData.durationKey,
                                  );
                                  const endDate = suggestedEnd.toISOString().split('T')[0];
                                  setValue('startDate', startDate);
                                  setValue('endDate', endDate);
                                  validateDateRange(startDate, endDate);
                                }}
                                className="input-field"
                              >
                                <option value="">Selecione a data inicial</option>
                                {availableDates
                                  .filter((item) => item.isAvailable)
                                  .sort((a, b) => a.date.localeCompare(b.date))
                                  .map((item) => (
                                    <option key={item.date} value={item.date}>
                                      {new Date(item.date + 'T00:00:00').toLocaleDateString(
                                        'pt-BR',
                                        {
                                          weekday: 'long',
                                          day: '2-digit',
                                          month: 'long',
                                          year: 'numeric',
                                        },
                                      )}
                                    </option>
                                  ))}
                              </select>
                              {bookingErrors.startDate && (
                                <p className="mt-1 text-xs text-red-500">
                                  {bookingErrors.startDate.message}
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-1 block">
                                Data de término
                              </label>
                              <input
                                type="date"
                                value={bookingForm.endDate ?? ''}
                                className="input-field bg-gray-100"
                                readOnly
                              />
                            </div>

                            {dateRangeError && (
                              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                                <p className="text-sm text-red-700">{dateRangeError}</p>
                              </div>
                            )}

                            {isRangeAvailable &&
                              bookingForm.startDate &&
                              bookingForm.endDate &&
                              isMultiDayDuration(bookingData.durationKey) && (
                                <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                                  <p className="text-sm text-green-700">
                                    O cuidador está disponível durante todo o período selecionado.
                                  </p>
                                </div>
                              )}

                            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                              <p className="text-sm text-orange-700">
                                Este pacote ocupa múltiplos dias consecutivos.
                              </p>
                              <p className="text-xs text-orange-600 mt-1">
                                Duração selecionada: {bookingData.durationLabel}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Endereços salvos */}
                        <SavedAddresses
                          onSelect={(saved) => {
                            const selectedFullAddress =
                              buildFullAddress(
                                saved.baseAddress || saved.address,
                                saved.number || '',
                                saved.complement || '',
                              ) || saved.address;
                            const hasStructuredAddress =
                              Boolean(saved.baseAddress?.trim()) && Boolean(saved.number?.trim());

                            setValue('cep', saved.cep || '');
                            setValue('address', saved.baseAddress || saved.address);
                            setValue('number', saved.number || '');
                            setValue('complement', saved.complement || '');
                            setValue('fullAddress', selectedFullAddress);
                            setValue('lat', saved.lat || '');
                            setValue('lon', saved.lon || '');
                            setIsAddressValidated(
                              Boolean(saved.cep && saved.lat && saved.lon && hasStructuredAddress),
                            );
                          }}
                        />

                        {/* Endereço */}
                        <AddressAutocomplete
                          value={bookingForm.address ?? ''}
                          cep={bookingForm.cep ?? ''}
                          number={bookingForm.number ?? ''}
                          complement={bookingForm.complement ?? ''}
                          lat={bookingForm.lat ?? ''}
                          lon={bookingForm.lon ?? ''}
                          isValidated={isAddressValidated}
                          onChange={(data) => {
                            if (data.cep !== undefined) setValue('cep', data.cep);
                            if (data.address !== undefined) setValue('address', data.address);
                            if (data.number !== undefined) setValue('number', data.number);
                            if (data.complement !== undefined) setValue('complement', data.complement);
                            if (data.fullAddress !== undefined) setValue('fullAddress', data.fullAddress);
                            if (data.lat !== undefined) setValue('lat', data.lat);
                            if (data.lon !== undefined) setValue('lon', data.lon);
                          }}
                          onValidationChange={setIsAddressValidated}
                        />

                        {/* Dados do paciente */}
                        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                          <h4 className="text-sm font-medium text-gray-700">Dados do Paciente</h4>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Input
                                type="text"
                                {...register('patientName')}
                                className={bookingErrors.patientName ? 'border-red-400 focus-visible:ring-red-100' : ''}
                                placeholder="Nome do paciente"
                              />
                              {bookingErrors.patientName && (
                                <p className="mt-1 text-xs text-red-500">
                                  {bookingErrors.patientName.message}
                                </p>
                              )}
                            </div>

                            <div>
                              <Input
                                type="number"
                                {...register('patientAge')}
                                className={bookingErrors.patientAge ? 'border-red-400 focus-visible:ring-red-100' : ''}
                                placeholder="Idade"
                              />
                              {bookingErrors.patientAge && (
                                <p className="mt-1 text-xs text-red-500">
                                  {bookingErrors.patientAge.message}
                                </p>
                              )}
                            </div>
                          </div>

                          {bookingData.serviceType !== 'cuidado_basico_idoso' && (
                            <Input
                              type="text"
                              {...register('patientCondition')}
                              className={
                                [
                                  'cuidado_pcd_intelectual',
                                  'cuidado_pcd_fisico',
                                  'cuidado_alzheimer',
                                  'cuidado_acamado',
                                ].includes(bookingData.serviceType)
                                  ? 'bg-gray-100 cursor-not-allowed opacity-70'
                                  : ''
                              }
                              placeholder="Condição do paciente"
                              readOnly={[
                                'cuidado_pcd_intelectual',
                                'cuidado_pcd_fisico',
                                'cuidado_alzheimer',
                                'cuidado_acamado',
                               ].includes(bookingData.serviceType)}
                            />
                          )}
                        </div>

                        {/* Observações */}
                        <div>
                          <Label className="mb-1.5 block">
                            Observações adicionais
                          </Label>
                          <Textarea
                            {...register('notes')}
                            rows={3}
                            placeholder="Informações importantes, rotina do paciente, etc."
                          />
                        </div>

                        {/* Resumo valor */}
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

                  </div>
                </div>

              {/* Footer Fixo */}
              <div className="p-6 border-t border-gray-100 bg-gray-50/80 backdrop-blur-md flex items-center justify-between gap-4 flex-shrink-0">
                <div className="hidden sm:block">
                  {bookingData.serviceType && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full font-bold">
                        {bookingData.serviceName}
                      </div>
                      <div className="text-gray-500 font-medium">
                        Total: <span className="text-gray-900 font-black">R$ {bookingData.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowBooking(false)}
                    disabled={bookingLoading}
                    className="flex-1 sm:flex-none font-bold text-gray-500"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      !bookingData.serviceType ||
                      bookingLoading ||
                      (isMultiDayDuration(bookingData.durationKey) && !isRangeAvailable)
                    }
                    className="flex-1 sm:flex-none sm:min-w-[240px] shadow-lg shadow-primary-200"
                  >
                    {bookingLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Processando...
                      </>
                    ) : (
                      'Confirmar e Solicitar'
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Sobre */}
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b border-gray-100/50">
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary-600" />
                  Sobre o Cuidador
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <p className="text-gray-600 leading-relaxed text-lg italic font-serif">"{caregiver.bio}"</p>
              </CardContent>
            </Card>

            {/* Especialidades */}
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b border-gray-100/50">
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary-600" />
                  Especialidades e Foco
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="flex flex-wrap gap-3">
                  {caregiver.specialties.map((spec) => (
                    <Badge
                      key={spec}
                      variant="secondary"
                      className="bg-primary-50 text-primary-700 hover:bg-primary-100 px-4 py-2 rounded-xl text-sm font-bold border-none transition-colors"
                    >
                      {SPECIALTIES[spec] || spec}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Certificações */}
            {caregiver.certifications?.length > 0 && (
              <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b border-gray-100/50">
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-primary-600" />
                    Certificações e Cursos
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {caregiver.certifications.map((cert, i) => (
                      <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-primary-200 transition-colors">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                          <Award className="w-5 h-5" />
                        </div>
                        <span className="font-semibold text-gray-700">{cert}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Avaliações */}
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b border-gray-100/50 flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary-600" />
                  Avaliações de Clientes
                </CardTitle>
                <Badge variant="outline" className="font-bold">{reviews.length} avaliações</Badge>
              </CardHeader>
              <CardContent className="p-8">
                {/* Pode avaliar */}
                {isAuthenticated && user?.role === 'client' && canReview && !showReview && (
                  <Alert className="bg-emerald-50 border-emerald-200 text-emerald-900 mb-8 p-6 rounded-2xl">
                    <Star className="h-5 w-5 text-emerald-600" />
                    <div className="ml-2">
                      <AlertTitle className="font-black text-lg">Deixe sua opinião!</AlertTitle>
                      <AlertDescription className="mt-2 text-emerald-800 space-y-4">
                        <p>Você tem <span className="font-bold underline">{reviewableBookings.length} atendimento{reviewableBookings.length > 1 ? 's' : ''}</span> aguardando sua avaliação.</p>
                        <Button
                          onClick={() => setShowReview(true)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                        >
                          Avaliar Agora
                        </Button>
                      </AlertDescription>
                    </div>
                  </Alert>
                )}

                {/* Não pode avaliar */}
                {isAuthenticated && user?.role === 'client' && !canReview && (
                  <Alert className="bg-blue-50 border-blue-100 text-blue-900 mb-8 rounded-2xl">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                    <div className="ml-2">
                      <AlertTitle className="font-bold">Como avaliar?</AlertTitle>
                      <AlertDescription className="mt-1 text-blue-700">
                        Você poderá avaliar este cuidador após completar seu primeiro atendimento com ele.
                      </AlertDescription>
                    </div>
                  </Alert>
                )}

              {/* Formulário de avaliação */}
              {showReview && canReview && (
                <form
                  onSubmit={handleSubmitReview(handleReviewSubmit)}
                  className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-5 mb-6 space-y-4 border border-yellow-200"
                >
                  {reviewableBookings.length > 1 && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Qual atendimento você deseja avaliar?
                      </label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {reviewableBookings.map((booking) => (
                          <label
                            key={booking._id}
                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                              selectedBookingForReview === booking._id
                                ? 'border-primary-500 bg-primary-50 shadow-sm'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                          >
                            <input
                              type="radio"
                              name="bookingForReview"
                              value={booking._id}
                              checked={selectedBookingForReview === booking._id}
                              onChange={(e) => setSelectedBookingForReview(e.target.value)}
                              className="w-4 h-4 text-primary-600"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 text-sm truncate">
                                {booking.serviceName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(booking.startDate).toLocaleDateString('pt-BR')}
                                {booking.durationLabel && ` • ${booking.durationLabel}`}
                                {booking.totalAmount &&
                                  ` • R$ ${booking.totalAmount.toFixed(2)}`}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {reviewableBookings.length === 1 && (
                    <div className="bg-white rounded-xl p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Avaliando o atendimento:</p>
                      <p className="text-sm font-medium text-gray-900">
                        {reviewableBookings[0].serviceName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(reviewableBookings[0].startDate).toLocaleDateString('pt-BR')}
                        {reviewableBookings[0].durationLabel &&
                          ` • ${reviewableBookings[0].durationLabel}`}
                        {reviewableBookings[0].totalAmount &&
                          ` • R$ ${reviewableBookings[0].totalAmount.toFixed(2)}`}
                      </p>
                    </div>
                  )}

                  <div>
                    <Label className="mb-2 block">
                      Como você avalia o atendimento?
                    </Label>
                    <div className="flex items-center gap-3">
                      <StarRating
                        rating={reviewForm.rating}
                        size={32}
                        interactive
                        onChange={(r) => setValueReview('rating', r, { shouldValidate: true })}
                      />
                      <span className="text-lg font-bold text-gray-700">
                        {reviewForm.rating}/5
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label className="mb-1 block">
                      Conte sua experiência
                    </Label>
                    <Textarea
                      {...registerReview('comment')}
                      className={`${reviewErrors.comment ? 'border-red-400 focus-visible:ring-red-100' : ''}`}
                      rows={4}
                      placeholder="Como foi o atendimento? O cuidador foi pontual? Atendeu bem às necessidades? Recomendaria?"
                    />
                    {reviewErrors.comment && (
                      <p className="mt-1 text-xs text-red-500">{reviewErrors.comment.message}</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={reviewLoading || !selectedBookingForReview}
                      className="gap-1.5"
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
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setShowReview(false);
                        if (reviewableBookings.length > 1) {
                          setSelectedBookingForReview(null);
                        }
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              )}

              {/* Lista de reviews */}
              {reviewsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full rounded-2xl" />
                  <Skeleton className="h-24 w-full rounded-2xl" />
                  <Skeleton className="h-24 w-full rounded-2xl" />
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-16 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                  <MessageSquare className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-500 font-bold text-lg">Nenhuma avaliação ainda</p>
                  <p className="text-gray-400 text-sm mt-2 max-w-xs mx-auto">
                    Este cuidador aguarda seu primeiro feedback. Seja o primeiro a avaliar após um atendimento!
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {reviews.map((review) => (
                    <div
                      key={review._id}
                      className="group relative"
                    >
                      <div className="flex items-start gap-5">
                        <UserAvatar
                          name={(review.clientId as any)?.name}
                          avatar={(review.clientId as any)?.avatar}
                          size={56}
                          className="rounded-2xl shadow-sm border border-gray-100"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <h4 className="font-bold text-gray-900">
                              {(review.clientId as any)?.name || 'Cliente Verificado'}
                            </h4>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                              {new Date(review.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <StarRating rating={review.rating} size={16} />
                            <Badge variant="secondary" className="text-[10px] bg-primary-50 text-primary-700 border-none font-black uppercase">Excelente</Badge>
                          </div>
                          <p className="text-gray-600 leading-relaxed text-sm bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50">
                            {review.comment}
                          </p>
                        </div>
                      </div>
                      <div className="absolute -left-4 top-0 bottom-0 w-1 bg-primary-500 rounded-full scale-y-0 group-hover:scale-y-50 transition-transform origin-center opacity-0 group-hover:opacity-100" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="border-none shadow-xl rounded-3xl sticky top-24 overflow-hidden">
            <CardContent className="p-4">
              <h3 className="font-black text-xl text-gray-900 mb-6 tracking-tight">Solicitar Atendimento</h3>

              {isAuthenticated && user?.role === 'client' ? (
                <div className="space-y-4">
                  <Button
                    onClick={openBookingDialog}
                    className="w-full gap-3 h-16 text-lg font-black shadow-xl shadow-primary-500/20 rounded-2xl group"
                  >
                    <Calendar className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    Agendar Agora
                  </Button>

                  <div className="pt-2">
                    {canChat ? (
                      <div className="space-y-3">
                        <Alert className="bg-emerald-50 border-emerald-100 text-emerald-900 rounded-2xl p-4">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <AlertDescription className="text-xs font-bold">
                            Atendimento em andamento!
                          </AlertDescription>
                        </Alert>
                        <Button
                          onClick={handleStartChat}
                          disabled={chatLoading}
                          variant="secondary"
                          className="w-full gap-2 h-12 font-bold rounded-2xl bg-white border-2 border-gray-100 hover:bg-gray-50 text-gray-900"
                        >
                          {chatLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Conectando...
                            </>
                          ) : (
                            <>
                              <MessageCircle className="w-5 h-5 text-primary-500" />
                              Conversar no Chat
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <Alert className="bg-amber-50 border-amber-100 text-amber-900 rounded-2xl p-4">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-xs font-medium leading-relaxed">
                          Envie uma solicitação para liberar o chat com este cuidador.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              ) : !isAuthenticated ? (
                <div className="text-center space-y-6 py-4">
                  <div className="bg-gray-50 rounded-2xl p-6 border border-dashed border-gray-200">
                    <Lock className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm font-medium leading-relaxed">
                      Faça login para solicitar atendimento e conversar com o cuidador.
                    </p>
                  </div>
                  <Link 
                    href="/login" 
                    className={cn(buttonVariants({ variant: 'default' }), "w-full h-14 text-base font-black rounded-2xl")}
                  >
                    Entrar na Minha Conta
                  </Link>
                </div>
              ) : (
                <Alert className="bg-gray-50 border-gray-100 rounded-2xl">
                  <AlertDescription className="text-center font-bold text-gray-500">
                    Apenas clientes podem solicitar atendimento.
                  </AlertDescription>
                </Alert>
              )}

              <div className="mt-8 pt-8 border-t border-gray-100 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">Valor Base</span>
                  <span className="font-black text-xl text-primary-600">R$ {caregiver.hourlyRate}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">Experiência</span>
                  <span className="font-black text-gray-900">
                    {caregiver.experienceYears} anos
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">Avaliação</span>
                  <div className="flex items-center gap-1.5 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-100">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-black text-yellow-700">
                      {caregiver.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
  );
}

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
