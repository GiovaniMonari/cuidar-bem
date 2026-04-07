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
    console.log('booking encontrado?', !!booking);

    if (!booking) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    const caregiver = booking.caregiverId as any;
    const client = booking.clientId as any;

    const clientId = client?._id?.toString();
    const caregiverUserId = caregiver?.userId?._id?.toString();

    console.log('clientId:', clientId);
    console.log('caregiverUserId:', caregiverUserId);

    if (!clientId || !caregiverUserId) {
      throw new NotFoundException('Participantes da conversa não encontrados');
    }

    const isParticipant =
      String(clientId) === String(userId) ||
      String(caregiverUserId) === String(userId);

    console.log('isParticipant:', isParticipant);

    if (!isParticipant) {
      throw new ForbiddenException('Você não participa desta conversa');
    }

    try {
      const conversation = await this.conversationModel.findOneAndUpdate(
        { bookingId: booking._id },
        {
          $setOnInsert: {
            bookingId: booking._id,
            clientId: client._id,
            caregiverUserId: caregiver.userId._id,
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

      console.log('✅ conversa criada/encontrada:', conversation?._id);

      return conversation;
    } catch (error: any) {
      console.error('❌ erro ao criar conversa:', error);

      if (error.code === 11000) {
        const existing = await this.conversationModel.findOne({
          bookingId: booking._id,
        });
        if (existing) {
          console.log('♻️ conversa já existia:', existing._id);
          return existing;
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
      conversation.clientId.toString() === String(senderId) ||
      conversation.caregiverUserId.toString() === String(senderId);

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
      conversation.clientId.toString() === String(userId) ||
      conversation.caregiverUserId.toString() === String(userId);

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

    console.log(
      '💬 conversationsWithUnread:',
      JSON.stringify(conversationsWithUnread, null, 2),
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