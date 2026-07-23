'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, CheckCircle, ReceiptText, ShieldCheck } from 'lucide-react';
import { api } from '@/services/api';

function SuccessContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('booking');
  const [payment, setPayment] = useState<any>(null);

  useEffect(() => {
    if (!bookingId) return;
    api.getPaymentByBooking(bookingId).then(setPayment).catch(() => undefined);
  }, [bookingId]);

  return (
    <main className="min-h-[calc(100vh-64px)] bg-gray-50 px-4 py-10">
      <div className="mx-auto flex min-h-[560px] max-w-2xl items-center justify-center">
        <section className="w-full rounded-[28px] border border-gray-200 bg-white p-8 text-center shadow-sm sm:p-10">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600">
            <CheckCircle className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-gray-950">Pagamento confirmado</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-500">
            Recebemos a confirmação do pagamento. O atendimento fica registrado na sua agenda e o histórico financeiro foi atualizado.
          </p>

          <div className="mt-8 grid gap-3 text-left sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                <ReceiptText className="h-4 w-4" />
                Transação
              </div>
              <p className="font-semibold text-gray-900">{payment?.transactionId || 'Registrada'}</p>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600">
                <ShieldCheck className="h-4 w-4" />
                Status
              </div>
              <p className="font-semibold text-blue-950">{payment?.status === 'held' ? 'Retido na plataforma' : 'Confirmado'}</p>
            </div>
          </div>

          <Link href="/agenda" className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary-600/20 transition-colors hover:bg-primary-700">
            Ir para agenda
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <SuccessContent />
    </Suspense>
  );
}