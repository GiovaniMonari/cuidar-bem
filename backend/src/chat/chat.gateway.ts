import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  private async authenticateSocket(client: Socket) {
    const authToken = client.handshake.auth?.token;
    const headerToken = client.handshake.headers.authorization?.replace('Bearer ', '');
    const token = authToken || headerToken;

    if (!token) {
      throw new WsException('Autenticação necessária para usar o chat');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      const user = await this.usersService.findRawById(payload.userId);

      if (!user || user.moderationStatus === 'banned' || !user.isActive) {
        throw new WsException('Sua conta não está autorizada a usar o chat');
      }

      return { userId: payload.userId };
    } catch (error) {
      throw new WsException('Sessão inválida para o chat');
    }
  }

  @SubscribeMessage('joinConversation')
  async handleJoinConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const auth = await this.authenticateSocket(client);
    await this.chatService.assertConversationParticipant(
      data.conversationId,
      auth.userId,
    );
    client.join(data.conversationId);
    return { joined: true };
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody()
    data: {
      conversationId: string;
      content: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const auth = await this.authenticateSocket(client);
    const content = data.content?.trim();

    if (!content) {
      throw new WsException('Mensagem vazia não é permitida');
    }

    const message = await this.chatService.sendMessage(
      data.conversationId,
      auth.userId,
      content,
    );

    this.server.to(data.conversationId).emit('newMessage', message);
    return message;
  }
}
