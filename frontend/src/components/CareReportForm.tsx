'use client';

import { useMemo, useEffect } from 'react';
import { FileText, Send, Loader2, Activity } from 'lucide-react';
import { useCareReportForm } from '@/hooks/useCareReportForm';
import { ChecklistSection, ChecklistField } from './CareReport/ChecklistSection';
import { ActivitySection } from './CareReport/ActivitySection';
import { MoodSection } from './CareReport/MoodSection';
import { toast } from 'sonner';
import { 
  Pill, UtensilsCrossed, Droplets, Bath, Moon, Brain, 
  RotateCcw, Shield, Zap, AlertTriangle, Clock, Move, 
  Footprints, MessageCircle, Syringe, Scissors, Thermometer, 
  Stethoscope, Heart, Check 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';

// ========== CONFIGURAÇÃO DOS CAMPOS POR TIPO DE SERVIÇO ==========
const COMMON_FIELDS: ChecklistField[] = [
  { key: 'tookMedication', label: 'Medicação', icon: Pill, type: 'boolean', positiveText: 'Tomou', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Quais medicamentos...', showDetailsWhen: 'always' },
  { key: 'ate', label: 'Alimentação', icon: UtensilsCrossed, type: 'boolean', positiveText: 'Bem', negativeText: 'Pouco', hasDetails: true, detailsPlaceholder: 'O que comeu...', showDetailsWhen: 'always' },
  { key: 'hydration', label: 'Hidratação', icon: Droplets, type: 'boolean', positiveText: 'Adequada', negativeText: 'Insuficiente' },
];

const SERVICE_CHECKLIST_CONFIG: Record<string, { title: string; fields: ChecklistField[] }> = {
  cuidado_basico_idoso: {
    title: 'Cuidados Básicos',
    fields: [
      ...COMMON_FIELDS,
      { key: 'hygiene', label: 'Higiene', icon: Bath, type: 'boolean' as const, positiveText: 'Realizada', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Detalhes...', showDetailsWhen: 'positive' as const },
      { key: 'sleptWell', label: 'Sono', icon: Moon, type: 'boolean' as const, positiveText: 'Bem', negativeText: 'Mal', hasDetails: true, detailsPlaceholder: 'Detalhes...', showDetailsWhen: 'negative' as const },
      { key: 'behavior', label: 'Comportamento', icon: Brain, type: 'select' as const, options: [{ value: 'excelente', label: 'Excelente' }, { value: 'bom', label: 'Bom' }, { value: 'normal', label: 'Normal' }, { value: 'agitado', label: 'Agitado' }, { value: 'agressivo', label: 'Agressivo' }], hasDetails: true, detailsPlaceholder: 'Observações...' },
    ],
  },
  cuidado_acamado: {
    title: 'Cuidados Acamado',
    fields: [
      ...COMMON_FIELDS,
      { key: 'bathInBed', label: 'Banho no Leito', icon: Bath, type: 'boolean' as const, positiveText: 'Realizado', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Observações...', showDetailsWhen: 'positive' as const },
      { key: 'positionChange', label: 'Mudança Decúbito', icon: RotateCcw, type: 'boolean' as const, positiveText: 'Realizada', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Horários...', showDetailsWhen: 'positive' as const },
      { key: 'skinCondition', label: 'Pele', icon: Shield, type: 'select' as const, options: [{ value: 'normal', label: 'Normal' }, { value: 'ressecada', label: 'Ressecada' }, { value: 'avermelhada', label: 'Avermelhada' }, { value: 'lesao', label: 'Com lesão' }], hasDetails: true, detailsPlaceholder: 'Localização...' },
      { key: 'diaperChange', label: 'Troca Fralda', icon: Check, type: 'boolean' as const, positiveText: 'Realizada', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Quantidade...', showDetailsWhen: 'positive' as const },
      { key: 'sleptWell', label: 'Sono', icon: Moon, type: 'boolean' as const, positiveText: 'Bem', negativeText: 'Agitado', hasDetails: true, detailsPlaceholder: 'Detalhes...', showDetailsWhen: 'negative' as const },
    ],
  },
  cuidado_alzheimer: {
    title: 'Cuidados Alzheimer',
    fields: [
      ...COMMON_FIELDS,
      { key: 'cognitiveStimulation', label: 'Estim. Cognitiva', icon: Brain, type: 'boolean' as const, positiveText: 'Realizada', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Atividades...', showDetailsWhen: 'positive' as const },
      { key: 'orientation', label: 'Orientação', icon: Brain, type: 'select' as const, options: [{ value: 'orientado', label: 'Orientado' }, { value: 'parcial', label: 'Parcial' }, { value: 'desorientado', label: 'Desorientado' }], hasDetails: true, detailsPlaceholder: 'Observações...' },
      { key: 'agitation', label: 'Agitação', icon: Zap, type: 'select' as const, options: [{ value: 'calmo', label: 'Calmo' }, { value: 'leve', label: 'Leve' }, { value: 'moderada', label: 'Moderada' }, { value: 'intensa', label: 'Intensa' }], hasDetails: true, detailsPlaceholder: 'Gatilhos...' },
      { key: 'wandering', label: 'Tentativa Fuga', icon: AlertTriangle, type: 'boolean' as const, positiveText: 'Não houve', negativeText: 'Houve', hasDetails: true, detailsPlaceholder: 'O que ocorreu...', showDetailsWhen: 'negative' as const },
      { key: 'routineFollowed', label: 'Rotina', icon: Clock, type: 'boolean' as const, positiveText: 'Seguida', negativeText: 'Alterada', hasDetails: true, detailsPlaceholder: 'Alterações...', showDetailsWhen: 'negative' as const },
    ],
  },
  pernoite_idoso: {
    title: 'Relatório Noturno',
    fields: [
      { key: 'tookMedication', label: 'Medicação Noturna', icon: Pill, type: 'boolean' as const, positiveText: 'Tomou', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Horários...', showDetailsWhen: 'always' as const },
      { key: 'sleptWell', label: 'Sono', icon: Moon, type: 'select' as const, options: [{ value: 'otimo', label: 'Dormiu bem' }, { value: 'bom', label: 'Acordou 1-2x' }, { value: 'regular', label: 'Agitado' }, { value: 'ruim', label: 'Não dormiu' }], hasDetails: true, detailsPlaceholder: 'Horários que acordou...' },
      { key: 'bathroomVisits', label: 'Idas Banheiro', icon: Moon, type: 'boolean' as const, positiveText: 'Sim', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Quantidade...', showDetailsWhen: 'positive' as const },
      { key: 'diaperChange', label: 'Troca Fralda', icon: Check, type: 'boolean' as const, positiveText: 'Realizada', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Horários...', showDetailsWhen: 'positive' as const },
      { key: 'positionChange', label: 'Mudança Posição', icon: RotateCcw, type: 'boolean' as const, positiveText: 'Realizada', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Horários...', showDetailsWhen: 'positive' as const },
      { key: 'incidents', label: 'Intercorrências', icon: AlertTriangle, type: 'boolean' as const, positiveText: 'Não houve', negativeText: 'Houve', hasDetails: true, detailsPlaceholder: 'Descreva...', showDetailsWhen: 'negative' as const },
    ],
  },
  cuidado_pcd_fisico: {
    title: 'Cuidados PcD Física',
    fields: [
      ...COMMON_FIELDS,
      { key: 'hygiene', label: 'Higiene', icon: Bath, type: 'boolean' as const, positiveText: 'Realizada', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Detalhes...', showDetailsWhen: 'positive' as const },
      { key: 'transfers', label: 'Transferências', icon: Move, type: 'boolean' as const, positiveText: 'Realizadas', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Dificuldades...', showDetailsWhen: 'positive' as const },
      { key: 'physiotherapy', label: 'Fisioterapia', icon: Activity, type: 'boolean' as const, positiveText: 'Realizados', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Exercícios...', showDetailsWhen: 'positive' as const },
      { key: 'mobility', label: 'Locomoção', icon: Footprints, type: 'select' as const, options: [{ value: 'independente', label: 'Independente' }, { value: 'auxilio_leve', label: 'Auxílio leve' }, { value: 'auxilio_total', label: 'Auxílio total' }, { value: 'nao_locomoveu', label: 'Não locomoveu' }], hasDetails: true, detailsPlaceholder: 'Distâncias...' },
      { key: 'equipmentUsed', label: 'Equipamentos', icon: Check, type: 'boolean' as const, positiveText: 'Usados', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Quais...', showDetailsWhen: 'positive' as const },
    ],
  },
  cuidado_pcd_intelectual: {
    title: 'Cuidados PcD Intelectual',
    fields: [
      ...COMMON_FIELDS,
      { key: 'routineFollowed', label: 'Rotina', icon: Clock, type: 'boolean' as const, positiveText: 'Seguida', negativeText: 'Alterada', hasDetails: true, detailsPlaceholder: 'Alterações...', showDetailsWhen: 'negative' as const },
      { key: 'communication', label: 'Comunicação', icon: MessageCircle, type: 'select' as const, options: [{ value: 'boa', label: 'Boa' }, { value: 'regular', label: 'Regular' }, { value: 'dificil', label: 'Difícil' }], hasDetails: true, detailsPlaceholder: 'Formas usadas...' },
      { key: 'behavior', label: 'Comportamento', icon: Brain, type: 'select' as const, options: [{ value: 'excelente', label: 'Excelente' }, { value: 'bom', label: 'Bom' }, { value: 'regular', label: 'Regular' }, { value: 'crises', label: 'Com crises' }], hasDetails: true, detailsPlaceholder: 'Gatilhos, manejo...' },
      { key: 'sensoryIssues', label: 'Questões Sensoriais', icon: Zap, type: 'boolean' as const, positiveText: 'Não houve', negativeText: 'Houve', hasDetails: true, detailsPlaceholder: 'O que ocorreu...', showDetailsWhen: 'negative' as const },
      { key: 'therapyActivities', label: 'Terapias', icon: Activity, type: 'boolean' as const, positiveText: 'Realizadas', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Quais...', showDetailsWhen: 'positive' as const },
    ],
  },
  enfermagem_domiciliar: {
    title: 'Procedimentos Enfermagem',
    fields: [
      { key: 'tookMedication', label: 'Medicação', icon: Pill, type: 'boolean' as const, positiveText: 'Administrada', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Medicamentos, via...', showDetailsWhen: 'always' as const },
      { key: 'injectables', label: 'Injetável', icon: Syringe, type: 'boolean' as const, positiveText: 'Aplicada', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Medicamento, local...', showDetailsWhen: 'positive' as const },
      { key: 'dressings', label: 'Curativos', icon: Scissors, type: 'boolean' as const, positiveText: 'Realizados', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Local, aspecto...', showDetailsWhen: 'positive' as const },
      { key: 'vitalSigns', label: 'Sinais Vitais', icon: Thermometer, type: 'boolean' as const, positiveText: 'Aferidos', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'PA, FC, Temp...', showDetailsWhen: 'positive' as const },
      { key: 'catheterCare', label: 'Sondas', icon: Check, type: 'boolean' as const, positiveText: 'Cuidados OK', negativeText: 'N/A', hasDetails: true, detailsPlaceholder: 'Tipo, aspecto...', showDetailsWhen: 'positive' as const },
      { key: 'patientCondition', label: 'Condição', icon: Stethoscope, type: 'select' as const, options: [{ value: 'estavel', label: 'Estável' }, { value: 'melhora', label: 'Melhora' }, { value: 'piora', label: 'Piora' }, { value: 'atencao', label: 'Atenção' }], hasDetails: true, detailsPlaceholder: 'Observações clínicas...' },
    ],
  },
  pos_operatorio: {
    title: 'Cuidados Pós-Op',
    fields: [
      { key: 'tookMedication', label: 'Medicação', icon: Pill, type: 'boolean' as const, positiveText: 'Tomou', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Analgésicos...', showDetailsWhen: 'always' as const },
      { key: 'dressings', label: 'Curativo', icon: Scissors, type: 'boolean' as const, positiveText: 'Realizado', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Aspecto, secreção...', showDetailsWhen: 'positive' as const },
      { key: 'ate', label: 'Alimentação', icon: UtensilsCrossed, type: 'boolean' as const, positiveText: 'Comeu', negativeText: 'Náusea', hasDetails: true, detailsPlaceholder: 'Dieta, tolerância...', showDetailsWhen: 'always' as const },
      { key: 'mobility', label: 'Mobilização', icon: Footprints, type: 'select' as const, options: [{ value: 'deambulou', label: 'Deambulou' }, { value: 'sentou', label: 'Sentou' }, { value: 'repouso', label: 'Repouso' }], hasDetails: true, detailsPlaceholder: 'Distância...' },
      { key: 'complications', label: 'Complicações', icon: AlertTriangle, type: 'boolean' as const, positiveText: 'Não houve', negativeText: 'Houve', hasDetails: true, detailsPlaceholder: 'Descreva...', showDetailsWhen: 'negative' as const },
      { key: 'vitalSigns', label: 'Sinais Vitais', icon: Thermometer, type: 'boolean' as const, positiveText: 'Normais', negativeText: 'Alterados', hasDetails: true, detailsPlaceholder: 'PA, FC, Temp...', showDetailsWhen: 'always' as const },
    ],
  },
  acompanhante_consulta: {
    title: 'Acompanhamento Consulta',
    fields: [
      { key: 'appointmentAttended', label: 'Consulta', icon: Stethoscope, type: 'boolean' as const, positiveText: 'Realizada', negativeText: 'Cancelada', hasDetails: true, detailsPlaceholder: 'Local, médico...', showDetailsWhen: 'always' as const },
      { key: 'tookMedication', label: 'Medicação', icon: Pill, type: 'boolean' as const, positiveText: 'Tomou', negativeText: 'N/A', hasDetails: true, detailsPlaceholder: 'Medicamentos...', showDetailsWhen: 'positive' as const },
      { key: 'ate', label: 'Alimentação', icon: UtensilsCrossed, type: 'boolean' as const, positiveText: 'Comeu', negativeText: 'Jejum', hasDetails: true, detailsPlaceholder: 'O que comeu...', showDetailsWhen: 'always' as const },
      { key: 'mobility', label: 'Locomoção', icon: Footprints, type: 'select' as const, options: [{ value: 'independente', label: 'Independente' }, { value: 'auxilio', label: 'Com auxílio' }, { value: 'cadeira', label: 'Cadeira' }], hasDetails: true, detailsPlaceholder: 'Observações...' },
      { key: 'prescriptionReceived', label: 'Receitas', icon: FileText, type: 'boolean' as const, positiveText: 'Recebidas', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Resumo...', showDetailsWhen: 'positive' as const },
    ],
  },
  acompanhante_hospital: {
    title: 'Acompanhamento Hospital',
    fields: [
      { key: 'tookMedication', label: 'Medicação', icon: Pill, type: 'boolean' as const, positiveText: 'Administrada', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Medicamentos...', showDetailsWhen: 'always' as const },
      { key: 'ate', label: 'Alimentação', icon: UtensilsCrossed, type: 'boolean' as const, positiveText: 'Comeu', negativeText: 'Não comeu', hasDetails: true, detailsPlaceholder: 'Dieta...', showDetailsWhen: 'always' as const },
      { key: 'hydration', label: 'Hidratação', icon: Droplets, type: 'boolean' as const, positiveText: 'Adequada', negativeText: 'Insuficiente', hasDetails: true, detailsPlaceholder: 'Soro, oral...', showDetailsWhen: 'always' as const },
      { key: 'hygiene', label: 'Higiene', icon: Bath, type: 'boolean' as const, positiveText: 'Realizada', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Banho...', showDetailsWhen: 'positive' as const },
      { key: 'medicalVisit', label: 'Visita Médica', icon: Stethoscope, type: 'boolean' as const, positiveText: 'Houve', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Informações...', showDetailsWhen: 'positive' as const },
      { key: 'patientCondition', label: 'Estado', icon: Heart, type: 'select' as const, options: [{ value: 'estavel', label: 'Estável' }, { value: 'melhora', label: 'Melhora' }, { value: 'piora', label: 'Piora' }, { value: 'critico', label: 'Crítico' }], hasDetails: true, detailsPlaceholder: 'Observações...' },
    ],
  },
  acompanhante_passeio: {
    title: 'Relatório Passeio',
    fields: [
      { key: 'activityCompleted', label: 'Atividade', icon: Check, type: 'boolean' as const, positiveText: 'Realizada', negativeText: 'Cancelada', hasDetails: true, detailsPlaceholder: 'Local, duração...', showDetailsWhen: 'always' as const },
      { key: 'ate', label: 'Alimentação', icon: UtensilsCrossed, type: 'boolean' as const, positiveText: 'Comeu', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'O que comeu...', showDetailsWhen: 'positive' as const },
      { key: 'hydration', label: 'Hidratação', icon: Droplets, type: 'boolean' as const, positiveText: 'Adequada', negativeText: 'Insuficiente' },
      { key: 'tookMedication', label: 'Medicação', icon: Pill, type: 'boolean' as const, positiveText: 'Tomou', negativeText: 'N/A', hasDetails: true, detailsPlaceholder: 'Medicamentos...', showDetailsWhen: 'positive' as const },
      { key: 'incidents', label: 'Intercorrências', icon: AlertTriangle, type: 'boolean' as const, positiveText: 'Não houve', negativeText: 'Houve', hasDetails: true, detailsPlaceholder: 'Descreva...', showDetailsWhen: 'negative' as const },
    ],
  },
};

const DEFAULT_CHECKLIST_CONFIG: { title: string; fields: ChecklistField[] } = {
  title: 'Cuidados do Dia',
  fields: [
    ...COMMON_FIELDS,
    { key: 'hygiene', label: 'Higiene', icon: Bath, type: 'boolean' as const, positiveText: 'Realizada', negativeText: 'Não', hasDetails: true, detailsPlaceholder: 'Detalhes...', showDetailsWhen: 'positive' as const },
    { key: 'sleptWell', label: 'Sono', icon: Moon, type: 'boolean' as const, positiveText: 'Bem', negativeText: 'Mal', hasDetails: true, detailsPlaceholder: 'Detalhes...', showDetailsWhen: 'negative' as const },
    { key: 'behavior', label: 'Comportamento', icon: Brain, type: 'select' as const, options: [{ value: 'excelente', label: 'Excelente' }, { value: 'bom', label: 'Bom' }, { value: 'normal', label: 'Normal' }, { value: 'agitado', label: 'Agitado' }, { value: 'agressivo', label: 'Agressivo' }], hasDetails: true, detailsPlaceholder: 'Observações...' },
  ],
};

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
  dayNumber = 1,
  onReportSent,
  isMultiDay,
  totalDays = 1,
}: CareReportFormProps) {
  const {
    form,
    loading,
    error,
    success,
    careActivities,
    checklistData,
    handleAddActivity,
    handleRemoveActivity,
    updateChecklistField,
    updateChecklistDetails,
    onSubmit,
  } = useCareReportForm({ bookingId, serviceKey, onSuccess: onReportSent });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = form;
  
  const painLevel = watch('painLevel') || 0;
  const patientMood = watch('patientMood');

  const checklistConfig = useMemo(() => {
    return (serviceKey && SERVICE_CHECKLIST_CONFIG[serviceKey]) || DEFAULT_CHECKLIST_CONFIG;
  }, [serviceKey]);

  useEffect(() => {
    if (success) {
      toast.success('Relatório enviado com sucesso!');
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  return (
    <Card className="shadow-sm border-gray-200 overflow-hidden">
      <CardHeader className="bg-primary-600 py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5" />
            {isMultiDay ? `Dia ${dayNumber}/${totalDays}` : 'Relatório Diário'}
          </CardTitle>
          {serviceName && (
            <span className="text-primary-100 text-xs font-medium px-2 py-1 bg-white/10 rounded-full truncate max-w-[150px]">
              {serviceName}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Content */}
          <div className="space-y-2">
            <Textarea
              {...register('content')}
              placeholder="Como foi o dia? Estado do paciente, observações gerais..."
              className={`h-24 bg-gray-50/50 ${errors.content ? 'border-red-400 focus-visible:ring-red-100' : ''}`}
            />
            {errors.content && (
              <p className="mt-1 text-xs text-red-500 font-medium">{errors.content.message}</p>
            )}
          </div>

          {/* Sections */}
          <div className="space-y-6 divide-y divide-gray-100">
            <ChecklistSection
              title={checklistConfig.title}
              fields={checklistConfig.fields}
              checklistData={checklistData}
              onValueChange={updateChecklistField}
              onDetailsChange={updateChecklistDetails}
            />

            <div className="pt-6">
              <MoodSection
                setValue={setValue}
                painLevel={painLevel}
                patientMood={patientMood}
                register={register}
              />
            </div>

            <div className="pt-6">
              <ActivitySection
                register={register}
                activities={careActivities}
                onAddActivity={handleAddActivity}
                onRemoveActivity={handleRemoveActivity}
              />
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full py-6 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Enviar Relatório
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}