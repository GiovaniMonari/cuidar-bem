import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from './schemas/conversation.schema';
import { Message, MessageDocument } from './schemas/message.schema';
import { BookingsService } from '../bookings/bookings.service';

@Injectable()
export class ChatService {
  private conversationLocks = new Map<string, Promise<ConversationDocument>>();

  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name)
    private messageModel: Model<MessageDocument>,
    @Inject(forwardRef(() => BookingsService))
    private bookingsService: BookingsService,
  ) {}

  async getOrCreateConversation(bookingId: string, userId: string) {
    console.log('💬 getOrCreateConversation chamado');
    console.log('bookingId:', bookingId);
    console.log('userId:', userId);

    const booking = await this.bookingsService.findOne(bookingId);

    if (!booking) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    const caregiver = booking.caregiverId as any;
    const client = booking.clientId as any;

    // ⬇️ CORREÇÃO: Extrair e converter para string primeiro
    const clientIdStr = client?._id?.toString();
    const caregiverUserIdStr = caregiver?.userId?._id?.toString();

    console.log('clientIdStr:', clientIdStr);
    console.log('caregiverUserIdStr:', caregiverUserIdStr);

    if (!clientIdStr || !caregiverUserIdStr) {
      throw new NotFoundException('Participantes da conversa não encontrados');
    }

    const isParticipant =
      clientIdStr === userId || caregiverUserIdStr === userId;

    if (!isParticipant) {
      throw new ForbiddenException('Você não participa desta conversa');
    }

    // Lock por par cliente/cuidador
    const lockKey = `${clientIdStr}_${caregiverUserIdStr}`;

    const existingLock = this.conversationLocks.get(lockKey);
    if (existingLock) {
      console.log(`⏳ Aguardando criação em andamento para par ${lockKey}`);
      return existingLock;
    }

    const promise = this._getOrCreateConversation(
      clientIdStr,
      caregiverUserIdStr,
      bookingId,
    ).finally(() => {
      this.conversationLocks.delete(lockKey);
    });

    this.conversationLocks.set(lockKey, promise);
    return promise;
  }

  private async _getOrCreateConversation(
    clientIdStr: string,
    caregiverUserIdStr: string,
    bookingIdStr: string,
  ) {
    // ⬇️ CORREÇÃO: Criar ObjectId aqui dentro
    const clientId = new Types.ObjectId(clientIdStr);
    const caregiverUserId = new Types.ObjectId(caregiverUserIdStr);
    const bookingId = new Types.ObjectId(bookingIdStr);

    console.log('🔍 Buscando conversa existente...');
    console.log('clientId (ObjectId):', clientId);
    console.log('caregiverUserId (ObjectId):', caregiverUserId);

    // ⬇️ BUSCA DIRETA - Deve encontrar a conversa existente
    const existing = await this.conversationModel.findOne({
      clientId: clientId,
      caregiverUserId: caregiverUserId,
    });

    if (existing) {
      console.log('✅ Conversa já existe:', existing._id);
      return existing;
    }

    console.log('🆕 Nenhuma conversa encontrada, criando nova...');

    try {
      const conversation = await this.conversationModel.findOneAndUpdate(
        {
          clientId: clientId,
          caregiverUserId: caregiverUserId,
        },
        {
          $setOnInsert: {
            clientId: clientId,
            caregiverUserId: caregiverUserId,
            bookingId: bookingId,
            isActive: true,
            lastMessage: '',
            lastMessageAt: null,
          },
        },
        {
          new: true,
          upsert: true,
        },
      );

      console.log('✅ Conversa criada:', conversation?._id);
      return conversation;
    } catch (error: any) {
      console.error('❌ Erro ao criar conversa:', error.message);

      // Fallback: Se der E11000, busca novamente
      if (error.code === 11000) {
        console.log('🔄 Conflito de duplicação, buscando existente...');

        const fallback = await this.conversationModel.findOne({
          clientId: clientId,
          caregiverUserId: caregiverUserId,
        });

        if (fallback) {
          console.log('♻️ Conversa encontrada após conflito:', fallback._id);
          return fallback;
        }
      }

      throw error;
    }
  }

  async sendMessage(conversationId: string, senderId: string, content: string) {
    const conversation = await this.conversationModel.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada');
    }

    const isParticipant =
      conversation.clientId.toString() === senderId ||
      conversation.caregiverUserId.toString() === senderId;

    if (!isParticipant) {
      throw new ForbiddenException('Sem permissão para enviar mensagem');
    }

    const message = await this.messageModel.create({
      conversationId: new Types.ObjectId(conversationId),
      senderId: new Types.ObjectId(senderId),
      content,
      isRead: false,
    });

    conversation.lastMessage = content;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    return this.messageModel
      .findById(message._id)
      .populate('senderId', 'name avatar role');
  }

  async getMessages(conversationId: string, userId: string) {
    const conversation = await this.conversationModel.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada');
    }

    const isParticipant =
      conversation.clientId.toString() === userId ||
      conversation.caregiverUserId.toString() === userId;

    if (!isParticipant) {
      throw new ForbiddenException('Sem acesso a esta conversa');
    }

    return this.messageModel
      .find({ conversationId: new Types.ObjectId(conversationId) })
      .populate('senderId', 'name avatar role')
      .sort({ createdAt: 1 });
  }

  async getUserConversations(userId: string) {
    const objectUserId = new Types.ObjectId(userId);

    const conversations = await this.conversationModel
      .find({
        $or: [
          { clientId: objectUserId },
          { caregiverUserId: objectUserId },
        ],
      })
      .populate('bookingId')
      .populate('clientId', 'name avatar role phone email')
      .populate('caregiverUserId', 'name avatar role phone email')
      .sort({ lastMessageAt: -1, updatedAt: -1 });

    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conversation) => {
        const unreadCount = await this.messageModel.countDocuments({
          conversationId: conversation._id,
          senderId: { $ne: objectUserId },
          isRead: false,
        });

        return {
          ...conversation.toObject(),
          unreadCount,
        };
      }),
    );

    return conversationsWithUnread;
  }

  async markMessagesAsRead(conversationId: string, userId: string) {
    const conversation = await this.conversationModel.findById(conversationId);
    if (!conversation) return;

    const objectUserId = new Types.ObjectId(userId);

    await this.messageModel.updateMany(
      {
        conversationId: new Types.ObjectId(conversationId),
        senderId: { $ne: objectUserId },
        isRead: false,
      },
      { isRead: true },
    );
  }
}