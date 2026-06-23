/** Nome da fila BullMQ para moderação automática */
export const MODERATION_QUEUE = 'moderation';

/** Nomes dos jobs dentro da fila */
export const MODERATION_JOBS = {
  EVALUATE_REPORT: 'evaluate-report',
} as const;

export type ModerationJobName =
  (typeof MODERATION_JOBS)[keyof typeof MODERATION_JOBS];

/** Payload do job evaluate-report */
export interface EvaluateReportJobData {
  reportId: string;
}