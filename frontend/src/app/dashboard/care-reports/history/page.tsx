'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import CareReportsHistoryContent from '@/components/CareReportsHistoryContent';

export default function CareReportsHistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="text-sm text-gray-500 mt-2">Carregando relatórios...</p>
          </div>
        </div>
      }
    >
      <CareReportsHistoryContent />
    </Suspense>
  );
}