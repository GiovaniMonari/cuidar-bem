// src/email/email.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import * as dns from 'dns';

// ✅ FORÇAR IPv4 GLOBALMENTE
dns.setDefaultResultOrder('ipv4first');

@Injectable()
export class EmailService implements OnModuleInit {
  private transporter: nodemailer.Transporter | null = null;
  private readonly logger = new Logger(EmailService.name);
  private isConfigured = false;

  async onModuleInit() {
    await this.initializeTransporter();
  }

  private async initializeTransporter(): Promise<void> {
    const host = process.env.MAIL_HOST || 'smtp.gmail.com';
    const port = Number(process.env.MAIL_PORT) || 587; // ✅ Porta 587 por padrão
    const user = process.env.MAIL_USER;
    const pass = process.env.MAIL_PASS;

    this.logger.log('📧 Configurando email...');
    this.logger.log(`   Host: ${host}:${port}`);
    this.logger.log(`   User: ${user ? user.substring(0, 5) + '***' : '❌ NÃO CONFIGURADO'}`);
    this.logger.log(`   Pass: ${pass ? '***configurado***' : '❌ NÃO CONFIGURADO'}`);

    if (!user || !pass) {
      this.logger.error('❌ MAIL_USER ou MAIL_PASS não configurado!');
      this.isConfigured = false;
      return;
    }

    if (this.transporter) {
      try {
        this.transporter.close();
      } catch {
        // ignorar
      }
    }

    // ✅ Configuração otimizada para produção
    const smtpOptions: SMTPTransport.Options = {
      host,
      port,
      secure: port === 465, // true para 465, false para 587
      auth: {
        user,
        pass,
      },
      // ✅ Para porta 587
      requireTLS: port === 587,
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2',
        ciphers: 'SSLv3',
      },
      // ✅ Timeouts maiores para produção
      connectionTimeout: 60000, // 60s
      greetingTimeout: 30000,   // 30s
      socketTimeout: 60000,     // 60s
      // ✅ Logging detalhado (remover depois)
      logger: true,
      debug: process.env.NODE_ENV !== 'production',
    };

    this.transporter = nodemailer.createTransport(smtpOptions);

    // ✅ Teste de conexão
    this.logger.log('🔌 Testando conexão SMTP...');
    
    try {
      const startTime = Date.now();
      await this.transporter.verify();
      const duration = Date.now() - startTime;
      
      this.logger.log(`✅ Conexão SMTP OK! (${duration}ms)`);
      this.isConfigured = true;
    } catch (error: any) {
      this.logger.error(`⚠️ Verify falhou: ${error.message}`);
      this.logger.error(`   Código: ${error.code}`);
      this.logger.error(`   Address: ${error.address}`);
      
      // ✅ Se ainda for ENETUNREACH, o problema é infraestrutura
      if (error.code === 'ENETUNREACH') {
        this.logger.error('');
        this.logger.error('❌ REDE BLOQUEANDO SMTP!');
        this.logger.error('   Seu provedor de hospedagem está bloqueando conexões SMTP.');
        this.logger.error('   Soluções:');
        this.logger.error('   1. Use um serviço de email dedicado (Resend, SendGrid)');
        this.logger.error('   2. Configure relay SMTP do provedor');
        this.logger.error('   3. Use um add-on de email');
        this.logger.error('');
      }
      
      // Manter ativo para tentar enviar mesmo assim
      this.isConfigured = true;
    }
  }

  async sendMail(
    to: string,
    subject: string,
    html: string,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.isConfigured || !this.transporter) {
      this.logger.warn(`⚠️ Email ignorado (não configurado): ${to}`);
      return { success: false, error: 'Email não configurado' };
    }

    const from = process.env.MAIL_FROM || '"CuidarBem" <noreply@cuidarbem.com>';

    try {
      this.logger.log(`📤 Enviando para ${to}...`);
      const startTime = Date.now();

      const result = await this.transporter.sendMail({
        from,
        to,
        subject,
        html,
      });

      const duration = Date.now() - startTime;
      this.logger.log(`✅ Enviado! (${duration}ms) - ID: ${result.messageId}`);

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error: any) {
      this.logger.error(`❌ Falha ao enviar: ${error.message}`);
      this.logger.error(`   Código: ${error.code}`);
      this.logger.error(`   Para: ${to}`);

      return {
        success: false,
        error: `${error.code}: ${error.message}`,
      };
    }
  }

  async testConnection() {
    if (!this.transporter) {
      return { configured: false, error: 'Transporter não inicializado' };
    }

    try {
      await this.transporter.verify();
      return { configured: true, connected: true };
    } catch (error: any) {
      return {
        configured: true,
        connected: false,
        error: `${error.code}: ${error.message}`,
      };
    }
  }

  // ═══════════════════════════════════════════
  // TEMPLATES
  // ═══════════════════════════════════════════

  private baseTemplate(content: string) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; background: #f5f7fa; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 32px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { padding: 32px; }
    .footer { background: #f8fafc; padding: 24px; text-align: center; color: #94a3b8; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    ${content}
    <div class="footer">
      <p>CuidarBem © ${new Date().getFullYear()}</p>
    </div>
  </div>
</body>
</html>`;
  }

  async sendWelcomeEmail(data: { to: string; name: string; role: string }) {
    const content = `
      <div class="header">
        <h1>💙 Bem-vindo ao CuidarBem!</h1>
      </div>
      <div class="content">
        <p>Olá, <strong>${data.name}</strong>!</p>
        <p>Sua conta foi criada com sucesso.</p>
      </div>
    `;

    return this.sendMail(
      data.to,
      `Bem-vindo ao CuidarBem, ${data.name}!`,
      this.baseTemplate(content),
    );
  }

  async sendNewBookingRequestEmail(data: any) {
    const content = `
      <div class="header">
        <h1>📋 Nova Solicitação</h1>
      </div>
      <div class="content">
        <p>Olá, <strong>${data.caregiverName}</strong>!</p>
        <p>Nova solicitação de <strong>${data.clientName}</strong></p>
        <p><strong>Serviço:</strong> ${data.serviceName}</p>
        <p><strong>Data:</strong> ${data.startDate}</p>
        <p><strong>Valor:</strong> R$ ${data.totalAmount.toFixed(2)}</p>
      </div>
    `;

    return this.sendMail(data.to, 'Nova Solicitação', this.baseTemplate(content));
  }

  async sendBookingConfirmationToClientEmail(data: any) {
    const content = `
      <div class="header">
        <h1>✅ Solicitação Enviada</h1>
      </div>
      <div class="content">
        <p>Olá, <strong>${data.clientName}</strong>!</p>
        <p>Sua solicitação foi enviada para <strong>${data.caregiverName}</strong></p>
      </div>
    `;

    return this.sendMail(data.to, 'Solicitação Enviada', this.baseTemplate(content));
  }

  async sendPaymentEmail(data: any) {
    const content = `
      <div class="header">
        <h1>💳 Pagamento Pendente</h1>
      </div>
      <div class="content">
        <p>Olá, <strong>${data.clientName}</strong>!</p>
        <p>Valor: <strong>R$ ${data.amount.toFixed(2)}</strong></p>
        <p><a href="${data.paymentUrl}">Pagar Agora</a></p>
      </div>
    `;

    return this.sendMail(data.to, 'Pagamento Pendente', this.baseTemplate(content));
  }

  async sendPaymentConfirmedEmail(data: any) {
    const content = `
      <div class="header">
        <h1>✅ Pagamento Confirmado</h1>
      </div>
      <div class="content">
        <p>Olá, <strong>${data.clientName}</strong>!</p>
        <p>Pagamento de R$ ${data.amount.toFixed(2)} confirmado!</p>
      </div>
    `;

    return this.sendMail(data.to, 'Pagamento Confirmado', this.baseTemplate(content));
  }

  async sendServiceCompletedToClientEmail(data: any) {
    const content = `
      <div class="header">
        <h1>🎉 Serviço Concluído</h1>
      </div>
      <div class="content">
        <p>Olá, <strong>${data.clientName}</strong>!</p>
        <p>Avalie o cuidador <strong>${data.caregiverName}</strong></p>
      </div>
    `;

    return this.sendMail(data.to, 'Serviço Concluído', this.baseTemplate(content));
  }

  async sendServiceCompletedToCaregiverEmail(data: any) {
    const content = `
      <div class="header">
        <h1>💰 Pagamento Liberado</h1>
      </div>
      <div class="content">
        <p>Olá, <strong>${data.caregiverName}</strong>!</p>
        <p>Valor liberado: <strong>R$ ${data.caregiverAmount.toFixed(2)}</strong></p>
      </div>
    `;

    return this.sendMail(data.to, 'Pagamento Liberado', this.baseTemplate(content));
  }

  async sendServiceCompletedEmail(data: any) {
    return this.sendServiceCompletedToCaregiverEmail(data);
  }
}