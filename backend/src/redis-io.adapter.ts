import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;

  async connectToRedis(): Promise<void> {
    // 1. Obtém a URL da Railway ou usa o localhost como fallback de ambiente local
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    console.log(`[Redis] Tentando conectar no endereço: ${redisUrl.includes('@') ? 'Ambiente de Produção' : redisUrl}`);

    // 2. Cria os clientes passando estritamente apenas a URL. 
    // O node-redis configura o TLS e reconexões nativas de forma automática a partir dela!
    const pubClient = createClient({ url: redisUrl });
    const subClient = pubClient.duplicate();

    pubClient.on('error', (err) => console.error('Redis Pub Client Error:', err));
    subClient.on('error', (err) => console.error('Redis Sub Client Error:', err));

    pubClient.on('connect', () => console.log('🚀 Redis Pub conectado com sucesso!'));
    pubClient.on('connect', () => console.log('🚀 Redis Sub conectado com sucesso!'));

    // 3. Efetua a conexão com o banco
    await Promise.all([pubClient.connect(), subClient.connect()]);

    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  override createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    return server;
  }
}
