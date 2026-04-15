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
  FileText,
  TrendingUp,
  AlertCircle,
  Banknote,
  Activity,
  Star,
  Filter,
} from 'lucide-react';
import { BookingCalendar } from '@/components/BookingCalendar';

const CHECK_IN_EARLY_WINDOW_MS = 2 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending: {
    label: 'Pendente',
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
    icon: Clock,
  },
  confirmed: {
    label: 'Confirmado',
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200',
    icon: CheckCircle,
  },
  in_progress: {
    label: 'Em andamento',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50 border-emerald-200',
    icon: Activity,
  },
  completed: {
    label: 'Concluído',
    color: 'text-green-700',
    bg: 'bg-green-50 border-green-200',
    icon: CheckCircle,
  },
  cancelled: {
    label: 'Cancelado',
    color: 'text-red-700',
    bg: 'bg-red-50 border-red-200',
    icon: XCircle,
  },
};

const PAYMENT_STATUS_MAP: Record<string, { label: string; color: string; dot: string }> = {
  pending: { label: 'Aguardando Pagamento', color: 'text-amber-700', dot: 'bg-amber-400' },
  paid: { label: 'Pago', color: 'text-green-700', dot: 'bg-green-400' },
  held: { label: 'Retido na Plataforma', color: 'text-blue-700', dot: 'bg-blue-400' },
  released: { label: 'Liberado ao Cuidador', color: 'text-green-700', dot: 'bg-green-400' },
  refunded: { label: 'Reembolsado', color: 'text-orange-700', dot: 'bg-orange-400' },
  cancelled: { label: 'Cancelado', color: 'text-red-700', dot: 'bg-red-400' },
  failed: { label: 'Falhou', color: 'text-red-700', dot: 'bg-red-400' },
};

function shouldShowReports(booking: Booking): boolean {
  const durationMs =
    new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime();
  const isShortService = durationMs <= TWENTY_FOUR_HOURS_MS;
  if (isShortService) return booking.status === 'completed';
  return ['in_progress', 'completed'].includes(booking.status);
}

const TABS = [
  { key: 'all', label: 'Todos' },
  { key: 'pending', label: 'Pendentes' },
  { key: 'confirmed', label: 'Confirmados' },
  { key: 'in_progress', label: 'Em andamento' },
  { key: 'completed', label: 'Concluídos' },
  { key: 'cancelled', label: 'Cancelados' },
];

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
    if (!authLoading && !isAuthenticated) router.push('/login');
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) fetchData();
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
            if (payment) paymentMap[booking._id] = payment;
          } catch {}

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
      throw new Error('A localização só funciona em páginas seguras (HTTPS).');
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
      return await getPosition({ enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
    } catch (error: any) {
      if (error?.code === 1) throw new Error('Permita o acesso à localização para o check-in.');
      try {
        return await getPosition({ enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 });
      } catch (fallbackError: any) {
        if (fallbackError?.code === 1)
          throw new Error('Permita o acesso à localização para o check-in.');
        if (fallbackError?.code === 2)
          throw new Error('Não foi possível identificar sua localização. Ative o GPS.');
        if (fallbackError?.code === 3)
          throw new Error('Tempo esgotado. Tente em um local com melhor sinal.');
        throw new Error('Não foi possível obter sua localização.');
      }
    }
  };

  const handleCheckIn = async (bookingId: string) => {
    setActionLoading(bookingId);
    try {
      const position = await requestCurrentLocation();
      await api.checkInBooking(bookingId, position.coords.latitude, position.coords.longitude);
      await fetchData();
      alert('Check-in realizado com sucesso!');
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
    if (chatLoading === bookingId) return;
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
        <p className="text-gray-500 text-sm">Carregando seu dashboard...</p>
      </div>
    );
  }

  const filtered = tab === 'all' ? bookings : bookings.filter((b) => b.status === tab);
  const isCaregiver = user?.role === 'caregiver';

  const totalEarnings = Object.values(payments)
    .filter((p: any) => p.status === 'released')
    .reduce((sum: number, p: any) => sum + (isCaregiver ? (p.caregiverAmount ?? p.amount ?? 0) : (p.amount ?? 0)), 0);

  const pendingAmount = Object.values(payments)
    .filter((p: any) => ['pending', 'held', 'paid'].includes(p.status))
    .reduce((sum: number, p: any) => sum + (isCaregiver ? (p.caregiverAmount ?? p.amount ?? 0) : (p.amount ?? 0)), 0);

  const activeCount = bookings.filter((b) =>
    ['confirmed', 'in_progress'].includes(b.status),
  ).length;
  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const completedCount = bookings.filter((b) => b.status === 'completed').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary-600 mb-1">
              Bem-vindo de volta
            </p>
            <h1 className="text-2xl font-bold text-gray-900">
              {user?.name?.split(' ')[0] || 'Usuário'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {isCaregiver
                ? 'Gerencie seus atendimentos e pagamentos'
                : 'Acompanhe seus agendamentos e pagamentos'}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 self-start sm:self-auto">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-medium text-gray-700">
              {isCaregiver ? 'Cuidador' : 'Cliente'}
            </span>
          </div>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total de agendamentos"
            value={bookings.length}
            icon={Calendar}
            iconColor="text-gray-600"
            iconBg="bg-gray-100"
          />
          <StatCard
            label="Pendentes"
            value={pendingCount}
            icon={Clock}
            iconColor="text-amber-600"
            iconBg="bg-amber-100"
            highlight={pendingCount > 0}
          />
          <StatCard
            label="Ativos"
            value={activeCount}
            icon={Activity}
            iconColor="text-blue-600"
            iconBg="bg-blue-100"
          />
          <StatCard
            label="Concluídos"
            value={completedCount}
            icon={CheckCircle}
            iconColor="text-green-600"
            iconBg="bg-green-100"
          />
        </div>

        {/* ── Financial Summary ── */}
        {isCaregiver && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-6 text-white shadow-md">
              <div className="flex items-center gap-2 mb-4 opacity-80">
                <Banknote className="w-4 h-4" />
                <span className="text-sm font-medium">Total Recebido</span>
              </div>
              <div className="text-3xl font-bold tracking-tight">
                R$ {totalEarnings.toFixed(2)}
              </div>
              <p className="text-sm opacity-70 mt-1">Pagamentos liberados</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-amber-600">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">A Receber</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 tracking-tight">
                R$ {pendingAmount.toFixed(2)}
              </div>
              <p className="text-sm text-gray-400 mt-1">Em processamento</p>
            </div>
          </div>
        )}

        {/* ── Calendar (caregiver only) ── */}
        {isCaregiver && bookings.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Calendário de Atendimentos
            </h2>
            <BookingCalendar bookings={bookings} />
          </div>
        )}

        {/* ── Bookings ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">
              Agendamentos
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Filter className="w-3.5 h-3.5" />
              Filtrar por status
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
            {TABS.map((t) => {
              const count =
                t.key === 'all'
                  ? bookings.length
                  : bookings.filter((b) => b.status === t.key).length;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                    tab === t.key
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {t.label}
                  {count > 0 && (
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                        tab === t.key
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* List */}
          {filtered.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="font-semibold text-gray-600 mb-1">
                Nenhum agendamento encontrado
              </h3>
              <p className="text-sm text-gray-400">
                {tab === 'all'
                  ? 'Você ainda não possui agendamentos.'
                  : 'Nenhum agendamento com este status.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((booking) => (
                <BookingCard
                  key={booking._id}
                  booking={booking}
                  payment={payments[booking._id]}
                  feedbackCount={feedbackCounts[booking._id] || 0}
                  isCaregiver={isCaregiver}
                  actionLoading={actionLoading}
                  chatLoading={chatLoading}
                  onStatusUpdate={handleStatusUpdate}
                  onCheckIn={handleCheckIn}
                  onSimulatePayment={handleSimulatePayment}
                  onOpenChat={openChat}
                  onOpenReports={openReports}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   StatCard
───────────────────────────────────────────── */
function StatCard({
  label,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  highlight,
}: {
  label: string;
  value: number;
  icon: any;
  iconColor: string;
  iconBg: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`bg-white border rounded-2xl p-5 shadow-sm transition-all ${
        highlight ? 'border-amber-300 ring-1 ring-amber-200' : 'border-gray-200'
      }`}
    >
      <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center mb-3`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5 leading-snug">{label}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   BookingCard
───────────────────────────────────────────── */
function BookingCard({
  booking,
  payment,
  feedbackCount,
  isCaregiver,
  actionLoading,
  chatLoading,
  onStatusUpdate,
  onCheckIn,
  onSimulatePayment,
  onOpenChat,
  onOpenReports,
}: {
  booking: Booking;
  payment: any;
  feedbackCount: number;
  isCaregiver: boolean;
  actionLoading: string | null;
  chatLoading: string | null;
  onStatusUpdate: (id: string, status: string) => void;
  onCheckIn: (id: string) => void;
  onSimulatePayment: (id: string) => void;
  onOpenChat: (id: string) => void;
  onOpenReports: (id: string) => void;
}) {
  const status = STATUS_MAP[booking.status] || STATUS_MAP.pending;
  const StatusIcon = status.icon;
  const paymentStatusInfo = payment ? PAYMENT_STATUS_MAP[payment.status] : null;
  const showReports = shouldShowReports(booking);
  const isLoading = actionLoading === booking._id;
  const isChatLoading = chatLoading === booking._id;

  const canCheckInNow =
    new Date(booking.startDate).getTime() - CHECK_IN_EARLY_WINDOW_MS <= Date.now();
  const checkInWindowLabel = new Date(
    new Date(booking.startDate).getTime() - CHECK_IN_EARLY_WINDOW_MS,
  ).toLocaleString('pt-BR');

  const otherPersonName = isCaregiver
    ? booking.clientName || (booking.clientId as any)?.name || '—'
    : (booking.caregiverId as any)?.userId?.name || '—';

  const otherPersonLabel = isCaregiver ? 'Cliente' : 'Cuidador';

  // Resolve the amount to display — use fallbacks so it works for both roles
  const resolveAmount = (): number | null => {
    if (!payment) return null;
    if (isCaregiver) {
      return payment.caregiverAmount ?? payment.amount ?? null;
    }
    return payment.amount ?? payment.totalAmount ?? null;
  };

  const cardAmount = resolveAmount();

  const isAmountReleased = payment?.status === 'released';
  const isAmountPaid = payment && ['paid', 'held', 'released'].includes(payment.status);
  const isAmountPending = payment && ['pending'].includes(payment.status);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Status bar */}
      <div className={`h-1 w-full ${getStatusBarColor(booking.status)}`} />

      <div className="p-5">
        {/* ── Top: info + payment block ── */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-4">

          {/* Left: status badges + details */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${status.bg} ${status.color}`}
              >
                <StatusIcon className="w-3.5 h-3.5" />
                {status.label}
              </span>

              {paymentStatusInfo && (
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-transparent bg-gray-50 ${paymentStatusInfo.color}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${paymentStatusInfo.dot}`} />
                  {paymentStatusInfo.label}
                </span>
              )}

              <span className="text-xs text-gray-400 ml-auto">
                #{booking._id.slice(-6).toUpperCase()}
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-2">
              <InfoRow icon={User} label={otherPersonLabel} value={otherPersonName} />
              <InfoRow
                icon={Calendar}
                label="Período"
                value={`${new Date(booking.startDate).toLocaleDateString('pt-BR')} → ${new Date(booking.endDate).toLocaleDateString('pt-BR')}`}
              />
              {booking.address && (
                <InfoRow icon={MapPin} label="Local" value={booking.address} />
              )}
              {(booking.clientPhone || (booking.clientId as any)?.phone) && (
                <InfoRow
                  icon={Phone}
                  label="Telefone"
                  value={booking.clientPhone || (booking.clientId as any)?.phone}
                />
              )}
            </div>

            {booking.notes && (
              <div className="mt-3 flex gap-2 bg-gray-50 border border-gray-100 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-500 leading-relaxed">{booking.notes}</p>
              </div>
            )}

            {booking.checkInAt && (
              <div className="mt-3 flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span>
                  Check-in: {new Date(booking.checkInAt).toLocaleString('pt-BR')}
                  {typeof booking.checkInDistanceMeters === 'number' &&
                    ` · ${Math.round(booking.checkInDistanceMeters)}m do local`}
                </span>
              </div>
            )}
          </div>

          {/* Right: payment block — shown for BOTH roles */}
          {payment && cardAmount != null && (
            <div
              className={`flex-shrink-0 rounded-2xl px-5 py-4 text-right border ${
                isAmountReleased
                  ? 'bg-green-50 border-green-200'
                  : isAmountPaid
                  ? 'bg-blue-50 border-blue-200'
                  : isAmountPending
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <p
                className={`text-xs font-medium mb-1 ${
                  isAmountReleased
                    ? 'text-green-600'
                    : isAmountPaid
                    ? 'text-blue-600'
                    : isAmountPending
                    ? 'text-amber-600'
                    : 'text-gray-400'
                }`}
              >
                {isCaregiver
                  ? isAmountReleased
                    ? 'Valor recebido'
                    : 'Valor a receber'
                  : isAmountPaid
                  ? 'Total pago'
                  : 'Total a pagar'}
              </p>
              <p
                className={`text-2xl font-bold tracking-tight ${
                  isAmountReleased
                    ? 'text-green-700'
                    : isAmountPaid
                    ? 'text-blue-700'
                    : isAmountPending
                    ? 'text-amber-700'
                    : 'text-gray-700'
                }`}
              >
                R$ {cardAmount.toFixed(2)}
              </p>
              {isCaregiver && payment.platformFee != null && (
                <p className="text-xs text-gray-400 mt-1">
                  Taxa plataforma: R$ {payment.platformFee.toFixed(2)}
                </p>
              )}
            </div>
          )}

          {/* Fallback: show booking totalPrice when no payment record exists yet */}
          {!payment && booking.totalAmount != null && (
            <div className="flex-shrink-0 rounded-2xl px-5 py-4 text-right border bg-gray-50 border-gray-200">
              <p className="text-xs font-medium mb-1 text-gray-400">
                {isCaregiver ? 'Valor estimado' : 'Valor estimado'}
              </p>
              <p className="text-2xl font-bold tracking-tight text-gray-700">
                R$ {Number(booking.totalAmount).toFixed(2)}
              </p>
              <p className="text-xs text-gray-400 mt-1">Pagamento ainda não gerado</p>
            </div>
          )}
        </div>

        {/* ── Actions ── */}
        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-100">

          {payment?.status === 'held' && (
            <div className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border bg-blue-50 text-blue-700 border-blue-100">
              <Shield className="w-3.5 h-3.5 flex-shrink-0" />
              Valor protegido pela plataforma
            </div>
          )}

          {/* Pending */}
          {booking.status === 'pending' && isCaregiver && (
            <ActionButton
              onClick={() => onStatusUpdate(booking._id, 'confirmed')}
              loading={isLoading}
              variant="success"
              icon={CheckCircle}
              label="Aceitar"
            />
          )}
          {booking.status === 'pending' && (
            <ActionButton
              onClick={() => onStatusUpdate(booking._id, 'cancelled')}
              loading={isLoading}
              variant="danger"
              icon={XCircle}
              label="Cancelar"
            />
          )}

          {/* Confirmed caregiver: check-in */}
          {booking.status === 'confirmed' && isCaregiver && (
            <>
              <ActionButton
                onClick={() => onCheckIn(booking._id)}
                loading={isLoading}
                disabled={!canCheckInNow}
                variant="primary"
                icon={MapPin}
                label="Fazer Check-in"
              />
              {!canCheckInNow && (
                <span className="text-xs text-gray-500 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg">
                  Liberado a partir de {checkInWindowLabel}
                </span>
              )}
            </>
          )}

          {/* Confirmed client */}
          {booking.status === 'confirmed' && !isCaregiver && (
            <>
              <ActionButton
                onClick={() => onStatusUpdate(booking._id, 'cancelled')}
                loading={isLoading}
                variant="danger"
                icon={XCircle}
                label="Cancelar"
              />
              <InfoBadge
                icon={AlertCircle}
                text="Aguardando check-in do cuidador"
                color="blue"
              />
            </>
          )}

          {/* In progress caregiver */}
          {booking.status === 'in_progress' && isCaregiver && (
            <>
              <ActionButton
                onClick={() => onStatusUpdate(booking._id, 'completed')}
                loading={isLoading}
                variant="primary"
                icon={ArrowRight}
                label="Concluir Serviço"
              />
              <InfoBadge
                icon={DollarSign}
                text="Pagamento solicitado após conclusão"
                color="blue"
              />
            </>
          )}

          {/* In progress client */}
          {booking.status === 'in_progress' && !isCaregiver && (
            <InfoBadge icon={Activity} text="Atendimento em andamento" color="emerald" />
          )}

          {/* Completed — caregiver */}
          {booking.status === 'completed' && isCaregiver && (
            <>
              {payment?.status === 'pending' && (
                <InfoBadge icon={Clock} text="Aguardando pagamento do cliente" color="amber" />
              )}
              {payment?.status === 'paid' && (
                <InfoBadge icon={Shield} text="Pagamento recebido – em processamento" color="blue" />
              )}
              {payment?.status === 'held' && (
                <InfoBadge icon={Shield} text="Valor retido – será liberado em breve" color="blue" />
              )}
              {payment?.status === 'released' && (
                <InfoBadge icon={CheckCircle} text="Pagamento recebido!" color="green" />
              )}
              {payment?.status === 'refunded' && (
                <InfoBadge icon={AlertCircle} text="Pagamento reembolsado ao cliente" color="amber" />
              )}
              {!payment && (
                <InfoBadge icon={Clock} text="Pagamento será gerado em breve" color="amber" />
              )}
            </>
          )}

          {/* Completed — client */}
          {booking.status === 'completed' && !isCaregiver && (
            <>
              {payment?.status === 'pending' && (
                <>
                  {payment?.paymentUrl && payment.paymentUrl !== '#' && (
                    <a
                      href={payment.paymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors"
                    >
                      <CreditCard className="w-4 h-4" />
                      Pagar Agora
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <ActionButton
                    onClick={() => onSimulatePayment(booking._id)}
                    loading={isLoading}
                    variant="purple"
                    icon={BadgeDollarSign}
                    label="Simular Pagamento"
                  />
                  <InfoBadge icon={AlertCircle} text="Pagamento pendente" color="amber" />
                </>
              )}
              {payment?.status === 'paid' && (
                <InfoBadge icon={CheckCircle} text="Pagamento realizado com sucesso" color="green" />
              )}
              {payment?.status === 'held' && (
                <InfoBadge icon={Shield} text="Pagamento realizado – valor protegido" color="blue" />
              )}
              {payment?.status === 'released' && (
                <InfoBadge icon={CheckCircle} text="Pagamento concluído – liberado ao cuidador" color="green" />
              )}
              {payment?.status === 'refunded' && (
                <InfoBadge icon={DollarSign} text="Valor reembolsado" color="amber" />
              )}
              {!payment && (
                <InfoBadge icon={Star} text="Serviço concluído com sucesso" color="green" />
              )}
            </>
          )}

          {/* Chat + Reports — always right */}
          <div className="ml-auto flex items-center gap-2 flex-wrap">
            {booking.status !== 'cancelled' && (
              <button
                onClick={() => onOpenChat(booking._id)}
                disabled={isChatLoading}
                className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 border border-gray-200 px-3 py-1.5 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {isChatLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MessageCircle className="w-4 h-4" />
                )}
                Chat
              </button>
            )}

            {showReports && (
              <button
                onClick={() => onOpenReports(booking._id)}
                className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-xl text-sm font-medium hover:bg-purple-100 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Relatórios
                {feedbackCount > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.5 bg-purple-600 text-white text-xs rounded-full font-bold leading-none">
                    {feedbackCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */
function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 text-sm text-gray-600 min-w-0">
      <Icon className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
      <span className="truncate">
        <span className="text-gray-400 mr-1">{label}:</span>
        <span className="font-medium text-gray-700">{value}</span>
      </span>
    </div>
  );
}

function InfoBadge({
  icon: Icon,
  text,
  color,
}: {
  icon: any;
  text: string;
  color: 'blue' | 'emerald' | 'amber' | 'green' | 'red';
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    red: 'bg-red-50 text-red-700 border-red-100',
  };
  return (
    <div
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border ${colors[color]}`}
    >
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      {text}
    </div>
  );
}

type ButtonVariant = 'success' | 'danger' | 'primary' | 'purple' | 'ghost';

function ActionButton({
  onClick,
  loading,
  disabled,
  variant,
  icon: Icon,
  label,
}: {
  onClick: () => void;
  loading: boolean;
  disabled?: boolean;
  variant: ButtonVariant;
  icon: any;
  label: string;
}) {
  const variants: Record<ButtonVariant, string> = {
    success: 'bg-green-500 text-white hover:bg-green-600 disabled:opacity-50',
    danger: 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100',
    primary: 'bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100',
    ghost: 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200',
  };

  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:cursor-not-allowed ${variants[variant]}`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
      {label}
    </button>
  );
}

function getStatusBarColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-amber-400',
    confirmed: 'bg-blue-400',
    in_progress: 'bg-emerald-400',
    completed: 'bg-green-400',
    cancelled: 'bg-red-300',
  };
  return colors[status] || 'bg-gray-200';
}