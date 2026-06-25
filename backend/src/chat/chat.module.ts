// chat.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { Conversation, ConversationSchema } from './schemas/conversation.schema';
import { Message, MessageSchema } from './schemas/message.schema';
import { Booking, BookingSchema } from 'src/bookings/schemas/booking.schema';
import { BookingsModule } from 'src/bookings/bookings.module';
import { UsersModule } from 'src/users/users.module';
import { RedisModule } from 'src/redis/redis.module';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { AuthModule } from 'src/auth/auth.module';
import { ChatProducer } from './queues/chat.producer';
import { ChatWorker } from './queues/chat.worker';
import { CHAT_QUEUE } from './queues/chat.constants';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Booking.name, schema: BookingSchema },
    ]),
    BullModule.registerQueue({
      name: CHAT_QUEUE,
      defaultJobOptions: {
        removeOnComplete: { count: 5 },
        removeOnFail: { age: 60 * 60 * 24 * 3 },
      },
    }),
    forwardRef(() => BookingsModule),
    UsersModule,
    RedisModule,
    AuthModule,
  ],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService, ChatProducer, ChatWorker],
  exports: [ChatService],
})
export class ChatModule {}