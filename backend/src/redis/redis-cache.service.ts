import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private client: Redis | null = null;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');

    if (!redisUrl) {
      this.logger.warn('⚠️  REDIS_URL não configurado — cache desabilitado, usando fallback em memória');
      return;
    }

    try {
      this.client = new Redis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        connectTimeout: 3000,
        enableOfflineQueue: false,
      });

      this.client.on('error', (err) => {
        if (this.isConnected) {
          this.logger.warn(`Redis erro: ${err.message} — cache degradado`);
        }
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log('✅ Redis conectado');
      });

      this.client.on('close', () => {
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (err: any) {
      this.logger.warn(`Redis indisponível: ${err.message} — cache desabilitado`);
      this.client = null;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit().catch(() => {});
    }
  }

  // ─── Operações principais ──────────────────────────────────────

  async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.isConnected) return null;

    try {
      const raw = await this.client.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (err: any) {
      this.logger.warn(`Redis GET falhou (${key}): ${err.message}`);
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (!this.client || !this.isConnected) return;

    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (err: any) {
      this.logger.warn(`Redis SET falhou (${key}): ${err.message}`);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client || !this.isConnected) return;

    try {
      await this.client.del(key);
    } catch (err: any) {
      this.logger.warn(`Redis DEL falhou (${key}): ${err.message}`);
    }
  }

  /**
   * Deleta todas as chaves que correspondem ao padrão (ex: "dashboard:*").
   * Usa SCAN para não bloquear o Redis em produção.
   */
  async delByPattern(pattern: string): Promise<void> {
    if (!this.client || !this.isConnected) return;

    try {
      let cursor = '0';
      const keys: string[] = [];

      do {
        const [nextCursor, found] = await this.client.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100,
        );
        cursor = nextCursor;
        keys.push(...found);
      } while (cursor !== '0');

      if (keys.length > 0) {
        await this.client.del(...keys);
        this.logger.debug(`Redis DEL pattern "${pattern}": ${keys.length} chave(s) removida(s)`);
      }
    } catch (err: any) {
      this.logger.warn(`Redis DEL pattern falhou (${pattern}): ${err.message}`);
    }
  }

  /**
   * Cache-aside helper: retorna o valor cacheado se existir,
   * caso contrário executa `fn`, armazena o resultado e retorna.
   */
  async wrap<T>(
    key: string,
    ttlSeconds: number,
    fn: () => Promise<T>,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      this.logger.debug(`Cache HIT: ${key}`);
      return cached;
    }

    this.logger.debug(`Cache MISS: ${key}`);
    const result = await fn();
    await this.set(key, result, ttlSeconds);
    return result;
  }

  get available(): boolean {
    return this.isConnected && this.client !== null;
  }
}