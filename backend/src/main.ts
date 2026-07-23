// 1. ESTA LINHA DEVE SER A PRIMEIRA DO ARQUIVO (Importante para Produção/Railway)
import 'dotenv/config'; 

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'debug', 'log', 'verbose'],
  });

  // Configurações Globais HTTP
  app.setGlobalPrefix('api');

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://vercel.app',
      'https://cuidar-bem-pink.vercel.app',
      'https://cuidarbem.services',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Inicialização do Adaptador Redis (Agora ele lerá a URL com sucesso!)
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 API rodando em http://localhost:${port}/api`);
}
bootstrap();
