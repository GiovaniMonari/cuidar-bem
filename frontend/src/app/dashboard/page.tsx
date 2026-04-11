// filepath: app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { Booking } from '@/types';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  User,
  MapPin,
  Phone,
  DollarSign,
  CreditCard,
  ExternalLink,
  Shield,
  ArrowRight,
  BadgeDollarSign,
  MessageCircle,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { BookingCalendar } from '@/components/BookingCalendar';

const CHECK_IN_EARLY_WINDOW_MS = 2 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  in_progress: { label: 'Em andamento', color: 'bg-emerald-100 text-emerald-700', icon: MapPin },
  completed: { label: 'Concluído', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const PAYMENT_STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: 'Aguardando Pagamento', color: 'bg-yellow-100 text-yellow-700' },
  paid: { label: 'Pago', color: 'bg-green-100 text-green-700' },
  held: { label: 'Pago - Retido na Plataforma', color: 'bg-blue-100 text-blue-700' },
  released: { label: 'Liberado ao Cuidador', color: 'bg-green-100 text-green-700' },
  refunded: { label: 'Reembolsado', color: 'bg-orange-100 text-orange-700' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
  failed: { label: 'Falhou', color: 'bg-red-100 text-red-700' },
};

/**
 * Determina se o botão de relatórios deve ser exibido para um booking.
 *
 * - Serviços curtos (≤ 24h): só aparece quando o status é "completed"
 * - Serviços longos (> 24h): aparece a partir do check-in do cuidador
 *   (status "in_progress" ou "completed")
 */
function shouldShowReports(booking: Booking): boolean {
  const durationMs =
    new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime();
  const isShortService = durationMs <= TWENTY_FOUR_HOURS_MS;

  if (isShortService) {
    // Serviços de até 24h: só após conclusão
    return booking.status === 'completed';
  }

  // Serviços longos (1 semana, 1 mês, etc.): a partir do check-in
  return ['in_progress', 'completed'].includes(booking.status);
}

export default function DashboardPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Record<string, any>>({});
  const [feedbackCounts, setFeedbackCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    try {
      const bookingsData = await api.getMyBookings();
      const bookingsList = Array.isArray(bookingsData) ? bookingsData : [];
      setBookings(bookingsList);

      const paymentMap: Record<string, any> = {};
      const feedbackMap: Record<string, number> = {};

      await Promise.all(
        bookingsList.map(async (booking: any) => {
          try {
            const payment = await api.getPaymentByBooking(booking._id);
            if (payment) {
              paymentMap[booking._id] = payment;
            }
          } catch {
            // Sem pagamento para este booking
          }

          try {
            const feedbacks = await api.getFeedbackByBooking(booking._id);
            feedbackMap[booking._id] = Array.isArray(feedbacks) ? feedbacks.length : 0;
          } catch {
            feedbackMap[booking._id] = 0;
          }
        }),
      );

      setPayments(paymentMap);
      setFeedbackCounts(feedbackMap);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId: string, status: string) => {
    setActionLoading(bookingId);
    try {
      await api.updateBookingStatus(bookingId, status);
      await fetchData();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const requestCurrentLocation = async () => {
    const isLocalEnvironment = ['localhost', '127.0.0.1', '::1'].includes(
      window.location.hostname,
    );

    if (!window.isSecureContext && !isLocalEnvironment) {
      throw new Error(
        'A localização do navegador só funciona em páginas seguras (HTTPS). Abra a plataforma em HTTPS para fazer o check-in.',
      );
    }

    const getPosition = (options: PositionOptions) =>
      new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Seu navegador não suporta geolocalização.'));
          return;
        }

        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });

    try {
      return await getPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      });
    } catch (error: any) {
      if (error?.code === error?.PERMISSION_DENIED || error?.code === 1) {
        throw new Error(
          'Permita o acesso à localização para realizar o check-in.',
        );
      }

      try {
        return await getPosition({
          enableHighAccuracy: false,
          timeout: 12000,
          maximumAge: 300000,
        });
      } catch (fallbackError: any) {
        if (
          fallbackError?.code === fallbackError?.PERMISSION_DENIED ||
          fallbackError?.code === 1
        ) {
          throw new Error(
            'Permita o acesso à localização para realizar o check-in.',
          );
        }

        if (
          fallbackError?.code === fallbackError?.POSITION_UNAVAILABLE ||
          fallbackError?.code === 2
        ) {
          throw new Error(
            'Não foi possível identificar sua localização atual. Ative a localização do dispositivo e tente novamente.',
          );
        }

        if (
          fallbackError?.code === fallbackError?.TIMEOUT ||
          fallbackError?.code === 3
        ) {
          throw new Error(
            'A localização demorou demais para responder. Tente novamente em um local com melhor sinal.',
          );
        }

        throw new Error(
          'Não foi possível obter sua localização atual para o check-in.',
        );
      }
    }
  };

  const handleCheckIn = async (bookingId: string) => {
    setActionLoading(bookingId);
    try {
      const position = await requestCurrentLocation();
      await api.checkInBooking(
        bookingId,
        position.coords.latitude,
        position.coords.longitude,
      );
      await fetchData();
      alert(
        'Check-in realizado com sucesso. Atendimento marcado como em andamento.',
      );
    } catch (error: any) {
      alert(error.message || 'Não foi possível realizar o check-in.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSimulatePayment = async (bookingId: string) => {
    setActionLoading(bookingId);
    try {
      await api.simulatePayment(bookingId);
      await fetchData();
      alert('✅ Pagamento simulado com sucesso!');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const openChat = async (bookingId: string) => {
    if (chatLoading === bookingId) {
      console.log('⏳ Já abrindo chat, aguarde...');
      return;
    }

    setChatLoading(bookingId);

    try {
      const conversation = await api.getOrCreateConversation(bookingId);
      router.push(`/chat?conversation=${conversation._id}`);
    } catch (error: any) {
      alert(error.message || 'Erro ao abrir conversa');
    } finally {
      setChatLoading(null);
    }
  };

  const openReports = (bookingId: string) => {
    router.push(`/dashboard/care-reports?booking=${bookingId}`);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  const filtered =
    tab === 'all' ? bookings : bookings.filter((b) => b.status === tab);

  // Calcular totais financeiros
  const totalEarnings = Object.values(payments)
    .filter((p: any) => p.status === 'released')
    .reduce(
      (sum: number, p: any) =>
        sum + (user?.role === 'caregiver' ? p.caregiverAmount : p.amount),
      0,
    );

  const pendingAmount = Object.values(payments)
    .filter((p: any) => ['pending', 'held', 'paid'].includes(p.status))
    .reduce(
      (sum: number, p: any) =>
        sum + (user?.role === 'caregiver' ? p.caregiverAmount : p.amount),
      0,
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            {user?.role === 'caregiver'
              ? 'Gerencie seus atendimentos e pagamentos'
              : 'Acompanhe seus agendamentos e pagamentos'}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="card p-4">
            <div className="text-2xl font-bold">{bookings.length}</div>
            <div className="text-sm text-gray-500">Total</div>
          </div>
          <div className="card p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {bookings.filter((b) => b.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-500">Pendentes</div>
          </div>
          <div className="card p-4">
            <div className="text-2xl font-bold text-blue-600">
              {
                bookings.filter((b) =>
                  ['confirmed', 'in_progress'].includes(b.status),
                ).length
              }
            </div>
            <div className="text-sm text-gray-500">Ativos</div>
          </div>
          <div className="card p-4">
            <div className="text-2xl font-bold text-green-600">
              R$ {totalEarnings.toFixed(0)}
            </div>
            <div className="text-sm text-gray-500">
              {user?.role === 'caregiver' ? 'Recebido' : 'Pago'}
            </div>
          </div>
          <div className="card p-4">
            <div className="text-2xl font-bold text-orange-600">
              R$ {pendingAmount.toFixed(0)}
            </div>
            <div className="text-sm text-gray-500">
              {user?.role === 'caregiver' ? 'A receber' : 'A pagar'}
            </div>
          </div>
        </div>

        {user?.role === 'caregiver' && bookings.length > 0 && (
          <div className="mb-8">
            <BookingCalendar bookings={bookings} />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { key: 'all', label: 'Todos' },
            { key: 'pending', label: 'Pendentes' },
            { key: 'confirmed', label: 'Confirmados' },
            { key: 'in_progress', label: 'Em andamento' },
            { key: 'completed', label: 'Concluídos' },
            { key: 'cancelled', label: 'Cancelados' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                tab === t.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-600">
              Nenhum agendamento
            </h3>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((booking) => {
              const status =
                STATUS_MAP[booking.status] || STATUS_MAP.pending;
              const StatusIcon = status.icon;
              const isCaregiver = user?.role === 'caregiver';
              const payment = payments[booking._id];
              const paymentStatus = payment
                ? PAYMENT_STATUS_MAP[payment.status] ||
                  PAYMENT_STATUS_MAP.pending
                : null;
              const canCheckInNow =
                new Date(booking.startDate).getTime() -
                  CHECK_IN_EARLY_WINDOW_MS <=
                Date.now();
              const checkInWindowLabel = new Date(
                new Date(booking.startDate).getTime() -
                  CHECK_IN_EARLY_WINDOW_MS,
              ).toLocaleString('pt-BR');

              const feedbackCount = feedbackCounts[booking._id] || 0;
              const showReports = shouldShowReports(booking);

              return (
                <div key={booking._id} className="card p-6">
                  <div className="flex flex-col gap-4">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}
                          >
                            <StatusIcon className="w-3.5 h-3.5" />
                            {status.label}
                          </span>

                          {paymentStatus && (
                            <span
                              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${paymentStatus.color}`}
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              {paymentStatus.label}
                            </span>
                          )}

                          <span className="text-xs text-gray-400">
                            {new Date(
                              booking.createdAt,
                            ).toLocaleDateString('pt-BR')}
                          </span>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-3 text-sm">
                          {isCaregiver ? (
                            <div className="flex items-center gap-2 text-gray-600">
                              <User className="w-4 h-4 text-gray-400" />
                              <span>
                                <strong>Cliente:</strong>{' '}
                                {booking.clientName ||
                                  (booking.clientId as any)?.name ||
                                  '—'}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-gray-600">
                              <User className="w-4 h-4 text-gray-400" />
                              <span>
                                <strong>Cuidador:</strong>{' '}
                                {(booking.caregiverId as any)?.userId
                                  ?.name || '—'}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>
                              {new Date(
                                booking.startDate,
                              ).toLocaleDateString('pt-BR')}{' '}
                              -{' '}
                              {new Date(
                                booking.endDate,
                              ).toLocaleDateString('pt-BR')}
                            </span>
                          </div>

                          {booking.address && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span>{booking.address}</span>
                            </div>
                          )}

                          {(booking.clientPhone ||
                            (booking.clientId as any)?.phone) && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span>
                                {booking.clientPhone ||
                                  (booking.clientId as any)?.phone}
                              </span>
                            </div>
                          )}
                        </div>

                        {booking.notes && (
                          <p className="mt-3 text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
                            {booking.notes}
                          </p>
                        )}

                        {booking.checkInAt && (
                          <div className="mt-3 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-lg p-3">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span>
                              Check-in realizado em{' '}
                              {new Date(
                                booking.checkInAt,
                              ).toLocaleString('pt-BR')}
                              {typeof booking.checkInDistanceMeters ===
                              'number'
                                ? ` a ${Math.round(booking.checkInDistanceMeters)}m do local combinado`
                                : ''}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Amount */}
                      {payment && (
                        <div className="text-right flex-shrink-0">
                          <div className="text-2xl font-bold text-gray-900">
                            R${' '}
                            {isCaregiver
                              ? payment.caregiverAmount?.toFixed(2)
                              : payment.amount?.toFixed(2)}
                          </div>
                          {isCaregiver && (
                            <div className="text-xs text-gray-400">
                              Taxa: R${' '}
                              {payment.platformFee?.toFixed(2)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Payment Info & Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100">
                      {/* Payment link for client */}
                      {!isCaregiver &&
                        payment &&
                        booking.status === 'completed' &&
                        payment.status === 'pending' &&
                        payment.paymentUrl &&
                        payment.paymentUrl !== '#' && (
                          <a
                            href={payment.paymentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors flex items-center gap-1.5"
                          >
                            <CreditCard className="w-4 h-4" />
                            Pagar Agora
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}

                      {/* Simulate payment (for testing) */}
                      {!isCaregiver &&
                        payment &&
                        booking.status === 'completed' &&
                        payment.status === 'pending' && (
                          <button
                            onClick={() =>
                              handleSimulatePayment(booking._id)
                            }
                            disabled={actionLoading === booking._id}
                            className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors flex items-center gap-1.5"
                          >
                            {actionLoading === booking._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <BadgeDollarSign className="w-4 h-4" />
                            )}
                            Simular Pagamento
                          </button>
                        )}

                      {/* Escrow indicator */}
                      {payment && payment.status === 'held' && (
                        <div className="flex items-center gap-1.5 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                          <Shield className="w-4 h-4" />
                          Valor retido com segurança na plataforma
                        </div>
                      )}

                      {/* Booking actions */}
                      <div className="flex gap-2 ml-auto flex-wrap">
                        {booking.status === 'pending' && (
                          <>
                            {isCaregiver && (
                              <button
                                onClick={() =>
                                  handleStatusUpdate(
                                    booking._id,
                                    'confirmed',
                                  )
                                }
                                disabled={
                                  actionLoading === booking._id
                                }
                                className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors flex items-center gap-1.5"
                              >
                                {actionLoading === booking._id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                                Aceitar
                              </button>
                            )}
                            <button
                              onClick={() =>
                                handleStatusUpdate(
                                  booking._id,
                                  'cancelled',
                                )
                              }
                              disabled={actionLoading === booking._id}
                              className="bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                            >
                              Cancelar
                            </button>

                            {/* Chat */}
                            <button
                              onClick={() => openChat(booking._id)}
                              disabled={chatLoading === booking._id}
                              className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {chatLoading === booking._id ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Abrindo...
                                </>
                              ) : (
                                <>
                                  <MessageCircle className="w-4 h-4" />
                                  Chat
                                </>
                              )}
                            </button>

                            {/* Relatórios - condicional */}
                            {showReports && (
                              <button
                                onClick={() =>
                                  openReports(booking._id)
                                }
                                className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors flex items-center gap-1.5"
                              >
                                <FileText className="w-4 h-4" />
                                Relatórios
                                {feedbackCount > 0 && (
                                  <span className="ml-1 px-1.5 py-0.5 bg-purple-600 text-white text-xs rounded-full font-bold">
                                    {feedbackCount}
                                  </span>
                                )}
                              </button>
                            )}
                          </>
                        )}

                        {booking.status === 'confirmed' &&
                          isCaregiver && (
                            <>
                              <button
                                onClick={() =>
                                  handleCheckIn(booking._id)
                                }
                                disabled={
                                  actionLoading === booking._id ||
                                  !canCheckInNow
                                }
                                className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {actionLoading === booking._id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <MapPin className="w-4 h-4" />
                                )}
                                Fazer Check-in
                              </button>
                              <span className="text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">
                                {canCheckInNow
                                  ? 'Ao chegar no endereço combinado, use o check-in para iniciar o atendimento'
                                  : `Check-in liberado a partir de ${checkInWindowLabel}`}
                              </span>

                              {/* Chat */}
                              <button
                                onClick={() =>
                                  openChat(booking._id)
                                }
                                disabled={
                                  chatLoading === booking._id
                                }
                                className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors flex items-center gap-1.5"
                              >
                                {chatLoading === booking._id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <MessageCircle className="w-4 h-4" />
                                )}
                                Chat
                              </button>

                              {/* Relatórios - condicional */}
                              {showReports && (
                                <button
                                  onClick={() =>
                                    openReports(booking._id)
                                  }
                                  className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors flex items-center gap-1.5"
                                >
                                  <FileText className="w-4 h-4" />
                                  Relatórios
                                  {feedbackCount > 0 && (
                                    <span className="ml-1 px-1.5 py-0.5 bg-purple-600 text-white text-xs rounded-full font-bold">
                                      {feedbackCount}
                                    </span>
                                  )}
                                </button>
                              )}
                            </>
                          )}

                        {booking.status === 'confirmed' &&
                          !isCaregiver && (
                            <>
                              <button
                                onClick={() =>
                                  handleStatusUpdate(
                                    booking._id,
                                    'cancelled',
                                  )
                                }
                                disabled={
                                  actionLoading === booking._id
                                }
                                className="bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                              >
                                Cancelar
                              </button>
                              <span className="text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                                O cuidador fará o check-in quando
                                chegar ao local do atendimento
                              </span>

                              {/* Chat */}
                              <button
                                onClick={() =>
                                  openChat(booking._id)
                                }
                                disabled={
                                  chatLoading === booking._id
                                }
                                className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors flex items-center gap-1.5"
                              >
                                {chatLoading === booking._id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <MessageCircle className="w-4 h-4" />
                                )}
                                Chat
                              </button>

                              {/* Relatórios - condicional */}
                              {showReports && (
                                <button
                                  onClick={() =>
                                    openReports(booking._id)
                                  }
                                  className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors flex items-center gap-1.5"
                                >
                                  <FileText className="w-4 h-4" />
                                  Relatórios
                                  {feedbackCount > 0 && (
                                    <span className="ml-1 px-1.5 py-0.5 bg-purple-600 text-white text-xs rounded-full font-bold">
                                      {feedbackCount}
                                    </span>
                                  )}
                                </button>
                              )}
                            </>
                          )}

                        {booking.status === 'in_progress' &&
                          isCaregiver && (
                            <>
                              <button
                                onClick={() =>
                                  handleStatusUpdate(
                                    booking._id,
                                    'completed',
                                  )
                                }
                                disabled={
                                  actionLoading === booking._id
                                }
                                className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-1.5"
                              >
                                {actionLoading === booking._id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <ArrowRight className="w-4 h-4" />
                                )}
                                Concluir Serviço
                              </button>
                              <span className="text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                                O pagamento será solicitado ao
                                cliente após a conclusão
                              </span>

                              {/* Chat */}
                              <button
                                onClick={() =>
                                  openChat(booking._id)
                                }
                                disabled={
                                  chatLoading === booking._id
                                }
                                className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors flex items-center gap-1.5"
                              >
                                {chatLoading === booking._id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <MessageCircle className="w-4 h-4" />
                                )}
                                Chat
                              </button>

                              {/* Relatórios - condicional */}
                              {showReports && (
                                <button
                                  onClick={() =>
                                    openReports(booking._id)
                                  }
                                  className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors flex items-center gap-1.5"
                                >
                                  <FileText className="w-4 h-4" />
                                  Relatórios
                                  {feedbackCount > 0 && (
                                    <span className="ml-1 px-1.5 py-0.5 bg-purple-600 text-white text-xs rounded-full font-bold">
                                      {feedbackCount}
                                    </span>
                                  )}
                                </button>
                              )}
                            </>
                          )}

                        {booking.status === 'in_progress' &&
                          !isCaregiver && (
                            <>
                              <span className="text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">
                                O cuidador já realizou o check-in e
                                o atendimento está em andamento
                              </span>

                              {/* Chat */}
                              <button
                                onClick={() =>
                                  openChat(booking._id)
                                }
                                disabled={
                                  chatLoading === booking._id
                                }
                                className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors flex items-center gap-1.5"
                              >
                                {chatLoading === booking._id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <MessageCircle className="w-4 h-4" />
                                )}
                                Chat
                              </button>

                              {/* Relatórios - condicional */}
                              {showReports && (
                                <button
                                  onClick={() =>
                                    openReports(booking._id)
                                  }
                                  className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors flex items-center gap-1.5"
                                >
                                  <FileText className="w-4 h-4" />
                                  Relatórios
                                  {feedbackCount > 0 && (
                                    <span className="ml-1 px-1.5 py-0.5 bg-purple-600 text-white text-xs rounded-full font-bold">
                                      {feedbackCount}
                                    </span>
                                  )}
                                </button>
                              )}
                            </>
                          )}

                        {booking.status === 'completed' && (
                          <>
                            {isCaregiver && (
                              <>
                                {payment?.status === 'pending' && (
                                  <span className="text-sm text-yellow-600 bg-yellow-50 px-3 py-2 rounded-lg">
                                    Aguardando pagamento do cliente
                                  </span>
                                )}
                                {payment?.status === 'released' && (
                                  <span className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                                    Pagamento recebido com sucesso
                                  </span>
                                )}
                              </>
                            )}

                            {!isCaregiver &&
                              payment?.status === 'pending' && (
                                <span className="text-sm text-yellow-700 bg-yellow-50 px-3 py-2 rounded-lg">
                                  Serviço concluído. Falta apenas
                                  realizar o pagamento.
                                </span>
                              )}

                            {/* Chat */}
                            <button
                              onClick={() =>
                                openChat(booking._id)
                              }
                              disabled={
                                chatLoading === booking._id
                              }
                              className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors flex items-center gap-1.5"
                            >
                              {chatLoading === booking._id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <MessageCircle className="w-4 h-4" />
                              )}
                              Chat
                            </button>

                            {/* Relatórios - condicional (sempre true para completed) */}
                            {showReports && (
                              <button
                                onClick={() =>
                                  openReports(booking._id)
                                }
                                className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors flex items-center gap-1.5"
                              >
                                <FileText className="w-4 h-4" />
                                Relatórios
                                {feedbackCount > 0 && (
                                  <span className="ml-1 px-1.5 py-0.5 bg-purple-600 text-white text-xs rounded-full font-bold">
                                    {feedbackCount}
                                  </span>
                                )}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}