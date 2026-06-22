/**
 * Chaves e TTLs centralizados do cache Redis.
 * Manter aqui evita strings mágicas espalhadas pelo código.
 */
export const CACHE_KEYS = {
  /** Dashboard admin — dados agregados pesados */
  ADMIN_DASHBOARD: 'admin:dashboard',

  /** Padrão para invalidar tudo do admin de uma vez */
  ADMIN_PATTERN: 'admin:*',
} as const;

export const CACHE_TTL = {
  /** 25 segundos — alinhado com refreshWindowSeconds do dashboard */
  ADMIN_DASHBOARD: 25,
} as const;