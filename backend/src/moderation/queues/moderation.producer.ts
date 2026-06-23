import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  EvaluateReportJobData,
  MODERATION_JOBS,
  MODERATION_QUEUE,
} from './moderation.constants';

@Injectable()
export class ModerationProducer {
  private readonly logger = new Logger(ModerationProducer.name);

  constructor(
    @InjectQueue(MODERATION_QUEUE)
    private readonly moderationQueue: Queue<EvaluateReportJobData>,
  ) {}

  /**
   * Enfileira a avaliação automática de um report recém-criado.
   * Fire-and-forget: o createReport() retorna imediatamente após isso.
   *
   * Estratégia de retry:
   *   tentativa 1 →  5s de espera
   *   tentativa 2 → 30s de espera
   *   tentativa 3 →  2min de espera
   */
  async enqueueEvaluateReport(reportId: string): Promise<void> {
    try {
      await this.moderationQueue.add(
        MODERATION_JOBS.EVALUATE_REPORT,
        { reportId },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5_000, // 5s base → 5s, 30s, 2min
          },
          removeOnComplete: { age: 60 * 60 * 24 },    // mantém 24h no histórico
          removeOnFail: { age: 60 * 60 * 24 * 7 },    // mantém 7 dias para debug
        },
      );

      this.logger.log(`📋 Job enfileirado: evaluate-report ${reportId}`);
    } catch (err: any) {
      // Se o Redis cair, logamos mas não bloqueamos o fluxo principal.
      // O report já foi salvo no MongoDB; a avaliação automática ficará pendente.
      this.logger.error(
        `Falha ao enfileirar evaluate-report ${reportId}: ${err.message}`,
      );
    }
  }
}