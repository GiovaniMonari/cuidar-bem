import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WsException,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

// Estendemos a tipagem do Socket para guardar o userId de forma segura
interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
  };
}

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', process.env.FRONTEND_URL],
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Executa AUTOMATICAMENTE quando o cliente tenta conectar.
   * Se falhar aqui, o socket é desconectado imediatamente, poupando processamento posterior.
   */
  async handleConnection(client: Socket) {
    const authToken = client.handshake.auth?.token;
    const headerToken = client.handshake.headers.authorization?.replace('Bearer ', '');
    const token = authToken || headerToken;

    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      const user = await this.usersService.findRawById(payload.userId);

      if (!user || user.moderationStatus === 'banned' || !user.isActive) {
        client.disconnect(true);
        return;
      }

      // Salva o ID no contexto do socket. Fica disponível em qualquer evento!
      client.data.userId = payload.userId;
    } catch (error) {
      client.disconnect(true);
    }
  }

  @SubscribeMessage('joinConversation')
  async handleJoinConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const userId = client.data.userId;
    
    // Segurança extra caso o ciclo de vida falhe
    if (!userId) throw new WsException('Não autorizado');

    try {
      await this.chatService.assertConversationParticipant(
        data.conversationId,
        userId,
      );
      
      // O Redis Adapter garante que esse join funcione mesmo se o servidor escalar
      await client.join(data.conversationId);
      return { joined: true };
    } catch (error) {
      // Retorna o erro amigável para o cliente tratar no 'ack' do frontend
      return { error: error || 'Erro ao entrar na conversa' };
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: { conversationId: string; content: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const userId = client.data.userId;
    if (!userId) throw new WsException('Não autorizado');

    const content = data.content?.trim();
    if (!content) {
      return { error: 'Mensagem vazia não é permitida' };
    }

    try {
      // 1. Salva no banco de dados local da instância atual
      const message = await this.chatService.sendMessage(
        data.conversationId,
        userId,
        content,
      );

      // 2. O Redis intercepta o '.to()' e avisa todas as outras instâncias do NestJS
      // para emitirem o 'newMessage' aos usuários conectados nelas.
      this.server.to(data.conversationId).emit('newMessage', message);
      
      return message;
    } catch (error) {
      return { error: 'Erro ao enviar mensagem' };
    }
  }
}
