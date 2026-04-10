'use client';

import { useState, useMemo } from 'react';
import { 
  FileText, 
  Send, 
  Loader2, 
  ImagePlus, 
  X, 
  Pill, 
  UtensilsCrossed, 
  Droplets, 
  Bath, 
  Moon, 
  Brain, 
  Heart,
  Activity,
  Plus,
  Smile,
  Meh,
  Frown,
  Stethoscope,
  CheckCircle2,
  XCircle,
  Check,
  Thermometer,
  RotateCcw,
  Scissors,
  Syringe,
  Move,
  MessageCircle,
  Shield,
  Footprints,
  Eye,
  Clock,
  Zap,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  type LucideIcon
} from 'lucide-react';
import { api } from '@/services/api';

// ========== CONFIGURAÇÃO DOS CAMPOS POR TIPO DE SERVIÇO ==========

interface ChecklistField {
  key: string;
  label: string;
  icon: LucideIcon;
  type: 'boolean' | 'select';
  positiveText?: string;
  negativeText?: string;
  options?: { value: string; label: string }[];
  hasDetails?: boolean;
  detailsPlaceholder?: string;
  showDetailsWhen?: 'always' | 'positive' | 'negative';
}

interface ServiceChecklistConfig {
  title: string;
  fields: ChecklistField[];
}

// Campos comuns
const COMMON_FIELDS: ChecklistField[] = [
  {
    key: 'tookMedication',
    label: 'Medicação',
    icon: Pill,
    type: 'boolean',
    positiveText: 'Tomou',
    negativeText: 'Não',
    hasDetails: true,
    detailsPlaceholder: 'Quais medicamentos...',
    showDetailsWhen: 'always',
  },
  {
    key: 'ate',
    label: 'Alimentação',
    icon: UtensilsCrossed,
    type: 'boolean',
    positiveText: 'Bem',
    negativeText: 'Pouco',
    hasDetails: true,
    detailsPlaceholder: 'O que comeu...',
    showDetailsWhen: 'always',
  },
  {
    key: 'hydration',
    label: 'Hidratação',
    icon: Droplets,
    type: 'boolean',
    positiveText: 'Adequada',
    negativeText: 'Insuficiente',
  },
];

// Configuração por tipo de serviço
const SERVICE_CHECKLIST_CONFIG: Record<string, ServiceChecklistConfig> = {
  cuidado_basico_idoso: {
    title: 'Cuidados Básicos',
    fields: [
      ...COMMON_FIELDS,
      { key: 'hygiene', label: 'Higiene', icon: Bath, type: 'boolean', positiveText: 'Realizada', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Detalhes...', showDetailsWhen: 'positive' },
      { key: 'sleptWell', label: 'Sono', icon: Moon, type: 'boolean', positiveText: 'Bem', negativeText: 'Mal', hasDetails: true, detailsPlaceholder: 'Detalhes...', showDetailsWhen: 'negative' },
      { key: 'behavior', label: 'Comportamento', icon: Brain, type: 'select', options: [{ value: 'excelente', label: 'Excelente' }, { value: 'bom', label: 'Bom' }, { value: 'normal', label: 'Normal' }, { value: 'agitado', label: 'Agitado' }, { value: 'agressivo', label: 'Agressivo' }], hasDetails: true, detailsPlaceholder: 'Observações...' },
    ],
  },
  cuidado_acamado: {
    title: 'Cuidados Acamado',
    fields: [
      ...COMMON_FIELDS,
      { key: 'bathInBed', label: 'Banho no Leito', icon: Bath, type: 'boolean', positiveText: 'Realizado', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Observações...', showDetailsWhen: 'positive' },
      { key: 'positionChange', label: 'Mudança Decúbito', icon: RotateCcw, type: 'boolean', positiveText: 'Realizada', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Horários...', showDetailsWhen: 'positive' },
      { key: 'skinCondition', label: 'Pele', icon: Shield, type: 'select', options: [{ value: 'normal', label: 'Normal' }, { value: 'ressecada', label: 'Ressecada' }, { value: 'avermelhada', label: 'Avermelhada' }, { value: 'lesao', label: 'Com lesão' }], hasDetails: true, detailsPlaceholder: 'Localização...' },
      { key: 'diaperChange', label: 'Troca Fralda', icon: Check, type: 'boolean', positiveText: 'Realizada', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Quantidade...', showDetailsWhen: 'positive' },
      { key: 'sleptWell', label: 'Sono', icon: Moon, type: 'boolean', positiveText: 'Bem', negativeText: 'Agitado', hasDetails: true, detailsPlaceholder: 'Detalhes...', showDetailsWhen: 'negative' },
    ],
  },
  cuidado_alzheimer: {
    title: 'Cuidados Alzheimer',
    fields: [
      ...COMMON_FIELDS,
      { key: 'cognitiveStimulation', label: 'Estim. Cognitiva', icon: Brain, type: 'boolean', positiveText: 'Realizada', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Atividades...', showDetailsWhen: 'positive' },
      { key: 'orientation', label: 'Orientação', icon: Eye, type: 'select', options: [{ value: 'orientado', label: 'Orientado' }, { value: 'parcial', label: 'Parcial' }, { value: 'desorientado', label: 'Desorientado' }], hasDetails: true, detailsPlaceholder: 'Observações...' },
      { key: 'agitation', label: 'Agitação', icon: Zap, type: 'select', options: [{ value: 'calmo', label: 'Calmo' }, { value: 'leve', label: 'Leve' }, { value: 'moderada', label: 'Moderada' }, { value: 'intensa', label: 'Intensa' }], hasDetails: true, detailsPlaceholder: 'Gatilhos...' },
      { key: 'wandering', label: 'Tentativa Fuga', icon: AlertTriangle, type: 'boolean', positiveText: 'Não houve', negativeText: 'Houve', hasDetails: true, detailsPlaceholder: 'O que ocorreu...', showDetailsWhen: 'negative' },
      { key: 'routineFollowed', label: 'Rotina', icon: Clock, type: 'boolean', positiveText: 'Seguida', negativeText: 'Alterada', hasDetails: true, detailsPlaceholder: 'Alterações...', showDetailsWhen: 'negative' },
    ],
  },
  pernoite_idoso: {
    title: 'Relatório Noturno',
    fields: [
      { key: 'tookMedication', label: 'Medicação Noturna', icon: Pill, type: 'boolean', positiveText: 'Tomou', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Horários...', showDetailsWhen: 'always' },
      { key: 'sleptWell', label: 'Sono', icon: Moon, type: 'select', options: [{ value: 'otimo', label: 'Dormiu bem' }, { value: 'bom', label: 'Acordou 1-2x' }, { value: 'regular', label: 'Agitado' }, { value: 'ruim', label: 'Não dormiu' }], hasDetails: true, detailsPlaceholder: 'Horários que acordou...' },
      { key: 'bathroomVisits', label: 'Idas Banheiro', icon: Moon, type: 'boolean', positiveText: 'Sim', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Quantidade...', showDetailsWhen: 'positive' },
      { key: 'diaperChange', label: 'Troca Fralda', icon: Check, type: 'boolean', positiveText: 'Realizada', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Horários...', showDetailsWhen: 'positive' },
      { key: 'positionChange', label: 'Mudança Posição', icon: RotateCcw, type: 'boolean', positiveText: 'Realizada', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Horários...', showDetailsWhen: 'positive' },
      { key: 'incidents', label: 'Intercorrências', icon: AlertTriangle, type: 'boolean', positiveText: 'Não houve', negativeText: 'Houve', hasDetails: true, detailsPlaceholder: 'Descreva...', showDetailsWhen: 'negative' },
    ],
  },
  cuidado_pcd_fisico: {
    title: 'Cuidados PcD Física',
    fields: [
      ...COMMON_FIELDS,
      { key: 'hygiene', label: 'Higiene', icon: Bath, type: 'boolean', positiveText: 'Realizada', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Detalhes...', showDetailsWhen: 'positive' },
      { key: 'transfers', label: 'Transferências', icon: Move, type: 'boolean', positiveText: 'Realizadas', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Dificuldades...', showDetailsWhen: 'positive' },
      { key: 'physiotherapy', label: 'Fisioterapia', icon: Activity, type: 'boolean', positiveText: 'Realizados', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Exercícios...', showDetailsWhen: 'positive' },
      { key: 'mobility', label: 'Locomoção', icon: Footprints, type: 'select', options: [{ value: 'independente', label: 'Independente' }, { value: 'auxilio_leve', label: 'Auxílio leve' }, { value: 'auxilio_total', label: 'Auxílio total' }, { value: 'nao_locomoveu', label: 'Não locomoveu' }], hasDetails: true, detailsPlaceholder: 'Distâncias...' },
      { key: 'equipmentUsed', label: 'Equipamentos', icon: Check, type: 'boolean', positiveText: 'Usados', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Quais...', showDetailsWhen: 'positive' },
    ],
  },
  cuidado_pcd_intelectual: {
    title: 'Cuidados PcD Intelectual',
    fields: [
      ...COMMON_FIELDS,
      { key: 'routineFollowed', label: 'Rotina', icon: Clock, type: 'boolean', positiveText: 'Seguida', negativeText: 'Alterada', hasDetails: true, detailsPlaceholder: 'Alterações...', showDetailsWhen: 'negative' },
      { key: 'communication', label: 'Comunicação', icon: MessageCircle, type: 'select', options: [{ value: 'boa', label: 'Boa' }, { value: 'regular', label: 'Regular' }, { value: 'dificil', label: 'Difícil' }], hasDetails: true, detailsPlaceholder: 'Formas usadas...' },
      { key: 'behavior', label: 'Comportamento', icon: Brain, type: 'select', options: [{ value: 'excelente', label: 'Excelente' }, { value: 'bom', label: 'Bom' }, { value: 'regular', label: 'Regular' }, { value: 'crises', label: 'Com crises' }], hasDetails: true, detailsPlaceholder: 'Gatilhos, manejo...' },
      { key: 'sensoryIssues', label: 'Questões Sensoriais', icon: Zap, type: 'boolean', positiveText: 'Não houve', negativeText: 'Houve', hasDetails: true, detailsPlaceholder: 'O que ocorreu...', showDetailsWhen: 'negative' },
      { key: 'therapyActivities', label: 'Terapias', icon: Activity, type: 'boolean', positiveText: 'Realizadas', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Quais...', showDetailsWhen: 'positive' },
    ],
  },
  enfermagem_domiciliar: {
    title: 'Procedimentos Enfermagem',
    fields: [
      { key: 'tookMedication', label: 'Medicação', icon: Pill, type: 'boolean', positiveText: 'Administrada', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Medicamentos, via...', showDetailsWhen: 'always' },
      { key: 'injectables', label: 'Injetável', icon: Syringe, type: 'boolean', positiveText: 'Aplicada', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Medicamento, local...', showDetailsWhen: 'positive' },
      { key: 'dressings', label: 'Curativos', icon: Scissors, type: 'boolean', positiveText: 'Realizados', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Local, aspecto...', showDetailsWhen: 'positive' },
      { key: 'vitalSigns', label: 'Sinais Vitais', icon: Thermometer, type: 'boolean', positiveText: 'Aferidos', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'PA, FC, Temp...', showDetailsWhen: 'positive' },
      { key: 'catheterCare', label: 'Sondas', icon: Check, type: 'boolean', positiveText: 'Cuidados OK', negativeText: 'N/A', hasDetails: true, detailsPlaceholder: 'Tipo, aspecto...', showDetailsWhen: 'positive' },
      { key: 'patientCondition', label: 'Condição', icon: Stethoscope, type: 'select', options: [{ value: 'estavel', label: 'Estável' }, { value: 'melhora', label: 'Melhora' }, { value: 'piora', label: 'Piora' }, { value: 'atencao', label: 'Atenção' }], hasDetails: true, detailsPlaceholder: 'Observações clínicas...' },
    ],
  },
  pos_operatorio: {
    title: 'Cuidados Pós-Op',
    fields: [
      { key: 'tookMedication', label: 'Medicação', icon: Pill, type: 'boolean', positiveText: 'Tomou', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Analgésicos...', showDetailsWhen: 'always' },
      { key: 'dressings', label: 'Curativo', icon: Scissors, type: 'boolean', positiveText: 'Realizado', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Aspecto, secreção...', showDetailsWhen: 'positive' },
      { key: 'ate', label: 'Alimentação', icon: UtensilsCrossed, type: 'boolean', positiveText: 'Comeu', negativeText: 'Náusea', hasDetails: true, detailsPlaceholder: 'Dieta, tolerância...', showDetailsWhen: 'always' },
      { key: 'mobility', label: 'Mobilização', icon: Footprints, type: 'select', options: [{ value: 'deambulou', label: 'Deambulou' }, { value: 'sentou', label: 'Sentou' }, { value: 'repouso', label: 'Repouso' }], hasDetails: true, detailsPlaceholder: 'Distância...' },
      { key: 'complications', label: 'Complicações', icon: AlertTriangle, type: 'boolean', positiveText: 'Não houve', negativeText: 'Houve', hasDetails: true, detailsPlaceholder: 'Descreva...', showDetailsWhen: 'negative' },
      { key: 'vitalSigns', label: 'Sinais Vitais', icon: Thermometer, type: 'boolean', positiveText: 'Normais', negativeText: 'Alterados', hasDetails: true, detailsPlaceholder: 'PA, FC, Temp...', showDetailsWhen: 'always' },
    ],
  },
  acompanhante_consulta: {
    title: 'Acompanhamento Consulta',
    fields: [
      { key: 'appointmentAttended', label: 'Consulta', icon: Stethoscope, type: 'boolean', positiveText: 'Realizada', negativeText: 'Cancelada', hasDetails: true, detailsPlaceholder: 'Local, médico...', showDetailsWhen: 'always' },
      { key: 'tookMedication', label: 'Medicação', icon: Pill, type: 'boolean', positiveText: 'Tomou', negativeText: 'N/A', hasDetails: true, detailsPlaceholder: 'Medicamentos...', showDetailsWhen: 'positive' },
      { key: 'ate', label: 'Alimentação', icon: UtensilsCrossed, type: 'boolean', positiveText: 'Comeu', negativeText: 'Jejum', hasDetails: true, detailsPlaceholder: 'O que comeu...', showDetailsWhen: 'always' },
      { key: 'mobility', label: 'Locomoção', icon: Footprints, type: 'select', options: [{ value: 'independente', label: 'Independente' }, { value: 'auxilio', label: 'Com auxílio' }, { value: 'cadeira', label: 'Cadeira' }], hasDetails: true, detailsPlaceholder: 'Observações...' },
      { key: 'prescriptionReceived', label: 'Receitas', icon: FileText, type: 'boolean', positiveText: 'Recebidas', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Resumo...', showDetailsWhen: 'positive' },
    ],
  },
  acompanhante_hospital: {
    title: 'Acompanhamento Hospital',
    fields: [
      { key: 'tookMedication', label: 'Medicação', icon: Pill, type: 'boolean', positiveText: 'Administrada', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Medicamentos...', showDetailsWhen: 'always' },
      { key: 'ate', label: 'Alimentação', icon: UtensilsCrossed, type: 'boolean', positiveText: 'Comeu', negativeText: 'Não comeu', hasDetails: true, detailsPlaceholder: 'Dieta...', showDetailsWhen: 'always' },
      { key: 'hydration', label: 'Hidratação', icon: Droplets, type: 'boolean', positiveText: 'Adequada', negativeText: 'Insuficiente', hasDetails: true, detailsPlaceholder: 'Soro, oral...', showDetailsWhen: 'always' },
      { key: 'hygiene', label: 'Higiene', icon: Bath, type: 'boolean', positiveText: 'Realizada', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Banho...', showDetailsWhen: 'positive' },
      { key: 'medicalVisit', label: 'Visita Médica', icon: Stethoscope, type: 'boolean', positiveText: 'Houve', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Informações...', showDetailsWhen: 'positive' },
      { key: 'patientCondition', label: 'Estado', icon: Heart, type: 'select', options: [{ value: 'estavel', label: 'Estável' }, { value: 'melhora', label: 'Melhora' }, { value: 'piora', label: 'Piora' }, { value: 'critico', label: 'Crítico' }], hasDetails: true, detailsPlaceholder: 'Observações...' },
    ],
  },
  acompanhante_passeio: {
    title: 'Relatório Passeio',
    fields: [
      { key: 'activityCompleted', label: 'Atividade', icon: Check, type: 'boolean', positiveText: 'Realizada', negativeText: 'Cancelada', hasDetails: true, detailsPlaceholder: 'Local, duração...', showDetailsWhen: 'always' },
      { key: 'ate', label: 'Alimentação', icon: UtensilsCrossed, type: 'boolean', positiveText: 'Comeu', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'O que comeu...', showDetailsWhen: 'positive' },
      { key: 'hydration', label: 'Hidratação', icon: Droplets, type: 'boolean', positiveText: 'Adequada', negativeText: 'Insuficiente' },
      { key: 'tookMedication', label: 'Medicação', icon: Pill, type: 'boolean', positiveText: 'Tomou', negativeText: 'N/A', hasDetails: true, detailsPlaceholder: 'Medicamentos...', showDetailsWhen: 'positive' },
      { key: 'incidents', label: 'Intercorrências', icon: AlertTriangle, type: 'boolean', positiveText: 'Não houve', negativeText: 'Houve', hasDetails: true, detailsPlaceholder: 'Descreva...', showDetailsWhen: 'negative' },
    ],
  },
};

const DEFAULT_CHECKLIST_CONFIG: ServiceChecklistConfig = {
  title: 'Cuidados do Dia',
  fields: [
    ...COMMON_FIELDS,
    { key: 'hygiene', label: 'Higiene', icon: Bath, type: 'boolean', positiveText: 'Realizada', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Detalhes...', showDetailsWhen: 'positive' },
    { key: 'sleptWell', label: 'Sono', icon: Moon, type: 'boolean', positiveText: 'Bem', negativeText: 'Mal', hasDetails: true, detailsPlaceholder: 'Detalhes...', showDetailsWhen: 'negative' },
    { key: 'behavior', label: 'Comportamento', icon: Brain, type: 'select', options: [{ value: 'excelente', label: 'Excelente' }, { value: 'bom', label: 'Bom' }, { value: 'normal', label: 'Normal' }, { value: 'agitado', label: 'Agitado' }, { value: 'agressivo', label: 'Agressivo' }], hasDetails: true, detailsPlaceholder: 'Observações...' },
  ],
};

// Mapeamento de detalhes
const DETAILS_FIELD_MAPPING: Record<string, string> = {
  tookMedication: 'medicationDetails',
  ate: 'foodDetails',
  hygiene: 'hygieneDetails',
  sleptWell: 'sleepDetails',
  behavior: 'behaviorDetails',
  bathInBed: 'bathInBedDetails',
  positionChange: 'positionChangeDetails',
  skinCondition: 'skinConditionDetails',
  diaperChange: 'diaperChangeDetails',
  cognitiveStimulation: 'cognitiveStimulationDetails',
  orientation: 'orientationDetails',
  agitation: 'agitationDetails',
  wandering: 'wanderingDetails',
  routineFollowed: 'routineFollowedDetails',
  mobility: 'mobilityDetails',
  transfers: 'transfersDetails',
  physiotherapy: 'physiotherapyDetails',
  equipmentUsed: 'equipmentUsedDetails',
  communication: 'communicationDetails',
  sensoryIssues: 'sensoryIssuesDetails',
  therapyActivities: 'therapyActivitiesDetails',
  injectables: 'injectablesDetails',
  dressings: 'dressingsDetails',
  vitalSigns: 'vitalSignsDetails',
  catheterCare: 'catheterCareDetails',
  patientCondition: 'patientConditionDetails',
  complications: 'complicationsDetails',
  appointmentAttended: 'appointmentAttendedDetails',
  prescriptionReceived: 'prescriptionReceivedDetails',
  medicalVisit: 'medicalVisitDetails',
  activityCompleted: 'activityCompletedDetails',
  incidents: 'incidentsDetails',
  bathroomVisits: 'bathroomVisitsDetails',
  hydration: 'hydrationDetails',
};

// ========== COMPONENTE PRINCIPAL ==========

interface CareReportFormProps {
  bookingId: string;
  serviceKey?: string;
  serviceName?: string;
  durationHours: number;
  dayNumber?: number;
  onReportSent?: () => void;
  isMultiDay?: boolean;
  totalDays?: number;
}

export function CareReportForm({
  bookingId,
  serviceKey,
  serviceName,
  durationHours,
  dayNumber = 1,
  onReportSent,
  isMultiDay,
  totalDays = 1,
}: CareReportFormProps) {
  const [content, setContent] = useState('');
  const [checklistData, setChecklistData] = useState<Record<string, any>>({});
  const [painLevel, setPainLevel] = useState(0);
  const [patientMood, setPatientMood] = useState<number | null>(null);
  const [healthObservations, setHealthObservations] = useState('');
  const [careActivities, setCareActivities] = useState<string[]>([]);
  const [activityInput, setActivityInput] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  const checklistConfig = useMemo(() => {
    if (serviceKey && SERVICE_CHECKLIST_CONFIG[serviceKey]) {
      return SERVICE_CHECKLIST_CONFIG[serviceKey];
    }
    return DEFAULT_CHECKLIST_CONFIG;
  }, [serviceKey]);

  const canSubmit = content.trim().length > 0;

  const updateChecklistField = (key: string, value: any) => {
    setChecklistData((prev) => ({ ...prev, [key]: { ...prev[key], value } }));
  };

  const updateChecklistDetails = (key: string, details: string) => {
    setChecklistData((prev) => ({ ...prev, [key]: { ...prev[key], details } }));
  };

  const handleAddActivity = () => {
    if (activityInput.trim()) {
      setCareActivities([...careActivities, activityInput.trim()]);
      setActivityInput('');
    }
  };

  const handleRemoveActivity = (index: number) => {
    setCareActivities(careActivities.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setContent('');
    setChecklistData({});
    setPainLevel(0);
    setPatientMood(null);
    setHealthObservations('');
    setCareActivities([]);
    setPhotos([]);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const payload: Record<string, any> = {
        bookingId,
        content,
        serviceType: serviceKey,
      };

      Object.entries(checklistData).forEach(([key, data]) => {
        if (data.value !== undefined && data.value !== null) {
          payload[key] = data.value;
          if (data.details) {
            const detailsFieldName = DETAILS_FIELD_MAPPING[key] || `${key}Details`;
            payload[detailsFieldName] = data.details;
          }
        }
      });

      if (painLevel > 0) payload.painLevel = painLevel;
      if (patientMood) payload.patientMood = patientMood;
      if (healthObservations) payload.healthObservations = healthObservations;
      if (careActivities.length > 0) payload.careActivities = careActivities;
      if (photos.length > 0) payload.photos = photos;
      if (isMultiDay && dayNumber) payload.dayNumber = dayNumber;

      await api.createFeedback(payload);

      setSuccess(true);
      resetForm();
      onReportSent?.();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar relatório');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header Compacto */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-white" />
            <h3 className="font-semibold text-white">
              {isMultiDay ? `Dia ${dayNumber}/${totalDays}` : 'Relatório'}
            </h3>
          </div>
          {serviceName && (
            <span className="text-blue-100 text-sm truncate max-w-[150px]">{serviceName}</span>
          )}
        </div>
      </div>

      <div className="p-4">
        {/* Mensagens */}
        {error && (
          <div className="flex items-center gap-2 p-2 mb-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <XCircle className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-2 mb-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>Enviado com sucesso!</span>
          </div>
        )}

        {/* Resumo do Dia */}
        <div className="mb-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Como foi o dia? Estado do paciente, observações..."
            className="w-full h-20 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
          />
        </div>

        {/* Checklist Horizontal */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <Activity className="w-4 h-4 text-blue-600" />
              {checklistConfig.title}
            </h4>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {checklistConfig.fields.slice(0, 6).map((field) => (
              <CompactChecklistItem
                key={field.key}
                field={field}
                value={checklistData[field.key]?.value}
                details={checklistData[field.key]?.details || ''}
                onValueChange={(val) => updateChecklistField(field.key, val)}
                onDetailsChange={(val) => updateChecklistDetails(field.key, val)}
              />
            ))}
          </div>

          {/* Mostrar mais campos se houver */}
          {checklistConfig.fields.length > 6 && (
            <>
              {showMoreOptions && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {checklistConfig.fields.slice(6).map((field) => (
                    <CompactChecklistItem
                      key={field.key}
                      field={field}
                      value={checklistData[field.key]?.value}
                      details={checklistData[field.key]?.details || ''}
                      onValueChange={(val) => updateChecklistField(field.key, val)}
                      onDetailsChange={(val) => updateChecklistDetails(field.key, val)}
                    />
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowMoreOptions(!showMoreOptions)}
                className="mt-2 text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                {showMoreOptions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {showMoreOptions ? 'Menos opções' : `Mais ${checklistConfig.fields.length - 6} opções`}
              </button>
            </>
          )}
        </div>

        {/* Linha: Dor + Humor */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Nível de Dor */}
          <div className="bg-gray-50 rounded-lg p-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-600 flex items-center gap-1">
                <Heart className="w-3 h-3 text-red-500" />
                Dor
              </span>
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                painLevel === 0 ? 'bg-green-100 text-green-700' :
                painLevel <= 3 ? 'bg-yellow-100 text-yellow-700' :
                painLevel <= 6 ? 'bg-orange-100 text-orange-700' :
                'bg-red-100 text-red-700'
              }`}>
                {painLevel}/10
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              value={painLevel}
              onChange={(e) => setPainLevel(parseInt(e.target.value))}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Humor */}
          <div className="bg-gray-50 rounded-lg p-2">
            <span className="text-xs font-medium text-gray-600 block mb-1">Estado</span>
            <div className="flex justify-between gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPatientMood(value)}
                  className={`flex-1 py-1 rounded transition-all ${
                    patientMood === value
                      ? 'bg-blue-500 text-white'
                      : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {value <= 2 ? <Frown className="w-4 h-4 mx-auto" /> :
                   value === 3 ? <Meh className="w-4 h-4 mx-auto" /> :
                   <Smile className="w-4 h-4 mx-auto" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Campos extras (colapsáveis) */}
        <details className="mb-4">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 flex items-center gap-1">
            <ChevronDown className="w-3 h-3" />
            Observações e atividades
          </summary>
          <div className="mt-2 space-y-3">
            {/* Observações */}
            <textarea
              value={healthObservations}
              onChange={(e) => setHealthObservations(e.target.value)}
              placeholder="Observações de saúde..."
              className="w-full h-16 px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
            />

            {/* Atividades */}
            <div className="flex gap-2">
              <input
                type="text"
                value={activityInput}
                onChange={(e) => setActivityInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddActivity())}
                placeholder="Atividade realizada..."
                className="flex-1 min-w-0 px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
              />
              <button
                type="button"
                onClick={handleAddActivity}
                disabled={!activityInput.trim()}
                className="p-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {careActivities.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {careActivities.map((activity, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs"
                  >
                    <Check className="w-3 h-3" />
                    {activity}
                    <button type="button" onClick={() => handleRemoveActivity(idx)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </details>

        {/* Botão Enviar */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !canSubmit}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Enviar Relatório
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ========== COMPONENTE ITEM CHECKLIST COMPACTO ==========

interface CompactChecklistItemProps {
  field: ChecklistField;
  value: any;
  details: string;
  onValueChange: (value: any) => void;
  onDetailsChange: (details: string) => void;
}

function CompactChecklistItem({
  field,
  value,
  details,
  onValueChange,
  onDetailsChange,
}: CompactChecklistItemProps) {
  const Icon = field.icon;
  const [showDetails, setShowDetails] = useState(false);

  const shouldShowDetails = () => {
    if (!field.hasDetails) return false;
    if (field.showDetailsWhen === 'always') return value !== undefined && value !== null;
    if (field.showDetailsWhen === 'positive') return value === true;
    if (field.showDetailsWhen === 'negative') return value === false;
    if (field.type === 'select') return value && value !== '';
    return false;
  };

  return (
    <div className="bg-gray-50 rounded-lg p-2">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
        <span className="text-xs font-medium text-gray-700 truncate">{field.label}</span>
      </div>

      {field.type === 'boolean' ? (
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onValueChange(true)}
            className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-all ${
              value === true
                ? 'bg-green-500 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {field.positiveText}
          </button>
          <button
            type="button"
            onClick={() => onValueChange(false)}
            className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-all ${
              value === false
                ? 'bg-orange-500 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {field.negativeText}
          </button>
        </div>
      ) : (
        <select
          value={value || ''}
          onChange={(e) => onValueChange(e.target.value)}
          className="w-full px-2 py-1 bg-white border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Selecione</option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )}

      {shouldShowDetails() && (
        <input
          type="text"
          placeholder={field.detailsPlaceholder}
          value={details}
          onChange={(e) => onDetailsChange(e.target.value)}
          className="mt-1.5 w-full px-2 py-1 bg-white border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      )}
    </div>
  );
}