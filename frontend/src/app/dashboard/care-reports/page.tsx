// app/dashboard/care-reports/page.tsx
'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import CareReportsContent from '@/components/CareReportsContent';

export default function CareReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      }
    >
      <CareReportsContent />
    </Suspense>
  );
}