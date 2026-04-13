// app/dashboard/care-reports/CareReportsContent.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { Booking } from '@/types';
import { CareReportForm } from '@/components/CareReportForm';
import { CareReportList } from '@/components/CareReportList';
import {
  ChevronLeft,
  Loader2,
  AlertCircle,
  FileText,
  Calendar,
  Clock,
} from 'lucide-react';

export default function CareReportsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const bookingId = searchParams.get('booking');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && bookingId) {
      loadData();
    } else if (!bookingId) {
      setLoading(false);
      setError('ID do serviço não fornecido');
    }
  }, [isAuthenticated, bookingId]);

  const loadData = async () => {
    if (!bookingId) {
      setError('ID do serviço não fornecido');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const myBookings = await api.getMyBookings();
      const foundBooking = myBookings.find((b: any) => b._id === bookingId);

      if (!foundBooking) {
        throw new Error('Serviço não encontrado');
      }

      setBooking(foundBooking);

      try {
        const reportsData = await api.getFeedbackByBooking(bookingId);
        setReports(Array.isArray(reportsData) ? reportsData : []);
      } catch {
        setReports([]);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleReportSent = () => {
    loadData();
  };

  const permissions = useMemo(() => {
    const isCaregiver = user?.role === 'caregiver';
    const userIdToCompare = user?.id || user?._id;

    const caregiverUserId =
      (booking?.caregiverId as any)?.userId?._id ||
      (booking?.caregiverId as any)?.userId ||
      (booking?.caregiverId as any)?._id;

    const clientUserId =
      (booking?.clientId as any)?._id || booking?.clientId;

    const isCaregiverOfBooking =
      isCaregiver &&
      String(caregiverUserId) === String(userIdToCompare);

    const isClientOfBooking =
      !isCaregiver &&
      String(clientUserId) === String(userIdToCompare);

    return {
      isCaregiver,
      isCaregiverOfBooking,
      isClientOfBooking,
    };
  }, [user, booking]);

  const serviceInfo = useMemo(() => {
    if (!booking) return null;

    const startDate = new Date(booking.startDate);
    const endDate = new Date(booking.endDate);
    const daysDiff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const durationHours = booking.durationHours || daysDiff * 24;
    const daysFromHours = Math.ceil(durationHours / 24);
    const totalDays = Math.max(daysDiff, daysFromHours, 1);
    const isMultiDay = totalDays > 1;

    const isServiceActive = ['in_progress', 'confirmed'].includes(
      booking.status
    );
    const isServiceDone = booking.status === 'completed';

    const canSendReport =
      permissions.isCaregiverOfBooking &&
      ((isServiceDone && !isMultiDay) ||
        (isServiceActive && isMultiDay) ||
        (isServiceDone && isMultiDay));

    let currentDay = 1;
    if (isMultiDay) {
      const now = new Date();
      currentDay = Math.ceil(
        (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      currentDay = Math.max(1, Math.min(currentDay, totalDays));
    }

    const daysWithReport = reports
      .map((r) => r.dayNumber)
      .filter((d): d is number => d !== undefined && d !== null);

    const nextDayToReport = isMultiDay
      ? Array.from({ length: currentDay }, (_, i) => i + 1).find(
          (d) => !daysWithReport.includes(d)
        ) || currentDay
      : 1;

    return {
      durationHours,
      isMultiDay,
      totalDays,
      isServiceActive,
      isServiceDone,
      canSendReport,
      currentDay,
      nextDayToReport,
      daysWithReport,
    };
  }, [booking, reports, permissions]);

  if (!bookingId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </button>
          <ErrorCard message="ID do serviço não fornecido na URL." />
        </div>
      </div>
    );
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </button>
          <ErrorCard message={error || 'Serviço não encontrado'} />
        </div>
      </div>
    );
  }

  if (!permissions.isCaregiverOfBooking && !permissions.isClientOfBooking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </button>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900 text-sm">
                  Acesso não autorizado
                </h3>
                <p className="text-yellow-800 text-sm mt-1">
                  Você não tem permissão para acessar estes relatórios.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="font-semibold text-gray-900 truncate">
                {booking.serviceName}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(booking.startDate).toLocaleDateString('pt-BR')} -{' '}
                  {new Date(booking.endDate).toLocaleDateString('pt-BR')}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {booking.durationLabel}
                </span>
              </div>
            </div>
            <StatusBadge status={booking.status} />
          </div>
        </div>

        {permissions.isCaregiverOfBooking && (
          <div className="space-y-4">
            <CareReportList
              reports={reports}
              serviceType={booking.serviceType}
              isMultiDay={serviceInfo?.isMultiDay}
              totalDays={serviceInfo?.totalDays}
              isCaregiver={true}
              bookingId={bookingId}
            />

            {serviceInfo?.canSendReport && (
              <CareReportForm
                bookingId={bookingId}
                serviceKey={booking.serviceType}
                serviceName={booking.serviceName}
                durationHours={serviceInfo.durationHours}
                dayNumber={serviceInfo.nextDayToReport}
                onReportSent={handleReportSent}
                isMultiDay={serviceInfo.isMultiDay}
                totalDays={serviceInfo.totalDays}
              />
            )}

            {!serviceInfo?.canSendReport && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  {booking.status === 'pending' &&
                    'Aguardando confirmação do serviço.'}
                  {booking.status === 'confirmed' &&
                    !serviceInfo?.isMultiDay &&
                    'O relatório poderá ser enviado após a conclusão do serviço.'}
                  {booking.status === 'cancelled' &&
                    'Este serviço foi cancelado.'}
                </p>
              </div>
            )}
          </div>
        )}

        {permissions.isClientOfBooking && (
          <div className="space-y-4">
            {reports.length === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-blue-900 font-medium text-sm">
                      Aguardando relatórios
                    </p>
                    <p className="text-blue-700 text-xs mt-1">
                      O cuidador enviará relatórios sobre os cuidados
                      prestados. Você será notificado quando um novo relatório
                      for enviado.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <CareReportList
              reports={reports}
              serviceType={booking.serviceType}
              isMultiDay={serviceInfo?.isMultiDay}
              totalDays={serviceInfo?.totalDays}
              isCaregiver={false}
              bookingId={bookingId}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ========== HELPER COMPONENTS ==========

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-red-900 text-sm">Erro</h3>
          <p className="text-red-800 text-sm mt-1">{message}</p>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pendente' },
    confirmed: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Confirmado' },
    in_progress: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Em andamento' },
    completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Concluído' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelado' },
  };

  const { bg, text, label } = config[status] || config.pending;

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${bg} ${text} flex-shrink-0`}
    >
      {label}
    </span>
  );
}