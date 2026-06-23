import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { AdminGuard } from '../auth/admin.guard';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';
import { Caregiver, CaregiverSchema } from '../caregivers/schemas/caregiver.schema';
import { Conversation, ConversationSchema } from '../chat/schemas/conversation.schema';
import { Message, MessageSchema } from '../chat/schemas/message.schema';
import { Feedback, FeedbackSchema } from '../feedback/schemas/feedback.schema';
import { ModerationService } from './moderation.service';
import { ReportsController } from './reports.controller';
import { AdminController } from './admin.controller';
import { PlatformReport, PlatformReportSchema } from './schemas/platform-report.schema';
import { AdminActionLog, AdminActionLogSchema } from './schemas/admin-action-log.schema';
import { RedisModule } from '../redis/redis.module';
import { ModerationProducer } from './queues/moderation.producer';
import { ModerationWorker } from './queues/moderation.worker';
import { MODERATION_QUEUE } from './queues/moderation.constants';
import { RedisCacheService } from 'src/redis/redis-cache.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Booking.name, schema: BookingSchema },
      { name: Caregiver.name, schema: CaregiverSchema },
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Feedback.name, schema: FeedbackSchema },
      { name: PlatformReport.name, schema: PlatformReportSchema },
      { name: AdminActionLog.name, schema: AdminActionLogSchema },
    ]),
    BullModule.registerQueue({ name: MODERATION_QUEUE }),
    RedisModule,
  ],
  controllers: [ReportsController, AdminController],
  providers: [ModerationService, ModerationProducer, ModerationWorker, AdminGuard, RedisCacheService],
  exports: [ModerationService],
})
export class ModerationModule {}