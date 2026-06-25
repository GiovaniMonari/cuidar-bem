/**
 * Chaves e TTLs centralizados do cache Redis.
 * Manter aqui evita strings mágicas espalhadas pelo código.
 */
export const CACHE_KEYS = {
  /** Dashboard admin — dados agregados pesados */
  ADMIN_DASHBOARD: 'admin:dashboard',

  /** Padrão para invalidar tudo do admin de uma vez */
  ADMIN_PATTERN: 'admin:*',

  /**
   * Chave de deduplicação de reports.
   * Composta por: reporterId + reportedUserId + source + reason + contexto opcional.
   * O TTL de 6h garante que o mesmo report não seja enviado duas vezes
   * no mesmo janela de tempo sem tocar no MongoDB.
   */
  reportDedup: (
    reporterId: string,
    reportedUserId: string,
    source: string,
    reason: string,
    contextId?: string,
  ) =>
    `report:dedup:${reporterId}:${reportedUserId}:${source}:${reason}${
      contextId ? `:${contextId}` : ''
    }`,
} as const;

export const CACHE_TTL = {
  /** 25 segundos — alinhado com refreshWindowSeconds do dashboard */
  ADMIN_DASHBOARD: 25,

  /** 6 horas — janela de deduplicação de reports */
  REPORT_DEDUP: 6 * 60 * 60,
} as const;