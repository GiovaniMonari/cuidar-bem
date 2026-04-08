'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/services/api';
import { getSocket } from '@/services/socket';
import { useAuth } from '@/contexts/AuthContext';
import { UserAvatar } from '@/components/UserAvatar';
import {
  Send,
  MessageCircle,
  Loader2,
} from 'lucide-react';

function ChatContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const conversationIdFromUrl = searchParams.get('conversation');

  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false); // ⬅️ NOVO

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

  // ⬇️ CORRIGIDO: Adicionar flag hasAutoOpened
  useEffect(() => {
    if (conversationIdFromUrl && conversations.length > 0 && !hasAutoOpened) {
      const found = conversations.find((c) => c._id === conversationIdFromUrl);
      if (found) {
        openConversation(found);
        setHasAutoOpened(true); // ⬅️ Marca que já abriu automaticamente
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

    // ⬇️ PROTEÇÃO: Se já é a conversa selecionada, não faz nada
    if (selectedConversation?._id === conversation._id) {
      console.log('⚠️ Conversa já está aberta, ignorando');
      return;
    }

    setSelectedConversation(conversation);
    setLoadingMessages(true);

    try {
      const data = await api.getMessages(conversation._id);
      setMessages(data || []);

      const socket = getSocket();
      socket.emit('joinConversation', { conversationId: conversation._id });

      // limpar badge localmente
      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === conversation._id
            ? { ...conv, unreadCount: 0 }
            : conv,
        ),
      );
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
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
      senderId: currentUserId,
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
      typeof client === 'object' ? String(client?._id || client?.id || '') : String(client || '');

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

    return typeof caregiver === 'object' ? caregiver : typeof client === 'object' ? client : null;
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
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
              {conversations.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">
                  Nenhuma conversa ainda.
                </div>
              ) : (
                conversations.map((conversation) => {
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
                })
              )}
            </div>
          </div>

          {/* Área do chat */}
          <div className="card h-full flex flex-col overflow-hidden">
            {!selectedConversation ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-center px-6">
                <div>
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="font-medium">Selecione uma conversa</p>
                  <p className="text-sm mt-1">Escolha uma conversa ao lado para começar</p>
                </div>
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-gray-100 bg-white">
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
                      const senderId = String(msg.senderId?._id || msg.senderId?.id || '');
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
                                ? new Date(msg.createdAt).toLocaleTimeString('pt-BR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
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