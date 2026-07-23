// filepath: app/agenda/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { Booking } from '@/types';
import {
  Calendar, Clock, CheckCircle, XCircle, Loader2, User,
  MapPin, Phone, AlertCircle, Banknote, Activity, LayoutDashboard,
  FileText,
  MessageCircle,
  TrendingUp
} from 'lucide-react';
import { BookingCalendar } from '@/components/BookingCalendar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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

export default function AgendaPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
  }, [authLoading, isAuthenticated]);

  // Queries
  const { data: bookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const data = await api.getMyBookings();
      return Array.isArray(data) ? data : [];
    },
    enabled: isAuthenticated,
  });

  const { data: dashboardExtras = { payments: {}, feedbackCounts: {} }, isLoading: loadingExtras } = useQuery({
    queryKey: ['agenda-extras', bookings.map(b => b._id)],
    queryFn: async () => {
      const paymentMap: Record<string, any> = {};
      const feedbackMap: Record<string, number> = {};

      await Promise.all(
        bookings.map(async (booking: any) => {
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
      return { payments: paymentMap, feedbackCounts: feedbackMap };
    },
    enabled: bookings.length > 0,
  });

  const { payments, feedbackCounts } = dashboardExtras;

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.updateBookingStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Status atualizado com sucesso!');
    },
    onError: (error: any) => toast.error(error.message || 'Erro ao atualizar status'),
  });

  const checkInMutation = useMutation({
    mutationFn: async (id: string) => {
      const position = await requestCurrentLocation();
      return api.checkInBooking(id, position.coords.latitude, position.coords.longitude);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Check-in realizado com sucesso!');
    },
    onError: (error: any) => toast.error(error.message || 'Erro ao realizar check-in'),
  });

  const simulatePaymentMutation = useMutation({
    mutationFn: (id: string) => api.simulatePayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['agenda-extras'] });
      toast.success('Pagamento simulado com sucesso!');
    },
    onError: (error: any) => toast.error(error.message || 'Erro ao simular pagamento'),
  });

  const openChatMutation = useMutation({
    mutationFn: (bookingId: string) => api.getOrCreateConversation(bookingId),
    onSuccess: (conversation) => {
      router.push(`/chat?conversation=${conversation._id}`);
    },
    onError: (error: any) => toast.error(error.message || 'Erro ao abrir conversa'),
  });

  const requestCurrentLocation = async () => {
    const isLocalEnvironment = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
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
      if (error?.code === 1) {
        throw new Error(
          'A localização foi bloqueada para este site. Permita a localização nas configurações do navegador e tente novamente.',
        );
      }

      try {
        return await getPosition({ enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 });
      } catch (fallbackError: any) {
        if (fallbackError?.code === 1) {
          throw new Error(
            'A localização foi bloqueada para este site. Permita a localização nas configurações do navegador e tente novamente.',
          );
        }
        throw new Error('Não foi possível obter sua localização. Verifique o GPS e tente novamente.');
      }
    }
  };

  const openReports = (bookingId: string) => {
    router.push(`/agenda/care-reports?booking=${bookingId}`);
  };

  if (authLoading || (loadingBookings && bookings.length === 0)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
        <div className="text-center">
          <p className="text-gray-900 font-semibold">Carregando sua Agenda</p>
          <p className="text-gray-500 text-sm">Preparando seus agendamentos...</p>
        </div>
      </div>
    );
  }

  const filtered = activeTab === 'all' ? bookings : bookings.filter((b) => b.status === activeTab);
  const isCaregiver = user?.role === 'caregiver';

  const totalEarnings = Object.values(payments)
    .filter((p: any) => p.status === 'released')
    .reduce((sum: number, p: any) => sum + (isCaregiver ? (p.caregiverAmount ?? p.amount ?? 0) : (p.amount ?? 0)), 0);

  const pendingAmount = Object.values(payments)
    .filter((p: any) => ['pending', 'held', 'paid'].includes(p.status))
    .reduce((sum: number, p: any) => sum + (isCaregiver ? (p.caregiverAmount ?? p.amount ?? 0) : (p.amount ?? 0)), 0);

  const activeCount = bookings.filter((b) => ['confirmed', 'in_progress'].includes(b.status)).length;
  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const completedCount = bookings.filter((b) => b.status === 'completed').length;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Badge variant="secondary" className="mb-2 bg-primary-50 text-primary-700 hover:bg-primary-50 border-primary-100">
              Painel de Controle
            </Badge>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Olá, {user?.name?.split(' ')[0] || 'Usuário'}
            </h1>
            <p className="text-gray-500 mt-1">
              {isCaregiver
                ? 'Gerencie seus atendimentos e acompanhe seus rendimentos.'
                : 'Acompanhe seus agendamentos e cuide de quem você ama.'}
            </p>
          </div>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total de agendamentos"
            value={bookings.length}
            icon={Calendar}
            loading={loadingBookings}
          />
          <StatCard
            label="Pendentes"
            value={pendingCount}
            icon={Clock}
            loading={loadingBookings}
            variant="warning"
          />
          <StatCard
            label="Ativos"
            value={activeCount}
            icon={Activity}
            loading={loadingBookings}
            variant="info"
          />
          <StatCard
            label="Concluídos"
            value={completedCount}
            icon={CheckCircle}
            loading={loadingBookings}
            variant="success"
          />
        </div>

        {/* ── Financial Summary ── */}
        {isCaregiver && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="bg-primary-600 text-white border-none shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4 opacity-80">
                  <Banknote className="w-5 h-5" />
                  <span className="text-sm font-bold uppercase tracking-wider">Total Recebido</span>
                </div>
                <div className="text-4xl font-black tracking-tight">
                  R$ {totalEarnings.toFixed(2)}
                </div>
                <CardDescription className="text-primary-100 mt-2 font-medium">
                  Pagamentos liberados na sua conta
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4 text-amber-600">
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-sm font-bold uppercase tracking-wider">A Receber</span>
                </div>
                <div className="text-4xl font-black text-gray-900 tracking-tight">
                  R$ {pendingAmount.toFixed(2)}
                </div>
                <CardDescription className="text-gray-500 mt-2 font-medium">
                  Valores em processamento ou retidos
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Calendar (caregiver only) ── */}
        {isCaregiver && bookings.length > 0 && (
          <Card className="border-gray-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100">
              <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary-600" />
                Calendário de Atendimentos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <BookingCalendar bookings={bookings} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Booking List ── */}
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="w-full space-y-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-col">
            <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <h2 className="flex items-center gap-3 text-2xl font-black text-gray-900">
                <LayoutDashboard className="w-6 h-6 text-primary-600" />
                Sua Agenda
              </h2>
              <TabsList className="grid !h-auto w-full grid-cols-2 gap-1.5 rounded-2xl border border-gray-200 bg-white p-1.5 shadow-sm sm:grid-cols-3 xl:inline-flex xl:w-fit xl:flex-nowrap">
                {TABS.map((t) => (
                  <TabsTrigger 
                    key={t.key} 
                    value={t.key} 
                    className="h-auto min-h-10 w-full whitespace-normal rounded-xl px-3 py-2 text-center text-[11px] font-bold uppercase leading-tight tracking-wide transition-all data-[active]:bg-primary-600 data-[active]:text-white sm:text-xs sm:tracking-widest xl:w-auto xl:flex-none xl:whitespace-nowrap xl:px-6 xl:py-2.5"
                  >
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="mt-0 w-full min-w-0 outline-none">
              {loadingBookings ? (
                <div className="space-y-6">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-64 w-full rounded-3xl" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="w-full">
                  <Card className="border-dashed border-2 border-gray-200 bg-gray-50/50 rounded-[32px]">
                    <CardContent className="flex flex-col items-center justify-center py-32 text-center">
                      <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-6 border border-gray-100 text-gray-300">
                        <Calendar className="w-12 h-12" />
                      </div>
                      <CardTitle className="text-gray-900 text-2xl font-black tracking-tight">Nenhum agendamento encontrado</CardTitle>
                      <CardDescription className="max-w-md mt-4 text-gray-500 text-lg">
                        {activeTab === 'all'
                          ? 'Você ainda não possui nenhum agendamento registrado no sistema.'
                          : `Não encontramos nenhum agendamento com o status "${TABS.find(t => t.key === activeTab)?.label}" no momento.`}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="flex w-full min-w-0 flex-col gap-8">
                  {filtered.map((booking) => (
                    <div key={booking._id} className="w-full min-w-0">
                      <BookingCard
                        booking={booking}
                        payment={payments[booking._id]}
                        feedbackCount={feedbackCounts[booking._id] || 0}
                        isCaregiver={isCaregiver}
                        actionLoading={updateStatusMutation.isPending || checkInMutation.isPending}
                        onStatusUpdate={(id, status) => updateStatusMutation.mutate({ id, status })}
                        onCheckIn={(id) => checkInMutation.mutate(id)}
                        onOpenPayment={(id) => router.push(`/pagamento/checkout?booking=${id}`)}
                        onOpenChat={(id) => openChatMutation.mutate(id)}
                        onOpenReports={openReports}
                      />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
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
  variant = 'default',
  loading,
}: {
  label: string;
  value: number;
  icon: any;
  variant?: 'default' | 'success' | 'warning' | 'info';
  loading?: boolean;
}) {
  const variants = {
    default: 'bg-gray-100 text-gray-600',
    success: 'bg-green-100 text-green-600',
    warning: 'bg-amber-100 text-amber-600',
    info: 'bg-blue-100 text-blue-600',
  };

  if (loading) {
    return (
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-5 space-y-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-4 w-24" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200 shadow-sm transition-all hover:border-gray-300">
      <CardContent className="p-5">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", variants[variant])}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="text-2xl font-bold text-gray-900 tracking-tight">{value}</div>
        <div className="text-xs font-medium text-gray-500 mt-1 leading-snug uppercase tracking-wider">{label}</div>
      </CardContent>
    </Card>
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
  onStatusUpdate,
  onCheckIn,
  onOpenPayment,
  onOpenChat,
  onOpenReports,
}: {
  booking: Booking;
  payment: any;
  feedbackCount: number;
  isCaregiver: boolean;
  actionLoading: boolean;
  onStatusUpdate: (id: string, status: string) => void;
  onCheckIn: (id: string) => void;
  onOpenPayment: (id: string) => void;
  onOpenChat: (id: string) => void;
  onOpenReports: (id: string) => void;
}) {
  const statusInfo = STATUS_MAP[booking.status] || STATUS_MAP.pending;
  const StatusIcon = statusInfo.icon;
  const paymentStatusInfo = payment ? PAYMENT_STATUS_MAP[payment.status] : null;
  const showReports = shouldShowReports(booking);

  const canCheckInNow =
    new Date(booking.startDate).getTime() - CHECK_IN_EARLY_WINDOW_MS <= Date.now();
  const checkInWindowLabel = new Date(
    new Date(booking.startDate).getTime() - CHECK_IN_EARLY_WINDOW_MS,
  ).toLocaleString('pt-BR');

  const otherPersonName = isCaregiver
    ? booking.clientName || (booking.clientId as any)?.name || '—'
    : (booking.caregiverId as any)?.userId?.name || '—';

  const otherPersonLabel = isCaregiver ? 'Cliente' : 'Cuidador';

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
    <Card className="w-full min-w-0 overflow-hidden border-gray-200 hover:shadow-lg transition-all duration-300">
      <div className={cn("h-1.5 w-full", getStatusBarColor(booking.status))} />

      <CardContent className="p-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-12">
          <div className="min-w-0 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className={cn("px-3 py-1 text-xs font-bold uppercase tracking-wider gap-1.5", statusInfo.bg, statusInfo.color)}>
                <StatusIcon className="w-3.5 h-3.5" />
                {statusInfo.label}
              </Badge>

              {paymentStatusInfo && (
                <Badge variant="secondary" className={cn("px-3 py-1 text-xs font-bold uppercase tracking-wider gap-1.5", paymentStatusInfo.color, "bg-gray-100")}>
                  <span className={cn("w-2 h-2 rounded-full", paymentStatusInfo.dot)} />
                  {paymentStatusInfo.label}
                </Badge>
              )}

              <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded">
                #{booking._id.slice(-6).toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-12 gap-y-8">
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
              <div className="flex gap-3 bg-gray-50/50 border border-gray-100 rounded-xl p-4">
                <AlertCircle className="w-5 h-5 text-gray-400 shrink-0" />
                <p className="text-sm text-gray-500 leading-relaxed italic">"{booking.notes}"</p>
              </div>
            )}

            {booking.checkInAt && (
              <div className="flex items-center gap-2.5 text-sm font-medium text-emerald-700 bg-emerald-50/50 border border-emerald-100 rounded-xl px-4 py-2.5">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>
                  Check-in realizado: {new Date(booking.checkInAt).toLocaleString('pt-BR')}
                  {typeof booking.checkInDistanceMeters === 'number' &&
                    ` · ${Math.round(booking.checkInDistanceMeters)}m do destino`}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className={cn(
              "rounded-2xl p-6 text-center border transition-all",
              isAmountReleased ? 'bg-green-50/50 border-green-100' : 
              isAmountPaid ? 'bg-blue-50/50 border-blue-100' : 
              isAmountPending ? 'bg-amber-50/50 border-amber-100' : 
              'bg-gray-50 border-gray-100'
            )}>
              <p className={cn(
                "text-xs font-bold uppercase tracking-widest mb-2",
                isAmountReleased ? 'text-green-600' : 
                isAmountPaid ? 'text-blue-600' : 
                isAmountPending ? 'text-amber-600' : 
                'text-gray-400'
              )}>
                {isCaregiver ? (isAmountReleased ? 'Valor recebido' : 'Valor a receber') : (isAmountPaid ? 'Total pago' : 'Total a pagar')}
              </p>
              <p className={cn(
                "text-3xl font-black tracking-tighter",
                isAmountReleased ? 'text-green-700' : 
                isAmountPaid ? 'text-blue-700' : 
                isAmountPending ? 'text-amber-700' : 
                'text-gray-700'
              )}>
                R$ {(cardAmount ?? Number(booking.totalAmount) ?? 0).toFixed(2)}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {booking.status === 'pending' && isCaregiver && (
                <Button onClick={() => onStatusUpdate(booking._id, 'confirmed')} disabled={actionLoading} className="w-full bg-green-600 hover:bg-green-700">
                  Aceitar Agendamento
                </Button>
              )}
              {booking.status === 'pending' && (
                <Button variant="outline" onClick={() => onStatusUpdate(booking._id, 'cancelled')} disabled={actionLoading} className="w-full border-red-200 text-red-600 hover:bg-red-50">
                  Recusar / Cancelar
                </Button>
              )}
              {booking.status === 'confirmed' && isCaregiver && (
                <Button onClick={() => onCheckIn(booking._id)} disabled={actionLoading || !canCheckInNow} className="w-full">
                  Realizar Check-in
                </Button>
              )}
              {booking.status === 'in_progress' && isCaregiver && (
                <Button onClick={() => onStatusUpdate(booking._id, 'completed')} disabled={actionLoading} className="w-full">
                  Concluir Atendimento
                </Button>
              )}
              {payment?.status === 'pending' && !isCaregiver && (
                <Button onClick={() => onOpenPayment(booking._id)} disabled={actionLoading} className="w-full bg-primary-600">
                  Pagar Agora
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mt-8 pt-6 border-t border-gray-100">
          <div className="flex gap-2">
            {booking.status !== 'cancelled' && (
              <Button variant="secondary" size="sm" onClick={() => onOpenChat(booking._id)} className="rounded-full">
                <MessageCircle className="w-4 h-4 mr-2" />
                Conversar
              </Button>
            )}
            {showReports && (
              <Button variant="outline" size="sm" onClick={() => onOpenReports(booking._id)} className="rounded-full border-primary-200 text-primary-700 hover:bg-primary-50">
                <FileText className="w-4 h-4 mr-2" />
                Relatórios
                {feedbackCount > 0 && (
                  <Badge className="ml-2 bg-primary-600 hover:bg-primary-600">{feedbackCount}</Badge>
                )}
              </Button>
            )}
          </div>
          
          <div className="text-xs text-gray-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Última atualização: {new Date(booking.updatedAt || booking.createdAt).toLocaleDateString('pt-BR')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */
function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0 mt-0.5 border border-gray-100 shadow-sm">
        <Icon className="w-6 h-6 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-black text-gray-400 uppercase tracking-[0.15em] leading-none mb-2">
          {label}
        </p>
        <p className="text-lg font-bold text-gray-900 leading-tight">
          {value}
        </p>
      </div>
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
