import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CHAT_CLEANUP_JOB_ID, CHAT_JOBS, CHAT_QUEUE } from './chat.constants';

/** Intervalo do repeatable job: a cada hora */
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

@Injectable()
export class ChatProducer implements OnApplicationBootstrap {
  private readonly logger = new Logger(ChatProducer.name);

  constructor(
    @InjectQueue(CHAT_QUEUE)
    private readonly chatQueue: Queue,
  ) {}

  /**
   * Registrado no boot. O BullMQ faz upsert via `jobId` fixo —
   * chamar isso N vezes (ex: múltiplos pods) não cria duplicatas.
   */
  async onApplicationBootstrap() {
    await this.scheduleCleanup();
  }

  async scheduleCleanup(): Promise<void> {
    try {
      await this.chatQueue.add(
        CHAT_JOBS.CLEANUP_EXPIRED,
        {},
        {
          jobId: CHAT_CLEANUP_JOB_ID,
          repeat: { every: CLEANUP_INTERVAL_MS },
          attempts: 3,
          backoff: { type: 'exponential', delay: 30_000 }, // 30s, 60s, 120s
          removeOnComplete: { count: 5 },   // mantém os 5 últimos runs no histórico
          removeOnFail: { age: 60 * 60 * 24 * 3 }, // mantém falhas por 3 dias
        },
      );

      this.logger.log(
        `📅 Repeatable job registrado: ${CHAT_JOBS.CLEANUP_EXPIRED} (a cada 1h)`,
      );
    } catch (err: any) {
      // Não bloqueia o boot — loga e continua
      this.logger.error(
        `Falha ao registrar repeatable job de limpeza de chats: ${err.message}`,
      );
    }
  }
}
