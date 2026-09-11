import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Chat')
@ApiBearerAuth()
@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('booking/:bookingId')
  @ApiOperation({ summary: 'Abrir ou recuperar conversa de um agendamento' })
  @ApiParam({ name: 'bookingId', description: 'ID do agendamento da conversa' })
  getOrCreateConversation(@Param('bookingId') bookingId: string, @Request() req) {
    return this.chatService.getOrCreateConversation(bookingId, req.user.userId);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Listar conversas do usuário autenticado' })
  getConversations(@Request() req) {
    return this.chatService.getUserConversations(req.user.userId);
  }

  @Get('messages/:conversationId')
  @ApiOperation({ summary: 'Listar mensagens de uma conversa e marcá-las como lidas' })
  @ApiParam({ name: 'conversationId', description: 'ID da conversa' })
  async getMessages(@Param('conversationId') conversationId: string, @Request() req) {
    await this.chatService.markMessagesAsRead(conversationId, req.user.userId);
    return this.chatService.getMessages(conversationId, req.user.userId);
  }
}