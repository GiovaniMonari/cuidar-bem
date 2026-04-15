'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { getSocket } from '@/services/socket';
import { useAuth } from '@/contexts/AuthContext';
import { UserAvatar } from '@/components/UserAvatar';
import { ReportUserModal } from '@/components/ReportUserModal';
import {
  Send,
  MessageCircle,
  Loader2,
  Search,
  Calendar,
  Heart,
  ShieldAlert,
} from 'lucide-react';

function ChatContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationIdFromUrl = searchParams.get('conversation');

  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const currentUserId = useMemo(() => {
    return String(user?.id || user?._id || '');
  }, [user]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    const socket = getSocket();

    socket.on('newMessage', (msg) => {
      setMessages((prev) => {
        const alreadyExists = prev.some((m) => m._id === msg._id);
        if (alreadyExists) return prev;
        return [...prev, msg];
      });

      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === msg.conversationId
            ? {
                ...conv,
                lastMessage: msg.content,
                lastMessageAt: msg.createdAt,
              }
            : conv,
        ),
      );

      scrollToBottom();
    });

    return () => {
      socket.off('newMessage');
    };
  }, []);

  useEffect(() => {
    if (conversationIdFromUrl && conversations.length > 0 && !hasAutoOpened) {
      const found = conversations.find((c) => c._id === conversationIdFromUrl);
      if (found) {
        openConversation(found);
        setHasAutoOpened(true);
      }
    }
  }, [conversationIdFromUrl, conversations, hasAutoOpened]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const data = await api.getConversations();
      console.log('📨 conversas recebidas:', data);
      setConversations(data || []);
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    } finally {
      setLoading(false);
    }
  };

  const openConversation = async (conversation: any) => {
    if (!conversation?._id) return;

    if (selectedConversation?._id === conversation._id) {
      return;
    }

    if (conversation.isActive === false) {
      alert('Esta conversa foi encerrada.');
      return;
    }

    setSelectedConversation(conversation);
    setLoadingMessages(true);

    try {
      const data = await api.getMessages(conversation._id);
      setMessages(data || []);

      const socket = getSocket();
      socket.emit('joinConversation', { conversationId: conversation._id });

      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === conversation._id ? { ...conv, unreadCount: 0 } : conv,
        ),
      );
    } catch (error: any) {
      if (
        error.message?.includes('encerrada') ||
        error.message?.includes('fechada')
      ) {
        alert(error.message);
        setConversations((prev) =>
          prev.filter((c) => c._id !== conversation._id),
        );
        setSelectedConversation(null);
      } else {
        console.error('Erro ao carregar mensagens:', error);
      }
    } finally {
      setLoadingMessages(false);
      scrollToBottom();
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !selectedConversation || !currentUserId) return;

    const socket = getSocket();

    socket.emit('sendMessage', {
      conversationId: selectedConversation._id,
      content: message.trim(),
    });

    setMessage('');
  };

  const getOtherUser = (conversation: any) => {
    if (!conversation || !user) return null;

    const currentId = String(user?.id || user?._id || '');

    const client = conversation.clientId;
    const caregiver = conversation.caregiverUserId;

    const clientId =
      typeof client === 'object'
        ? String(client?._id || client?.id || '')
        : String(client || '');

    const caregiverId =
      typeof caregiver === 'object'
        ? String(caregiver?._id || caregiver?.id || '')
        : String(caregiver || '');

    if (clientId === currentId) {
      return typeof caregiver === 'object' ? caregiver : null;
    }

    if (caregiverId === currentId) {
      return typeof client === 'object' ? client : null;
    }

    return typeof caregiver === 'object'
      ? caregiver
      : typeof client === 'object'
        ? client
        : null;
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  // ⬇️ NOVO: Tela quando não há conversas
  if (conversations.length === 0) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="card p-8 text-center">
            {/* Ícone */}
            <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-10 h-10 text-primary-600" />
            </div>

            {/* Título */}
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Nenhuma conversa ainda
            </h2>

            {/* Descrição */}
            <p className="text-gray-500 mb-6 leading-relaxed">
              {user?.role === 'caregiver' ? (
                <>
                  Você ainda não possui conversas com clientes. Quando um cliente
                  solicitar um atendimento e você aceitar, a conversa será
                  liberada automaticamente!
                </>
              ) : (
                <>
                  Para conversar com um cuidador, primeiro você precisa solicitar
                  um atendimento. É simples e rápido!
                </>
              )}
            </p>

            {/* Passos */}
            {user?.role !== 'caregiver' && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Como funciona:
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      1
                    </div>
                    <p className="text-sm text-gray-600">
                      Encontre um cuidador que atenda às suas necessidades
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      2
                    </div>
                    <p className="text-sm text-gray-600">
                      Solicite um atendimento informando data e local
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      3
                    </div>
                    <p className="text-sm text-gray-600">
                      Após a solicitação, o chat será liberado automaticamente!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Botão de ação */}
            {user?.role === 'caregiver' ? (
              <button
                onClick={() => router.push('/dashboard')}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Ver meus atendimentos
              </button>
            ) : (
              <button
                onClick={() => router.push('/cuidadores')}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                Buscar Cuidadores
              </button>
            )}

            {/* Mensagem de incentivo */}
            <p className="text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
              <Heart className="w-3 h-3 text-red-400" />
              Cuidar de quem amamos é um ato de amor
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] bg-gray-50">
      <div className="max-w-7xl mx-auto h-full px-4 py-6">
        <div className="grid lg:grid-cols-[320px_1fr] gap-6 h-full">
          {/* Lista de conversas */}
          <div className="card overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b border-gray-100">
              <h1 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary-600" />
                Conversas
              </h1>
            </div>

            <div className="flex-1 overflow-y-auto">
              {conversations.map((conversation) => {
                const otherUser = getOtherUser(conversation);

                return (
                  <button
                    key={conversation._id}
                    onClick={() => openConversation(conversation)}
                    className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      selectedConversation?._id === conversation._id
                        ? 'bg-primary-50'
                        : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <UserAvatar
                        name={otherUser?.name || 'Usuário'}
                        avatar={otherUser?.avatar}
                        size={44}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-gray-900 truncate">
                            {otherUser?.name || 'Usuário'}
                          </p>

                          {conversation.unreadCount > 0 && (
                            <span className="bg-primary-600 text-white text-xs font-bold min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-gray-500 truncate mt-1">
                          {conversation.lastMessage || 'Sem mensagens'}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Área do chat */}
          <div className="card h-full flex flex-col overflow-hidden">
            {!selectedConversation ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-center px-6">
                <div>
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="font-medium">Selecione uma conversa</p>
                  <p className="text-sm mt-1">
                    Escolha uma conversa ao lado para começar
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-gray-100 bg-white">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        name={getOtherUser(selectedConversation)?.name || 'Usuário'}
                        avatar={getOtherUser(selectedConversation)?.avatar}
                        size={44}
                      />
                      <div>
                        <p className="font-semibold text-gray-900">
                          {getOtherUser(selectedConversation)?.name || 'Usuário'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Conversa com este profissional
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReportModalOpen(true)}
                      className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100"
                    >
                      <ShieldAlert className="h-4 w-4" />
                      Denunciar
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm py-10">
                      Nenhuma mensagem ainda. Envie a primeira!
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const senderId = String(
                        msg.senderId?._id || msg.senderId?.id || '',
                      );
                      const isMine = senderId === currentUserId;

                      return (
                        <div
                          key={msg._id}
                          className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm shadow-sm ${
                              isMine
                                ? 'bg-primary-600 text-white rounded-br-md'
                                : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                            }`}
                          >
                            <p>{msg.content}</p>
                            <p
                              className={`text-[10px] mt-1 ${
                                isMine ? 'text-white/70' : 'text-gray-400'
                              }`}
                            >
                              {msg.createdAt
                                ? new Date(msg.createdAt).toLocaleTimeString(
                                    'pt-BR',
                                    {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    },
                                  )
                                : ''}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}

                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-gray-100 flex gap-3 bg-white">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Digite sua mensagem..."
                    className="input-field"
                  />

                  <button
                    onClick={sendMessage}
                    className="btn-primary !px-5 flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {selectedConversation && (
        <ReportUserModal
          open={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          source="chat"
          bookingId={
            typeof selectedConversation.bookingId === 'object'
              ? selectedConversation.bookingId?._id
              : selectedConversation.bookingId
          }
          conversationId={selectedConversation._id}
          reportedUserName={getOtherUser(selectedConversation)?.name || 'Usuário'}
          contextLabel="Chat em tempo real"
        />
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
