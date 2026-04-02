'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { Clock, ArrowRight } from 'lucide-react';

function PendingContent() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <div className="card p-10 text-center max-w-md">
        <div className="bg-yellow-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10 text-yellow-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Pagamento Pendente
        </h1>
        <p className="text-gray-500 mb-6">
          Seu pagamento está sendo processado. Você receberá um email quando for confirmado.
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

export default function PaymentPendingPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <PendingContent />
    </Suspense>
  );
}