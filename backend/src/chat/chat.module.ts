// chat.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Conversation, ConversationSchema } from './schemas/conversation.schema';
import { Message, MessageSchema } from './schemas/message.schema';
import { Booking, BookingSchema } from 'src/bookings/schemas/booking.schema';
import { ScheduleModule } from '@nestjs/schedule';
import { BookingsModule } from 'src/bookings/bookings.module';
import { UsersModule } from 'src/users/users.module';
import { RedisModule } from 'src/redis/redis.module';
import { ChatService } from './chat.service';
import { ChatCleanupService } from './chat-cleanup.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Booking.name, schema: BookingSchema },
    ]),
    ScheduleModule.forRoot(),
    forwardRef(() => BookingsModule),
    UsersModule,
    RedisModule,
    AuthModule
  ],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService, ChatCleanupService],
  exports: [ChatService],
})
export class ChatModule {}