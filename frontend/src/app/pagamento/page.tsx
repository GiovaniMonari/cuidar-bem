'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, ArrowRight } from 'lucide-react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('booking');

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <div className="card p-10 text-center max-w-md">
        <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Pagamento Confirmado!
        </h1>
        <p className="text-gray-500 mb-2">
          Seu pagamento foi processado com sucesso.
        </p>
        <p className="text-sm text-blue-600 bg-blue-50 rounded-lg p-3 mb-6">
          🔒 O valor ficará retido na plataforma até a conclusão do serviço,
          garantindo a segurança da transação.
        </p>
        <Link
          href="/dashboard"
          className="btn-primary inline-flex items-center gap-2"
        >
          Ir para Dashboard
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Carregando...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
