import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Job } from 'bullmq';
import { Model } from 'mongoose';
import {
  Conversation,
  ConversationDocument,
} from '../schemas/conversation.schema';
import { CHAT_JOBS, CHAT_QUEUE } from './chat.constants';

/** Horas após o término do booking para fechar o chat */
const EXPIRATION_TOLERANCE_HOURS = 24;

@Processor(CHAT_QUEUE)
export class ChatWorker extends WorkerHost {
  private readonly logger = new Logger(ChatWorker.name);

  constructor(
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel('Booking')
    private readonly bookingModel: Model<any>,
  ) {
    super();
  }

  // ─── Dispatcher ─────────────────────────────────────────────────

  async process(job: Job): Promise<void> {
    this.logger.log(`⚙️  Processando job [${job.name}] id=${job.id}`);

    if (job.name === CHAT_JOBS.CLEANUP_EXPIRED) {
      await this.handleCleanupExpired();
      return;
    }

    this.logger.warn(`Job desconhecido ignorado: ${job.name}`);
  }

  // ─── Handler ────────────────────────────────────────────────────

  private async handleCleanupExpired(): Promise<void> {
    const now = new Date();
    const expirationThreshold = new Date(
      now.getTime() - EXPIRATION_TOLERANCE_HOURS * 60 * 60 * 1000,
    );

    this.logger.log('🔍 Verificando chats expirados...');

    // Busca em lote — evita cursor aberto por longos períodos
    const activeConversations = await this.conversationModel
      .find({ isActive: true })
      .lean();

    let closedCount = 0;

    for (const conversation of activeConversations) {
      // 1. Há algum booking ativo para este par cliente/cuidador?
      const activeBookings = await this.bookingModel
        .find({
          clientId: conversation.clientId,
          status: { $in: ['pending', 'confirmed', 'in_progress'] },
        })
        .populate({
          path: 'caregiverId',
          match: { userId: conversation.caregiverUserId },
        })
        .lean();

      const hasActiveBooking = activeBookings.some((b) => b.caregiverId !== null);

      if (hasActiveBooking) {
        // Par ainda tem serviço ativo — não fechar
        continue;
      }

      // 2. O último booking concluído já passou da janela de tolerância?
      const lastBooking = await this.bookingModel
        .findOne({ clientId: conversation.clientId, status: 'completed' })
        .populate({
          path: 'caregiverId',
          match: { userId: conversation.caregiverUserId },
        })
        .sort({ endDate: -1 })
        .lean() as any;

      if (
        lastBooking &&
        lastBooking.caregiverId !== null &&
        new Date(lastBooking.endDate) < expirationThreshold
      ) {
        await this.conversationModel.findByIdAndUpdate(conversation._id, {
          isActive: false,
          closedAt: now,
          closedReason: 'expired',
        });

        closedCount++;
        this.logger.log(`🔒 Chat expirado fechado: ${conversation._id}`);
      }
    }

    this.logger.log(
      `✅ Limpeza concluída — ${closedCount} chat(s) fechado(s) de ${activeConversations.length} ativo(s)`,
    );
  }
}
