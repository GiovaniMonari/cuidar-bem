/** Nome da fila BullMQ para operações de chat */
export const CHAT_QUEUE = 'chat';

/** Nomes dos jobs dentro da fila */
export const CHAT_JOBS = {
  CLEANUP_EXPIRED: 'cleanup-expired-chats',
} as const;

export type ChatJobName = (typeof CHAT_JOBS)[keyof typeof CHAT_JOBS];

/**
 * jobId fixo para o repeatable — garante idempotência:
 * chamar `scheduleCleanup()` múltiplas vezes no boot
 * não registra duplicatas no Redis.
 */
export const CHAT_CLEANUP_JOB_ID = 'chat-cleanup-repeatable';
