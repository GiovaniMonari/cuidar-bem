// 1. ESTA LINHA DEVE SER A PRIMEIRA DO ARQUIVO (Importante para Produção/Railway)
import 'dotenv/config'; 

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'debug', 'log', 'verbose'],
  });

  // Configurações Globais HTTP
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Cuidar Bem API')
    .setDescription(
      [
        'API da plataforma Cuidar Bem para conectar clientes e cuidadores.',
        '',
        'A maioria das rotas protegidas exige um token JWT no header Authorization como Bearer token.',
        'O prefixo global das rotas HTTP é /api. O endpoint de webhook de pagamentos é público.',
        '',
        'WebSocket (Socket.IO): conecte-se usando /chat com o token em auth.token ou no header Authorization.',
        'Eventos disponíveis: joinConversation ({ conversationId }), sendMessage ({ conversationId, content }) e newMessage.',
      ].join('\n'),
    )
    .setVersion('1.0.0')
    .setContact('Cuidar Bem', 'https://www.cuidarbem.services', 'contato@cuidarbem.services')
    .addServer(`http://localhost:${process.env.PORT || 3001}`, 'Desenvolvimento local')
    .addServer('https://www.cuidarbem.services', 'Produção')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT retornado pelo endpoint /api/auth/login.',
      },
      'bearer',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://vercel.app',
      'https://cuidar-bem-pink.vercel.app',
      'https://www.cuidarbem.services',
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
  console.log(`📘 Swagger disponível em http://localhost:${port}/docs`);
}
bootstrap();
