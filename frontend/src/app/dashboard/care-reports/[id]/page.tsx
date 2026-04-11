'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { 
  ChevronLeft, 
  Loader2, 
  AlertCircle,
  Calendar,
  Clock,
  User,
  Heart,
  Stethoscope,
  Check,
  X,
  Pill,
  UtensilsCrossed,
  Droplets,
  Bath,
  Moon,
  Brain,
  Activity,
  Smile,
  Meh,
  Frown,
  Image as ImageIcon,
  type LucideIcon
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
  updatedAt?: string;
  caregiverId?: {
    _id: string;
    name: string;
    avatar?: string;
  };
  clientId?: {
    _id: string;
    name: string;
    avatar?: string;
  };
  bookingId?: {
    _id: string;
    serviceName: string;
    startDate: string;
    endDate: string;
    durationLabel?: string;
  };
  painLevel?: number;
  photos?: string[];
  // Campos específicos
  tookMedication?: boolean;
  medicationDetails?: string;
  ate?: boolean;
  foodDetails?: string;
  hydration?: boolean;
  hygiene?: boolean;
  hygieneDetails?: string;
  sleptWell?: boolean;
  sleepDetails?: string;
  behavior?: string;
  behaviorDetails?: string;
  bathInBed?: boolean;
  positionChange?: boolean;
  skinCondition?: string;
  diaperChange?: boolean;
  cognitiveStimulation?: boolean;
  orientation?: string;
  agitation?: string;
  wandering?: boolean;
  routineFollowed?: boolean;
  mobility?: string;
  transfers?: boolean;
  physiotherapy?: boolean;
  equipmentUsed?: boolean;
  communication?: string;
  sensoryIssues?: boolean;
  therapyActivities?: boolean;
  injectables?: boolean;
  dressings?: boolean;
  vitalSigns?: boolean;
  catheterCare?: boolean;
  patientCondition?: string;
  complications?: boolean;
  appointmentAttended?: boolean;
  prescriptionReceived?: boolean;
  medicalVisit?: boolean;
  activityCompleted?: boolean;
  incidents?: boolean;
  bathroomVisits?: boolean;
}

const MOOD_CONFIG: Record<number, { icon: LucideIcon; label: string; color: string; bg: string }> = {
  1: { icon: Frown, label: 'Muito ruim', color: 'text-red-600', bg: 'bg-red-50' },
  2: { icon: Frown, label: 'Ruim', color: 'text-orange-600', bg: 'bg-orange-50' },
  3: { icon: Meh, label: 'Regular', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  4: { icon: Smile, label: 'Bom', color: 'text-green-600', bg: 'bg-green-50' },
  5: { icon: Smile, label: 'Ótimo', color: 'text-emerald-600', bg: 'bg-emerald-50' },
};

export default function CareReportDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const reportId = params?.id as string;
  
  const [report, setReport] = useState<CareReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && reportId) {
      loadReport();
    }
  }, [isAuthenticated, reportId]);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('📄 Carregando relatório:', reportId);
      const data = await api.getFeedback(reportId);
      console.log('✅ Relatório carregado:', data);
      
      setReport(data);
    } catch (err: any) {
      console.error('❌ Erro ao carregar relatório:', err);
      setError(err.message || 'Erro ao carregar relatório');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-sm text-gray-500 mt-2">Carregando relatório...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </button>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900">Erro</h3>
                <p className="text-red-800 text-sm mt-1">{error || 'Relatório não encontrado'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const moodConfig = report.patientMood ? MOOD_CONFIG[report.patientMood] : null;
  const isCaregiver = user?.role === 'caregiver';

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </button>

          <h1 className="text-xl font-bold text-gray-900">Relatório de Cuidados</h1>
        </div>

        {/* Card Principal */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm mb-4">
          {/* Header do Card */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  {report.caregiverId?.avatar ? (
                    <img 
                      src={report.caregiverId.avatar} 
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-white">
                    {report.caregiverId?.name || 'Cuidador'}
                  </p>
                  <p className="text-xs text-white/80">
                    {isCaregiver ? 'Você' : 'Cuidador responsável'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                {report.dayNumber && (
                  <span className="inline-block px-3 py-1 bg-white/20 text-white text-xs sm:text-sm rounded-full font-medium whitespace-nowrap">
                    Dia {report.dayNumber}
                  </span>
                )}
                {report.isFinal && (
                  <span className="inline-block px-3 py-1 bg-green-400 text-green-900 text-xs sm:text-sm rounded-full font-semibold whitespace-nowrap">
                    Relatório Final
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Metadados */}
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>
                  {new Date(report.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>
                  {new Date(report.createdAt).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>

            {/* Serviço */}
            {report.bookingId && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Serviço</p>
                <p className="font-medium text-gray-900">{report.bookingId.serviceName}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(report.bookingId.startDate).toLocaleDateString('pt-BR')} - {' '}
                  {new Date(report.bookingId.endDate).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}
          </div>

          {/* Conteúdo Principal */}
          <div className="p-4 space-y-4">
            {/* Estado Emocional */}
            {moodConfig && (
              <div className={`${moodConfig.bg} rounded-xl p-4 border border-gray-200`}>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 ${moodConfig.bg} rounded-full flex items-center justify-center ring-2 ring-offset-2 ${moodConfig.color.replace('text-', 'ring-')}`}>
                    <moodConfig.icon className={`w-7 h-7 ${moodConfig.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Estado Emocional</p>
                    <p className={`text-lg font-semibold ${moodConfig.color}`}>
                      {moodConfig.label}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Resumo */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-blue-600" />
                Resumo do Atendimento
              </h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {report.content}
              </p>
            </div>

            {/* Nível de Dor */}
            {report.painLevel !== undefined && report.painLevel > 0 && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className={`w-5 h-5 ${
                      report.painLevel <= 3 ? 'text-yellow-500' :
                      report.painLevel <= 6 ? 'text-orange-500' : 'text-red-500'
                    }`} />
                    <span className="font-medium text-gray-900">Nível de Dor</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-bold ${
                      report.painLevel <= 3 ? 'text-yellow-600' :
                      report.painLevel <= 6 ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {report.painLevel}
                    </span>
                    <span className="text-gray-500">/10</span>
                  </div>
                </div>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      report.painLevel <= 3 ? 'bg-yellow-500' :
                      report.painLevel <= 6 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${report.painLevel * 10}%` }}
                  />
                </div>
              </div>
            )}

            {/* Atividades Realizadas */}
            {report.careActivities && report.careActivities.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  Atividades Realizadas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {report.careActivities.map((activity, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200"
                    >
                      <Check className="w-4 h-4" />
                      {activity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Checklist Detalhado */}
            <DetailedChecklist report={report} />

            {/* Observações de Saúde */}
            {report.healthObservations && (
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-xl">
                <div className="flex items-center gap-2 text-amber-800 font-semibold mb-2">
                  <AlertCircle className="w-5 h-5" />
                  Observações Importantes
                </div>
                <p className="text-amber-900 leading-relaxed whitespace-pre-wrap">
                  {report.healthObservations}
                </p>
              </div>
            )}

            {/* Fotos */}
            {report.photos && report.photos.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                  Registros Fotográficos ({report.photos.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {report.photos.map((photo, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedPhoto(photo)}
                      className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition group"
                    >
                      <img
                        src={photo}
                        alt={`Foto ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer - REMOVIDO O ID */}
          {report.updatedAt && report.updatedAt !== report.createdAt && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
              <p>
                Última atualização: {new Date(report.updatedAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Foto */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={selectedPhoto}
            alt="Foto ampliada"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

// ========== COMPONENTE DE CHECKLIST DETALHADO ==========

function DetailedChecklist({ report }: { report: CareReport }) {
  const items: Array<{ 
    icon: LucideIcon; 
    label: string; 
    value: boolean | string | undefined; 
    details?: string;
    positive?: boolean;
  }> = [];

  // Medicação
  if (report.tookMedication !== undefined) {
    items.push({
      icon: Pill,
      label: 'Medicação',
      value: report.tookMedication,
      details: report.medicationDetails,
      positive: report.tookMedication,
    });
  }

  // Alimentação
  if (report.ate !== undefined) {
    items.push({
      icon: UtensilsCrossed,
      label: 'Alimentação',
      value: report.ate,
      details: report.foodDetails,
      positive: report.ate,
    });
  }

  // Hidratação
  if (report.hydration !== undefined) {
    items.push({
      icon: Droplets,
      label: 'Hidratação',
      value: report.hydration,
      positive: report.hydration,
    });
  }

  // Higiene
  if (report.hygiene !== undefined) {
    items.push({
      icon: Bath,
      label: 'Higiene',
      value: report.hygiene,
      details: report.hygieneDetails,
      positive: report.hygiene,
    });
  }

  // Sono
  if (report.sleptWell !== undefined) {
    items.push({
      icon: Moon,
      label: 'Qualidade do Sono',
      value: report.sleptWell,
      details: report.sleepDetails,
      positive: report.sleptWell === true,
    });
  }

  // Comportamento
  if (report.behavior) {
    items.push({
      icon: Brain,
      label: 'Comportamento',
      value: report.behavior,
      details: report.behaviorDetails,
      positive: ['excelente', 'bom', 'normal'].includes(report.behavior),
    });
  }

  // Mobilidade
  if (report.mobility) {
    items.push({
      icon: Activity,
      label: 'Mobilidade',
      value: report.mobility,
      positive: ['independente', 'auxilio_leve'].includes(report.mobility),
    });
  }

  if (items.length === 0) return null;

  // Função para formatar o valor de exibição
  const getDisplayValue = (value: boolean | string | undefined): string => {
    if (typeof value === 'boolean') {
      return value ? 'Sim' : 'Não';
    }
    if (typeof value === 'string') {
      // Traduzir valores comuns
      const translations: Record<string, string> = {
        'excelente': 'Excelente',
        'bom': 'Bom',
        'normal': 'Normal',
        'regular': 'Regular',
        'ruim': 'Ruim',
        'independente': 'Independente',
        'auxilio_leve': 'Auxílio Leve',
        'auxilio_moderado': 'Auxílio Moderado',
        'dependente': 'Dependente',
      };
      return translations[value] || value;
    }
    return '';
  };

  return (
    <div>
      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <Check className="w-4 h-4 text-blue-600" />
        Avaliação Detalhada
      </h3>
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div 
            key={idx} 
            className={`p-3 rounded-xl border-2 ${
              item.positive 
                ? 'bg-green-50 border-green-200' 
                : 'bg-orange-50 border-orange-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                item.positive ? 'bg-green-100' : 'bg-orange-100'
              }`}>
                <item.icon className={`w-5 h-5 ${
                  item.positive ? 'text-green-600' : 'text-orange-600'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-medium text-gray-900">{item.label}</span>
                  {typeof item.value === 'boolean' ? (
                    item.value ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <X className="w-5 h-5 text-orange-600" />
                    )
                  ) : (
                    <span className={`text-sm font-medium ${
                      item.positive ? 'text-green-700' : 'text-orange-700'
                    }`}>
                      {getDisplayValue(item.value)}
                    </span>
                  )}
                </div>
                {item.details && (
                  <p className="text-sm text-gray-700 mt-1">{item.details}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}