'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  FileText,
  Loader2,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
} from 'lucide-react';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Booking } from '@/types';

type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'held'
  | 'released'
  | 'refunded'
  | 'cancelled'
  | 'failed';

const STATUS_COPY: Record<PaymentStatus, { label: string; className: string }> = {
  pending: { label: 'Aguardando pagamento', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  paid: { label: 'Pago', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  held: { label: 'Pago e retido', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  released: { label: 'Liberado ao cuidador', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  refunded: { label: 'Reembolsado', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  cancelled: { label: 'Cancelado', className: 'bg-red-50 text-red-700 border-red-200' },
  failed: { label: 'Falhou', className: 'bg-red-50 text-red-700 border-red-200' },
};

function PaymentCheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('booking');
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      const redirectTarget = bookingId ? `/pagamento/checkout?booking=${bookingId}` : '/agenda';
      router.push(`/login?redirect=${encodeURIComponent(redirectTarget)}`);
    }
  }, [authLoading, isAuthenticated, router, bookingId]);

  useEffect(() => {
    if (!bookingId || authLoading || !isAuthenticated) return;

    const loadPayment = async () => {
      setLoading(true);
      setError('');

      try {
        const [bookings, paymentData] = await Promise.all([
          api.getMyBookings(),
          api.getPaymentByBooking(bookingId),
        ]);

        const relatedBooking = Array.isArray(bookings)
          ? bookings.find((item: Booking) => item._id === bookingId)
          : null;

        setBooking(relatedBooking || null);
        setPayment(paymentData);
      } catch (err: any) {
        setError(err.message || 'Não foi possível carregar os dados do pagamento.');
      } finally {
        setLoading(false);
      }
    };

    loadPayment();
  }, [bookingId, authLoading, isAuthenticated]);

  const isLocalCheckout = useMemo(() => {
    const url = payment?.paymentUrl || '';
    return !url || url.includes('/pagamento/checkout');
  }, [payment?.paymentUrl]);

  const paymentStatus = (payment?.status || 'pending') as PaymentStatus;
  const statusInfo = STATUS_COPY[paymentStatus] || STATUS_COPY.pending;
  const amount = Number(payment?.amount ?? booking?.totalAmount ?? 0);
  const platformFee = Number(payment?.platformFee ?? amount * 0.1);
  const caregiverAmount = Number(payment?.caregiverAmount ?? Math.max(amount - platformFee, 0));
  const alreadyPaid = ['paid', 'held', 'released'].includes(paymentStatus);
  const canPay = paymentStatus === 'pending';

  const handlePay = async () => {
    if (!bookingId || !payment) return;

    if (!isLocalCheckout && payment.paymentUrl) {
      window.location.href = payment.paymentUrl;
      return;
    }

    setPaying(true);
    setError('');

    try {
      await api.simulatePayment(bookingId);
      router.push(`/pagamento/sucesso?booking=${bookingId}`);
    } catch (err: any) {
      setError(err.message || 'Não foi possível confirmar o pagamento.');
    } finally {
      setPaying(false);
    }
  };

  if (authLoading || loading) {
    return (
      <main className="min-h-[calc(100vh-64px)] bg-gray-50 px-4 py-10">
        <div className="mx-auto flex min-h-[520px] max-w-5xl items-center justify-center">
          <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm font-semibold text-gray-600 shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
            Carregando pagamento...
          </div>
        </div>
      </main>
    );
  }

  if (!bookingId) {
    return <PaymentState title="Link de pagamento inválido" description="Abra o pagamento pelo email recebido ou pela sua agenda." />;
  }

  if (error && !payment) {
    return <PaymentState title="Pagamento não encontrado" description={error} />;
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-gray-50 px-4 py-10 text-gray-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link href="/agenda" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition-colors hover:text-primary-700">
          <ArrowLeft className="h-4 w-4" />
          Voltar para agenda
        </Link>

        <section className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-4 border-b border-gray-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary-100 bg-primary-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-700">
                  <CreditCard className="h-3.5 w-3.5" />
                  Checkout seguro
                </div>
                <h1 className="text-2xl font-black tracking-tight text-gray-950 sm:text-3xl">Pagamento do atendimento</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                  Confira os dados antes de concluir. O valor é processado pela plataforma e registrado no histórico do atendimento.
                </p>
              </div>
              <span className={`w-fit rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${statusInfo.className}`}>
                {statusInfo.label}
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <InfoTile label="Serviço" value={booking?.serviceName || booking?.serviceType || 'Atendimento domiciliar'} />
              <InfoTile label="Cuidador" value={(booking?.caregiverId as any)?.userId?.name || 'Cuidador'} />
              <InfoTile label="Paciente" value={booking?.patientName || booking?.clientName || 'Paciente'} />
              <InfoTile label="Data" value={booking?.startDate ? new Date(booking.startDate).toLocaleString('pt-BR') : 'Data do atendimento'} />
              {booking?.address && <InfoTile label="Local" value={booking.address} wide />}
              <InfoTile label="Código" value={payment?.transactionId || `#${bookingId.slice(-6).toUpperCase()}`} />
            </div>

            <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <div className="flex gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
                <div>
                  <p className="font-semibold text-blue-950">Pagamento protegido</p>
                  <p className="mt-1 text-sm leading-6 text-blue-800">
                    A confirmação fica registrada na plataforma. Nunca pague fora da CuidarBem para manter a proteção do atendimento.
                  </p>
                </div>
              </div>
            </div>

            {payment?.history?.length > 0 && (
              <div className="mt-6">
                <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-500">
                  <ReceiptText className="h-4 w-4" />
                  Histórico
                </div>
                <div className="space-y-3">
                  {payment.history.map((item: any, index: number) => (
                    <div key={`${item.status}-${index}`} className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                      <p className="font-semibold text-gray-900">{item.description || item.status}</p>
                      {item.date && <p className="mt-1 text-xs text-gray-500">{new Date(item.date).toLocaleString('pt-BR')}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="h-fit rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500">Resumo</p>
                <p className="text-xl font-black text-gray-950">{formatCurrency(amount)}</p>
              </div>
            </div>

            <div className="space-y-3 border-y border-gray-100 py-5 text-sm">
              <PriceRow label="Valor do atendimento" value={formatCurrency(amount)} />
              <PriceRow label="Taxa da plataforma" value={formatCurrency(platformFee)} />
              <PriceRow label="Repasse ao cuidador" value={formatCurrency(caregiverAmount)} />
            </div>

            {error && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <div className="flex gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </div>
              </div>
            )}

            {alreadyPaid ? (
              <Link href="/agenda" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Ver na agenda
              </Link>
            ) : (
              <button
                type="button"
                onClick={handlePay}
                disabled={!canPay || paying}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary-600/20 transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : isLocalCheckout ? <LockKeyhole className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
                {isLocalCheckout ? 'Confirmar pagamento' : 'Continuar no Mercado Pago'}
              </button>
            )}

            {!isLocalCheckout && payment?.paymentUrl && (
              <p className="mt-3 text-center text-xs leading-5 text-gray-500">
                Você será redirecionado para o ambiente seguro do Mercado Pago.
              </p>
            )}

            {isLocalCheckout && canPay && (
              <p className="mt-3 text-center text-xs leading-5 text-gray-500">
                Checkout local usado quando o Mercado Pago não retornou um link externo.
              </p>
            )}
          </aside>
        </section>
      </div>
    </main>
  );
}

function PaymentState({ title, description }: { title: string; description: string }) {
  return (
    <main className="min-h-[calc(100vh-64px)] bg-gray-50 px-4 py-10">
      <div className="mx-auto flex min-h-[520px] max-w-xl items-center justify-center">
        <div className="rounded-[28px] border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black text-gray-950">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-gray-500">{description}</p>
          <Link href="/agenda" className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary-600 px-5 py-3 text-sm font-bold text-white hover:bg-primary-700">
            Ir para agenda
          </Link>
        </div>
      </div>
    </main>
  );
}

function InfoTile({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`rounded-2xl border border-gray-100 bg-gray-50 p-4 ${wide ? 'md:col-span-2' : ''}`}>
      <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-gray-900">{value}</p>
    </div>
  );
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-gray-500">{label}</span>
      <span className="font-bold text-gray-900">{value}</span>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number.isFinite(value) ? value : 0);
}

export default function PaymentCheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <PaymentCheckoutContent />
    </Suspense>
  );
}