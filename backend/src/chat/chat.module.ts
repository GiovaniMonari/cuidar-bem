// chat.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatCleanupService } from './chat-cleanup.service';
import { Conversation, ConversationSchema } from './schemas/conversation.schema';
import { Message, MessageSchema } from './schemas/message.schema';
import { BookingsModule } from '../bookings/bookings.module';
import { UsersModule } from '../users/users.module';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';

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
  ],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService, ChatCleanupService],
  exports: [ChatService],
})
export class ChatModule {}