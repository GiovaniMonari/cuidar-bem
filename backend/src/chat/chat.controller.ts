import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('booking/:bookingId')
  getOrCreateConversation(@Param('bookingId') bookingId: string, @Request() req) {
    return this.chatService.getOrCreateConversation(bookingId, req.user.userId);
  }

  @Get('conversations')
  getConversations(@Request() req) {
    return this.chatService.getUserConversations(req.user.userId);
  }

  @Get('messages/:conversationId')
  async getMessages(@Param('conversationId') conversationId: string, @Request() req) {
    await this.chatService.markMessagesAsRead(conversationId, req.user.userId);
    return this.chatService.getMessages(conversationId, req.user.userId);
  }
}