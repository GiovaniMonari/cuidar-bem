# Cuidar Bem

<div align="center">

![Cuidar Bem](https://img.shields.io/badge/Cuidar-Bem-0A84FF?style=for-the-badge&logo=heart&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=next.js&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white)

</div>

<div align="center">

<img src="https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/heart-pulse.svg" alt="Cuidar Bem logo" width="120" height="120" />

</div>

Plataforma digital para conectar famílias a cuidadores qualificados, com foco em cuidado domiciliar, segurança, confiança e conveniência.

## Sobre o projeto

O Cuidar Bem foi desenvolvido para resolver um problema real do mercado: facilitar a busca por profissionais de cuidado confiáveis para idosos, pessoas com deficiência e clientes que precisam de suporte diário, emocional e técnico em casa.

A plataforma reúne em um único ambiente:

- busca por cuidadores com filtros por especialidade, disponibilidade e localização;
- perfis detalhados com experiência, avaliações e competências;
- agendamento e gestão de atendimentos;
- comunicação direta entre cliente e cuidador;
- pagamentos e histórico de serviços;
- chat em tempo real e processos de moderação para maior segurança.

## Objetivo

Criar uma solução moderna para transformar a forma como famílias encontram e contratam cuidados essenciais, oferecendo uma experiência simples, segura e escalável tanto para clientes quanto para profissionais.

## Tecnologias utilizadas

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Yup
- TanStack Query
- Socket.IO Client
- Framer Motion

### Backend

- NestJS
- Node.js
- TypeScript
- MongoDB + Mongoose
- Redis
- BullMQ
- JWT + Passport
- Swagger
- Socket.IO
- Cloudinary
- Mercado Pago
- Resend / Nodemailer

### Infraestrutura e serviços auxiliares

- Docker Compose
- MongoDB local
- Redis para cache e comunicação em tempo real
- filas assíncronas para e-mail e processamento
- autenticação, autorização e validação de dados em API

## Funcionalidades principais

- cadastro e autenticação de usuários e cuidadores;
- busca e filtros de profissionais;
- perfis com avaliações, experiência e especializações;
- agendamento de serviços;
- gestão de agenda e disponibilidade;
- chat em tempo real;
- processamento de pagamentos;
- upload e gestão de imagens;
- documentação da API com Swagger;
- recursos de moderação e segurança.

## Arquitetura do projeto

```text
cuidar-bem/
├── backend/
│   ├── src/
│   ├── docker-compose.yml
│   ├── package.json
│   ├── tsconfig.json
│   └── jest.config.js
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── postcss.config.mjs
├── README.md
└── .gitignore
```

## Como rodar localmente

### Requisitos

- Node.js 18+
- npm
- MongoDB em execução
- Redis em execução
- Docker (opcional, para subir Redis)

### 1) Clone o repositório

```bash
git clone https://github.com/seu-usuario/cuidar-bem.git
cd cuidar-bem
```

### 2) Configure o ambiente do backend

Crie um arquivo `.env` na pasta `backend`:

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/cuidar-bem
JWT_SECRET=sua_chave_secreta
REDIS_URL=redis://localhost:6379
CLOUDINARY_CLOUD_NAME=seu_cloud_name
CLOUDINARY_API_KEY=sua_api_key
CLOUDINARY_API_SECRET=sua_api_secret
RESEND_API_KEY=sua_api_key_resend
MERCADO_PAGO_ACCESS_TOKEN=seu_token_mp
```

### 3) Suba o Redis

```bash
cd backend
docker compose up -d
```

### 4) Instale as dependências e inicie o backend

```bash
cd backend
npm install
npm run start:dev
```

A API fica disponível em:

- http://localhost:3001/api
- Swagger: http://localhost:3001/docs

### 5) Inicie o frontend

```bash
cd ../frontend
npm install
npm run dev
```

O frontend fica disponível em:

- http://localhost:3000

## Scripts úteis

### Backend

```bash
npm run build
npm run start
npm run start:dev
npm run test
npm run seed
npm run create:admin
```

### Frontend

```bash
npm run dev
npm run build
npm run start
```

## Demonstração de valor

Este projeto combina desenvolvimento full-stack, UX focada em conversão, arquitetura modular e integração com serviços reais do mercado, como pagamentos e armazenamento de imagens. Ele é uma base sólida para um produto de impacto social com aplicação prática e escalável.

## Contribuição

Contribuições são bem-vindas. Para colaborar:

1. faça um fork do projeto;
2. crie uma branch para sua feature;
3. implemente a mudança com commits claros;
4. abra um pull request com descrição detalhada.

## Licença

Este projeto é uma aplicação de demonstração e pode servir como base para uma solução real no segmento de cuidados domiciliares.

---

Desenvolvido com foco em experiência do usuário, arquitetura escalável e solução prática para um problema real de cuidado e bem-estar.
