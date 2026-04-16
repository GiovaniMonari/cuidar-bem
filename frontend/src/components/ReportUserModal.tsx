'use client';

import { useState } from 'react';
import { AlertTriangle, Loader2, ShieldAlert, X } from 'lucide-react';
import { api } from '@/services/api';
import { PlatformReportReason, PlatformReportSource } from '@/types';

const REASONS: Array<{
  value: PlatformReportReason;
  label: string;
  helper: string;
}> = [
  {
    value: 'inappropriate_behavior',
    label: 'Comportamento inadequado',
    helper: 'Assédio, invasão de limites ou postura inadequada.',
  },
  {
    value: 'delay_or_no_show',
    label: 'Atraso ou não comparecimento',
    helper: 'Atrasos relevantes ou ausência no atendimento combinado.',
  },
  {
    value: 'offensive_language',
    label: 'Linguagem ofensiva',
    helper: 'Agressões verbais, ameaças ou ofensas no contato.',
  },
  {
    value: 'fraud_attempt',
    label: 'Tentativa de fraude',
    helper: 'Pedido de pagamento externo, golpe ou manipulação.',
  },
  {
    value: 'other',
    label: 'Outro',
    helper: 'Use quando o caso não se encaixar nas opções acima.',
  },
];

interface ReportUserModalProps {
  open: boolean;
  onClose: () => void;
  source: PlatformReportSource;
  bookingId?: string;
  conversationId?: string;
  reportedUserName: string;
  contextLabel: string;
  onReported?: () => void;
}

export function ReportUserModal({
  open,
  onClose,
  source,
  bookingId,
  conversationId,
  reportedUserName,
  contextLabel,
  onReported,
}: ReportUserModalProps) {
  const [reason, setReason] = useState<PlatformReportReason>('inappropriate_behavior');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  if (!open) return null;

  const requiresDescription = reason === 'other';

  const handleSubmit = async () => {
    setFeedback('');

    if (requiresDescription && description.trim().length < 5) {
      setFeedback('Descreva melhor o motivo para continuar.');
      return;
    }

    setLoading(true);
    try {
      await api.createPlatformReport({
        source,
        bookingId,
        conversationId,
        reason,
        description: description.trim() || undefined,
      });
      setFeedback('Reportagem registrada. A equipe administrativa foi notificada.');
      onReported?.();
      setTimeout(() => {
        setDescription('');
        setReason('inappropriate_behavior');
        onClose();
      }, 900);
    } catch (error: any) {
      setFeedback(error.message || 'Não foi possível registrar a reportagem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/55 px-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl flex flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-950 px-6 py-5 text-white">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-100">
              <ShieldAlert className="h-3.5 w-3.5" />
              Segurança
            </div>
            <h3 className="mt-3 text-xl font-semibold">
              Reportar {reportedUserName}
            </h3>
            <p className="mt-1 text-sm text-slate-300">
              Contexto: {contextLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 p-2 text-slate-200 transition-colors hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-6 overflow-y-auto">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            A reportagem fica disponível para revisão manual e pode gerar observação ou banimento automático conforme recorrência e histórico.
          </div>

          <div className="space-y-3">
            {REASONS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setReason(item.value)}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
                  reason === item.value
                    ? 'border-rose-300 bg-rose-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{item.label}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.helper}</p>
                  </div>
                  <div
                    className={`h-4 w-4 rounded-full border ${
                      reason === item.value
                        ? 'border-rose-500 bg-rose-500'
                        : 'border-slate-300'
                    }`}
                  />
                </div>
              </button>
            ))}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Descrição complementar {requiresDescription ? '(obrigatória)' : '(opcional)'}
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Descreva com objetividade o que aconteceu, incluindo horário, contexto e qualquer detalhe relevante."
              className="min-h-[132px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition-all focus:border-primary-400 focus:ring-4 focus:ring-primary-100"
            />
          </div>

          {feedback && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                <span>{feedback}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-white"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
            Enviar reportagem
          </button>
        </div>
      </div>
    </div>
  );
}
