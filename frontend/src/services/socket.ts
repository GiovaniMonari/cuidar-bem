import { io, Socket } from 'socket.io-client';

const SOCKET_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';

let socket: Socket | null = null;

export function getSocket() {
  // 1. Evita executar no lado do servidor (Next.js SSR)
  if (typeof window === 'undefined') return null;

  const token = localStorage.getItem('token');

  if (!socket) {
    socket = io(SOCKET_URL, {
      // Obrigatório para funcionar na Railway sem Sticky Sessions
      transports: ['websocket'], 
      autoConnect: false,
      auth: { token },
      // Configurações de resiliência para produção
      reconnection: true,
      reconnectionAttempts: Infinity, // Tenta reconectar para sempre se o servidor cair
      reconnectionDelay: 1000,        // Começa tentando a cada 1 segundo
      reconnectionDelayMax: 5000,     // No máximo espera 5 segundos entre tentativas
      timeout: 20000,                 // Aguarda 20s antes de falhar o handshake
    });

    // Ouvintes de ciclo de vida úteis para depuração em produção
    socket.on('connect', () => console.log('⚡ Conectado ao Socket.IO'));
    socket.on('disconnect', (reason) => {
      console.warn(`❌ Desconectado: ${reason}`);
      // Se o próprio servidor desconectou o cliente (ex: token inválido no backend)
      if (reason === 'io server disconnect') {
        socket?.connect(); // Tenta reconectar explicitamente
      }
    });
    
    socket.on('connect_error', (error) => {
      console.error('⚠️ Erro de conexão no Socket:', error.message);
    });
  }

  // CORREÇÃO CRUCIAL: Se o token mudou, precisamos forçar uma nova autenticação
  if (socket.auth && (socket.auth as any).token !== token) {
    socket.auth = { token };
    if (socket.connected) {
      // Desconecta e reconecta imediatamente para enviar o novo token ao backend NestJS
      socket.disconnect().connect();
    }
  }

  // Conecta caso esteja instanciado mas desligado
  if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
