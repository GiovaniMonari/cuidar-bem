'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation'; // ✅ CORRETO - App Router
import { 
  FileText, 
  Calendar, 
  Clock,
  ChevronRight,
  Pill,
  UtensilsCrossed,
  Droplets,
  Bath,
  Moon,
  Brain,
  Heart,
  Activity,
  Smile,
  Meh,
  Frown,
  Stethoscope,
  Check,
  AlertTriangle,
  RotateCcw,
  Shield,
  Footprints,
  Eye,
  Zap,
  Move,
  MessageCircle,
  Syringe,
  Scissors,
  Thermometer,
  Image,
  type LucideIcon
} from 'lucide-react';

// ========== INTERFACES ==========

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
  caregiverId?: { _id?: string; name: string; avatar?: string };
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
  painLevel?: number;
  photos?: string[];
  // Campos dinâmicos
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

interface CareReportListProps {
  reports: CareReport[];
  serviceType?: string;
  isMultiDay?: boolean;
  totalDays?: number;
  isCaregiver?: boolean;
  bookingId?: string;
}

// ========== CONFIGS ==========

const SERVICE_FIELDS: Record<string, string[]> = {
  cuidado_basico_idoso: ['tookMedication', 'ate', 'hydration', 'hygiene', 'sleptWell', 'behavior'],
  cuidado_acamado: ['tookMedication', 'ate', 'hydration', 'bathInBed', 'positionChange', 'skinCondition', 'diaperChange', 'sleptWell'],
  cuidado_alzheimer: ['tookMedication', 'ate', 'hydration', 'cognitiveStimulation', 'orientation', 'agitation', 'wandering', 'routineFollowed', 'sleptWell'],
  pernoite_idoso: ['tookMedication', 'sleptWell', 'bathroomVisits', 'diaperChange', 'positionChange', 'incidents'],
  cuidado_pcd_fisico: ['tookMedication', 'ate', 'hydration', 'hygiene', 'transfers', 'physiotherapy', 'mobility', 'equipmentUsed'],
  cuidado_pcd_intelectual: ['tookMedication', 'ate', 'hydration', 'routineFollowed', 'communication', 'behavior', 'sensoryIssues', 'therapyActivities'],
  enfermagem_domiciliar: ['tookMedication', 'injectables', 'dressings', 'vitalSigns', 'catheterCare', 'patientCondition'],
  pos_operatorio: ['tookMedication', 'dressings', 'ate', 'mobility', 'complications', 'vitalSigns'],
  acompanhante_consulta: ['appointmentAttended', 'tookMedication', 'ate', 'mobility', 'prescriptionReceived'],
  acompanhante_hospital: ['tookMedication', 'ate', 'hydration', 'hygiene', 'medicalVisit', 'patientCondition'],
  acompanhante_passeio: ['activityCompleted', 'ate', 'hydration', 'tookMedication', 'incidents'],
};

const MOOD_CONFIG: Record<number, { icon: LucideIcon; label: string; colorClass: string }> = {
  1: { icon: Frown, label: 'Muito ruim', colorClass: 'bg-red-100 text-red-600' },
  2: { icon: Frown, label: 'Ruim', colorClass: 'bg-orange-100 text-orange-600' },
  3: { icon: Meh, label: 'Regular', colorClass: 'bg-yellow-100 text-yellow-600' },
  4: { icon: Smile, label: 'Bom', colorClass: 'bg-green-100 text-green-600' },
  5: { icon: Smile, label: 'Ótimo', colorClass: 'bg-emerald-100 text-emerald-600' },
};

const FIELD_CONFIG: Record<string, { icon: LucideIcon; label: string; getValue: (v: any) => { value: string; positive: boolean } }> = {
  tookMedication: { icon: Pill, label: 'Medicação', getValue: (v) => ({ value: v ? 'Tomou' : 'Não', positive: v }) },
  ate: { icon: UtensilsCrossed, label: 'Alimentação', getValue: (v) => ({ value: v ? 'Bem' : 'Pouco', positive: v }) },
  hydration: { icon: Droplets, label: 'Hidratação', getValue: (v) => ({ value: v ? 'OK' : 'Insuf.', positive: v }) },
  hygiene: { icon: Bath, label: 'Higiene', getValue: (v) => ({ value: v ? 'Sim' : 'Não', positive: v }) },
  sleptWell: { icon: Moon, label: 'Sono', getValue: (v) => ({ value: v === true ? 'Bem' : typeof v === 'string' ? v : 'Mal', positive: v === true || v === 'otimo' || v === 'bom' }) },
  behavior: { icon: Brain, label: 'Comportamento', getValue: (v) => ({ value: v, positive: ['excelente', 'bom', 'normal'].includes(v) }) },
  bathInBed: { icon: Bath, label: 'Banho leito', getValue: (v) => ({ value: v ? 'Sim' : 'Não', positive: v }) },
  positionChange: { icon: RotateCcw, label: 'Decúbito', getValue: (v) => ({ value: v ? 'Sim' : 'Não', positive: v }) },
  skinCondition: { icon: Shield, label: 'Pele', getValue: (v) => ({ value: v, positive: v === 'normal' }) },
  diaperChange: { icon: Check, label: 'Fralda', getValue: (v) => ({ value: v ? 'Trocada' : 'N/A', positive: true }) },
  cognitiveStimulation: { icon: Brain, label: 'Est. cognitiva', getValue: (v) => ({ value: v ? 'Sim' : 'Não', positive: v }) },
  orientation: { icon: Eye, label: 'Orientação', getValue: (v) => ({ value: v, positive: v === 'orientado' }) },
  agitation: { icon: Zap, label: 'Agitação', getValue: (v) => ({ value: v, positive: v === 'calmo' }) },
  wandering: { icon: AlertTriangle, label: 'Fuga', getValue: (v) => ({ value: v ? 'Houve' : 'Não', positive: !v }) },
  routineFollowed: { icon: Clock, label: 'Rotina', getValue: (v) => ({ value: v ? 'Seguida' : 'Alterada', positive: v }) },
  mobility: { icon: Footprints, label: 'Mobilidade', getValue: (v) => ({ value: v, positive: ['independente', 'auxilio_leve', 'deambulou'].includes(v) }) },
  transfers: { icon: Move, label: 'Transferências', getValue: (v) => ({ value: v ? 'OK' : 'Não', positive: v }) },
  physiotherapy: { icon: Activity, label: 'Fisioterapia', getValue: (v) => ({ value: v ? 'Sim' : 'Não', positive: v }) },
  equipmentUsed: { icon: Check, label: 'Equipamentos', getValue: (v) => ({ value: v ? 'Sim' : 'Não', positive: true }) },
  communication: { icon: MessageCircle, label: 'Comunicação', getValue: (v) => ({ value: v, positive: v === 'boa' }) },
  sensoryIssues: { icon: Zap, label: 'Sensorial', getValue: (v) => ({ value: v ? 'Houve' : 'Não', positive: !v }) },
  therapyActivities: { icon: Activity, label: 'Terapias', getValue: (v) => ({ value: v ? 'Sim' : 'Não', positive: v }) },
  injectables: { icon: Syringe, label: 'Injetável', getValue: (v) => ({ value: v ? 'Aplicada' : 'N/A', positive: true }) },
  dressings: { icon: Scissors, label: 'Curativos', getValue: (v) => ({ value: v ? 'OK' : 'N/A', positive: true }) },
  vitalSigns: { icon: Thermometer, label: 'Sinais vitais', getValue: (v) => ({ value: v ? 'Aferidos' : 'Não', positive: v }) },
  catheterCare: { icon: Check, label: 'Sondas', getValue: (v) => ({ value: v ? 'OK' : 'N/A', positive: true }) },
  patientCondition: { icon: Stethoscope, label: 'Condição', getValue: (v) => ({ value: v, positive: ['estavel', 'melhora'].includes(v) }) },
  complications: { icon: AlertTriangle, label: 'Complicações', getValue: (v) => ({ value: v ? 'Houve' : 'Não', positive: !v }) },
  appointmentAttended: { icon: Stethoscope, label: 'Consulta', getValue: (v) => ({ value: v ? 'Sim' : 'Cancelada', positive: v }) },
  prescriptionReceived: { icon: FileText, label: 'Receitas', getValue: (v) => ({ value: v ? 'Sim' : 'Não', positive: v }) },
  medicalVisit: { icon: Stethoscope, label: 'Visita médica', getValue: (v) => ({ value: v ? 'Houve' : 'Não', positive: v }) },
  activityCompleted: { icon: Check, label: 'Atividade', getValue: (v) => ({ value: v ? 'Sim' : 'Cancelada', positive: v }) },
  incidents: { icon: AlertTriangle, label: 'Intercorrências', getValue: (v) => ({ value: v ? 'Houve' : 'Não', positive: !v }) },
  bathroomVisits: { icon: Moon, label: 'Banheiro', getValue: (v) => ({ value: v ? 'Sim' : 'Não', positive: true }) },
};

// ========== COMPONENTE PRINCIPAL ==========

export function CareReportList({
  reports,
  serviceType,
  isMultiDay = false,
  totalDays = 1,
  isCaregiver = false,
  bookingId,
}: CareReportListProps) {
  const router = useRouter(); // ✅ Hook do router

  const sortedReports = [...(reports || [])].sort((a, b) => {
    if (a.dayNumber && b.dayNumber) return b.dayNumber - a.dayNumber;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // ========== VISÃO DO CUIDADOR ==========
  if (isCaregiver) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-3 py-2.5 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-gray-900 text-sm">Relatórios Enviados</h3>
            </div>
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold">
              {reports.length}
            </span>
          </div>
        </div>

        {/* Lista vazia */}
        {(!reports || reports.length === 0) ? (
          <div className="p-6 text-center">
            <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Nenhum relatório enviado.</p>
          </div>
        ) : (
          <>
            {/* Lista de relatórios */}
            <div className="divide-y divide-gray-100">
              {sortedReports.slice(0, 3).map((report) => (
                <div 
                  key={report._id} 
                  className="px-3 py-2.5 hover:bg-gray-50 active:bg-gray-100 transition cursor-pointer group"
                  onClick={() => router.push(`/dashboard/care-reports/${report._id}`)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {isMultiDay && report.dayNumber && (
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-medium">
                            Dia {report.dayNumber}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {new Date(report.createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {report.isFinal && (
                          <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded font-medium">
                            Final
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2 group-hover:text-blue-600 transition">
                        {report.content}
                      </p>
                    </div>
                    {report.patientMood && (
                      <MoodBadge mood={report.patientMood} />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Ver todos */}
            {reports.length > 3 && bookingId && (
              <Link
                href={`/dashboard/care-reports/history?booking=${bookingId}`}
                className="flex items-center justify-center gap-1 py-2.5 text-sm text-blue-600 hover:bg-blue-50 active:bg-blue-100 transition border-t border-gray-100 font-medium"
              >
                Ver todos ({reports.length})
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </>
        )}
      </div>
    );
  }

  // ========== VISÃO DO CLIENTE ==========
  
  if (!reports || reports.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <FileText className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="font-semibold text-gray-900 mb-1 text-sm">Nenhum relatório</h3>
        <p className="text-gray-500 text-xs">Aguardando relatório do cuidador.</p>
      </div>
    );
  }

  // Filtrar campos baseado no tipo de serviço
  const relevantFields = serviceType 
    ? SERVICE_FIELDS[serviceType] || []
    : [];

  return (
    <div className="space-y-3">
      {/* Progresso para serviços multidia */}
      {isMultiDay && totalDays > 1 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Relatórios Recebidos
            </span>
            <span className="text-blue-700 font-semibold text-sm">
              {reports.length}/{totalDays}
            </span>
          </div>
          <div className="bg-blue-200 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-blue-600 h-full rounded-full transition-all"
              style={{ width: `${Math.min((reports.length / totalDays) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Lista de relatórios */}
      {sortedReports.map((report) => (
        <ClientReportCard 
          key={report._id} 
          report={report} 
          relevantFields={relevantFields}
          isMultiDay={isMultiDay}
        />
      ))}

      {/* Ver histórico completo */}
      {reports.length > 3 && bookingId && (
        <Link
          href={`/dashboard/care-reports/history?booking=${bookingId}`}
          className="block bg-white rounded-xl border border-gray-200 p-3 text-center hover:bg-gray-50 active:bg-gray-100 transition"
        >
          <div className="flex items-center justify-center gap-2 text-blue-600 font-medium text-sm">
            <Eye className="w-4 h-4" />
            Ver histórico completo ({reports.length} relatórios)
          </div>
        </Link>
      )}
    </div>
  );
}

// ========== CARD DO CLIENTE ==========

function ClientReportCard({ 
  report, 
  relevantFields,
  isMultiDay 
}: { 
  report: CareReport; 
  relevantFields: string[];
  isMultiDay: boolean;
}) {
  const router = useRouter(); // ✅ Hook do router
  const moodConfig = report.patientMood ? MOOD_CONFIG[report.patientMood] : null;
  const checklistItems = getChecklistItems(report, relevantFields);

  return (
    <div 
      className="bg-white rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all"
      onClick={() => router.push(`/dashboard/care-reports/${report._id}`)}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              {report.caregiverId?.avatar ? (
                <img 
                  src={report.caregiverId.avatar} 
                  alt=""
                  className="w-7 h-7 rounded-full object-cover"
                />
              ) : (
                <span className="text-white text-xs font-semibold">
                  {report.caregiverId?.name?.charAt(0) || 'C'}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-white text-sm truncate">
                {report.caregiverId?.name || 'Cuidador'}
              </p>
              <div className="flex items-center gap-1 text-white/70 text-xs">
                <Clock className="w-3 h-3" />
                {new Date(report.createdAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1 flex-shrink-0">
            {isMultiDay && report.dayNumber && (
              <span className="px-2 py-0.5 bg-white/20 text-white text-xs rounded-full">
                Dia {report.dayNumber}
              </span>
            )}
            {report.isFinal && (
              <span className="px-2 py-0.5 bg-green-400 text-green-900 text-xs rounded-full font-medium">
                Final
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-3 space-y-3">
        {/* Estado + Resumo */}
        <div className="flex gap-2">
          {moodConfig && (
            <div className={`flex-shrink-0 p-1.5 rounded-lg ${moodConfig.colorClass}`}>
              <moodConfig.icon className="w-5 h-5" />
            </div>
          )}
          <p className="text-sm text-gray-700 leading-relaxed flex-1">
            {report.content}
          </p>
        </div>

        {/* Checklist */}
        {checklistItems.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {checklistItems.map((item, idx) => (
              <span
                key={idx}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                  item.positive ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
                }`}
              >
                <item.icon className="w-3 h-3" />
                {item.label}
              </span>
            ))}
          </div>
        )}

        {/* Dor */}
        {report.painLevel !== undefined && report.painLevel > 0 && (
          <div className="flex items-center gap-1.5 text-xs">
            <Heart className={`w-3.5 h-3.5 ${
              report.painLevel <= 3 ? 'text-yellow-500' :
              report.painLevel <= 6 ? 'text-orange-500' : 'text-red-500'
            }`} />
            <span className="text-gray-600">
              Dor: <strong>{report.painLevel}/10</strong>
            </span>
          </div>
        )}

        {/* Atividades */}
        {report.careActivities && report.careActivities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {report.careActivities.map((activity, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs"
              >
                <Check className="w-3 h-3" />
                {activity}
              </span>
            ))}
          </div>
        )}

        {/* Observações */}
        {report.healthObservations && (
          <div className="bg-amber-50 border-l-2 border-amber-400 p-2 rounded-r">
            <div className="flex items-center gap-1 text-amber-800 text-xs font-medium mb-0.5">
              <Stethoscope className="w-3 h-3" />
              Observações
            </div>
            <p className="text-xs text-amber-700">{report.healthObservations}</p>
          </div>
        )}

        {/* Fotos */}
        {report.photos && report.photos.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {report.photos.map((photo, idx) => (
              <img
                key={idx}
                src={photo}
                alt=""
                className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ========== HELPERS ==========

function MoodBadge({ mood }: { mood: number }) {
  const config = MOOD_CONFIG[mood];
  if (!config) return null;
  const Icon = config.icon;
  return (
    <div className={`flex items-center justify-center w-7 h-7 rounded-full ${config.colorClass}`}>
      <Icon className="w-4 h-4" />
    </div>
  );
}

interface ChecklistItemData {
  icon: LucideIcon;
  label: string;
  value: string;
  positive: boolean;
}

function getChecklistItems(report: CareReport, relevantFields: string[]): ChecklistItemData[] {
  const items: ChecklistItemData[] = [];

  const fieldsToCheck = relevantFields.length > 0 
    ? relevantFields 
    : ['tookMedication', 'ate', 'hydration', 'hygiene', 'sleptWell', 'behavior'];

  fieldsToCheck.forEach(fieldKey => {
    const value = (report as any)[fieldKey];
    if (value === undefined || value === null) return;

    const config = FIELD_CONFIG[fieldKey];
    if (!config) return;

    const { value: displayValue, positive } = config.getValue(value);
    items.push({
      icon: config.icon,
      label: config.label,
      value: displayValue,
      positive,
    });
  });

  return items;
}