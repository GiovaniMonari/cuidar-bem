// src/chat/chat-cleanup.service.ts
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from './schemas/conversation.schema';

@Injectable()
export class ChatCleanupService {
  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,
    @InjectModel('Booking')
    private bookingModel: Model<any>,
  ) {}

  // Executa a cada hora
  @Cron(CronExpression.EVERY_HOUR)
  async handleExpiredChats() {
    console.log('🕐 Verificando chats expirados...');

    const now = new Date();
    const toleranceHours = 24; // 24 horas após o término
    const expirationThreshold = new Date(now.getTime() - toleranceHours * 60 * 60 * 1000);

    // Buscar conversas ativas
    const activeConversations = await this.conversationModel.find({ isActive: true });

    for (const conversation of activeConversations) {
      // Verificar se há bookings ativos para este par
      const activeBookings = await this.bookingModel.find({
        clientId: conversation.clientId,
        status: { $in: ['pending', 'confirmed', 'in_progress'] },
      }).populate({
        path: 'caregiverId',
        match: { userId: conversation.caregiverUserId },
      });

      // Filtrar bookings que realmente pertencem a este cuidador
      const validBookings = activeBookings.filter(b => b.caregiverId !== null);

      if (validBookings.length === 0) {
        // Verificar se o último booking completado já passou do prazo
        const lastBooking = await this.bookingModel.findOne({
          clientId: conversation.clientId,
          status: 'completed',
        })
        .populate({
          path: 'caregiverId',
          match: { userId: conversation.caregiverUserId },
        })
        .sort({ endDate: -1 });

        if (lastBooking && lastBooking.caregiverId && new Date(lastBooking.endDate) < expirationThreshold) {
          // Fechar a conversa
          conversation.isActive = false;
          conversation.closedAt = now;
          conversation.closedReason = 'expired';
          await conversation.save();

          console.log(`🔒 Chat expirado fechado: ${conversation._id}`);
        }
      }
    }

    console.log('✅ Verificação de chats expirados concluída');
  }
}