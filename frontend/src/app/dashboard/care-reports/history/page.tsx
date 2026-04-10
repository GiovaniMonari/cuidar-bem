'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { 
  ChevronLeft, 
  Loader2, 
  FileText, 
  Calendar, 
  Clock,
  Check,
  AlertCircle,
  Smile,
  Meh,
  Frown,
  Heart,
  Filter,
  Search
} from 'lucide-react';

interface CareReport {
  _id: string;
  content: string;
  feedbackDate: string;
  serviceType?: string;
  dayNumber?: number;
  patientMood?: number;
  healthObservations?: string;
  careActivities?: string[];
  isFinal: boolean;
  createdAt: string;
  bookingId?: {
    _id: string;
    serviceName: string;
    clientName?: string;
    startDate: string;
    endDate: string;
  };
  painLevel?: number;
}

export default function CareReportsHistoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const bookingIdFilter = searchParams.get('booking');
  
  const [reports, setReports] = useState<CareReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'caregiver') {
      loadReports();
    } else if (isAuthenticated && user?.role !== 'caregiver') {
      setError('Apenas cuidadores podem acessar esta página');
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError('');

      let reportsData: CareReport[] = [];

      if (bookingIdFilter) {
        // Buscar relatórios de um booking específico
        reportsData = await api.getFeedbackByBooking(bookingIdFilter);
      } else {
        // Buscar todos os relatórios enviados pelo cuidador
        reportsData = await api.getFeedbackSent();
      }

      setReports(Array.isArray(reportsData) ? reportsData : []);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar por busca
  const filteredReports = reports.filter(report => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      report.content.toLowerCase().includes(search) ||
      (report.bookingId?.serviceName || '').toLowerCase().includes(search) ||
      (report.bookingId?.clientName || '').toLowerCase().includes(search)
    );
  });

  // Agrupar por booking (se não estiver filtrando por um booking específico)
  const groupedReports = !bookingIdFilter 
    ? filteredReports.reduce((acc, report) => {
        const bookingId = (report.bookingId as any)?._id || 'unknown';
        if (!acc[bookingId]) {
          acc[bookingId] = {
            booking: report.bookingId,
            reports: [],
          };
        }
        acc[bookingId].reports.push(report);
        return acc;
      }, {} as Record<string, { booking: any; reports: CareReport[] }>)
    : null;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-sm text-gray-500 mt-2">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-lg mx-auto px-3 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-blue-600 text-sm mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            Voltar
          </button>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-3 py-4">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gray-50 pb-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-blue-600 text-sm mb-3"
          >
            <ChevronLeft className="w-5 h-5" />
            Voltar
          </button>

          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-gray-900">
              {bookingIdFilter ? 'Relatórios do Serviço' : 'Meus Relatórios'}
            </h1>
            <span className="text-sm text-gray-500">
              {filteredReports.length} {filteredReports.length === 1 ? 'relatório' : 'relatórios'}
            </span>
          </div>

          {/* Busca */}
          {!bookingIdFilter && reports.length > 3 && (
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar relatórios..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* Lista de Relatórios */}
        {filteredReports.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-600 text-sm">
              {searchTerm ? 'Nenhum relatório encontrado.' : 'Você ainda não enviou nenhum relatório.'}
            </p>
          </div>
        ) : bookingIdFilter ? (
          // Lista simples (filtrado por booking)
          <div className="space-y-3">
            {filteredReports.map((report) => (
              <ReportCard key={report._id} report={report} showBookingInfo={false} />
            ))}
          </div>
        ) : (
          // Lista agrupada por booking
          <div className="space-y-4">
            {Object.entries(groupedReports || {}).map(([bookingId, { booking, reports: bookingReports }]) => (
              <div key={bookingId} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Header do Booking */}
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {booking?.serviceName || 'Serviço'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {booking?.startDate 
                            ? new Date(booking.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                            : 'Data'}
                        </span>
                        {booking?.clientName && (
                          <>
                            <span>•</span>
                            <span className="truncate">{booking.clientName}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full">
                      {bookingReports.length} {bookingReports.length === 1 ? 'relatório' : 'relatórios'}
                    </span>
                  </div>
                </div>

                {/* Lista de relatórios deste booking */}
                <div className="divide-y divide-gray-100">
                  {bookingReports.slice(0, 2).map((report) => (
                    <ReportCardCompact key={report._id} report={report} />
                  ))}
                </div>

                {/* Ver mais */}
                {bookingReports.length > 2 && (
                  <button
                    onClick={() => router.push(`/dashboard/care-reports/history?booking=${bookingId}`)}
                    className="w-full py-2 text-center text-xs text-blue-600 hover:bg-blue-50 transition"
                  >
                    Ver todos ({bookingReports.length})
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ========== COMPONENTES DE CARDS ==========

function ReportCard({ report, showBookingInfo = true }: { report: CareReport; showBookingInfo?: boolean }) {
  const MoodIcon = report.patientMood 
    ? report.patientMood <= 2 ? Frown : report.patientMood === 3 ? Meh : Smile
    : null;

  const moodColor = report.patientMood
    ? report.patientMood <= 2 ? 'text-orange-500' : report.patientMood === 3 ? 'text-yellow-500' : 'text-green-500'
    : '';

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white text-xs">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {new Date(report.createdAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {report.dayNumber && (
              <span className="px-2 py-0.5 bg-white/20 text-white text-xs rounded-full">
                Dia {report.dayNumber}
              </span>
            )}
            {report.isFinal && (
              <span className="px-2 py-0.5 bg-green-400 text-green-900 text-xs rounded-full">
                Final
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-3 space-y-2">
        {/* Booking Info */}
        {showBookingInfo && report.bookingId && (
          <div className="text-xs text-gray-500 pb-2 border-b border-gray-100">
            <span className="font-medium text-gray-700">{(report.bookingId as any)?.serviceName}</span>
            {(report.bookingId as any)?.clientName && (
              <span> • {(report.bookingId as any).clientName}</span>
            )}
          </div>
        )}

        {/* Estado + Conteúdo */}
        <div className="flex gap-2">
          {MoodIcon && (
            <div className={`flex-shrink-0 ${moodColor}`}>
              <MoodIcon className="w-5 h-5" />
            </div>
          )}
          <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
            {report.content}
          </p>
        </div>

        {/* Atividades */}
        {report.careActivities && report.careActivities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {report.careActivities.slice(0, 3).map((activity, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs"
              >
                <Check className="w-3 h-3" />
                {activity}
              </span>
            ))}
            {report.careActivities.length > 3 && (
              <span className="text-xs text-gray-500">
                +{report.careActivities.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Dor */}
        {report.painLevel !== undefined && report.painLevel > 0 && (
          <div className="flex items-center gap-1.5 text-xs">
            <Heart className={`w-3.5 h-3.5 ${
              report.painLevel <= 3 ? 'text-yellow-500' :
              report.painLevel <= 6 ? 'text-orange-500' : 'text-red-500'
            }`} />
            <span className="text-gray-600">Dor: {report.painLevel}/10</span>
          </div>
        )}

        {/* Observações */}
        {report.healthObservations && (
          <div className="bg-amber-50 border-l-2 border-amber-400 p-2 rounded-r text-xs text-amber-800">
            {report.healthObservations}
          </div>
        )}
      </div>
    </div>
  );
}

function ReportCardCompact({ report }: { report: CareReport }) {
  const MoodIcon = report.patientMood 
    ? report.patientMood <= 2 ? Frown : report.patientMood === 3 ? Meh : Smile
    : null;

  const moodColor = report.patientMood
    ? report.patientMood <= 2 ? 'text-orange-500' : report.patientMood === 3 ? 'text-yellow-500' : 'text-green-500'
    : '';

  return (
    <div className="px-3 py-2.5">
      <div className="flex items-start gap-2">
        {/* Data/Dia */}
        <div className="flex-shrink-0 text-center min-w-[40px]">
          {report.dayNumber ? (
            <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
              Dia {report.dayNumber}
            </span>
          ) : (
            <span className="text-xs text-gray-500">
              {new Date(report.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            </span>
          )}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-700 line-clamp-2">{report.content}</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>
              {new Date(report.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
            {report.careActivities && report.careActivities.length > 0 && (
              <>
                <span>•</span>
                <span>{report.careActivities.length} atividades</span>
              </>
            )}
          </div>
        </div>

        {/* Humor */}
        {MoodIcon && (
          <div className={`flex-shrink-0 ${moodColor}`}>
            <MoodIcon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}