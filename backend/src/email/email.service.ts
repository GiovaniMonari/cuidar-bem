// src/email/email.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

@Injectable()
export class EmailService implements OnModuleInit {
  private transporter: nodemailer.Transporter | null = null;
  private readonly logger = new Logger(EmailService.name);
  private isConfigured = false;
  private failCount = 0;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 2000;

  // ✅ NÃO configure no constructor - variáveis podem não estar prontas
  constructor() {}

  async onModuleInit() {
    await this.initializeTransporter();
  }

  /**
   * ✅ Inicializa/reinicializa o transporter
   * Separado para permitir reconexão
   */
  private async initializeTransporter(): Promise<void> {
    const host = process.env.MAIL_HOST || 'smtp.gmail.com';
    const port = Number(process.env.MAIL_PORT) || 465;
    const user = process.env.MAIL_USER;
    const pass = process.env.MAIL_PASS;

    this.logger.log('📧 Configurando email...');
    this.logger.log(`   Host: ${host}:${port}`);
    this.logger.log(
      `   User: ${user ? user.substring(0, 5) + '***' : '❌ NÃO CONFIGURADO'}`,
    );
    this.logger.log(
      `   Pass: ${pass ? '***configurado***' : '❌ NÃO CONFIGURADO'}`,
    );

    if (!user || !pass) {
      this.logger.error(
        '❌ MAIL_USER ou MAIL_PASS não configurado! Verifique as variáveis de ambiente.',
      );
      this.logger.error(
        `   Variáveis disponíveis: ${Object.keys(process.env).filter((k) => k.startsWith('MAIL')).join(', ') || 'NENHUMA com prefixo MAIL_'}`,
      );
      this.isConfigured = false;
      return;
    }

    // ✅ Fechar transporter anterior se existir
    if (this.transporter) {
      try {
        this.transporter.close();
      } catch {
        // ignorar erro ao fechar
      }
    }

    // email.service.ts
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.MAIL_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
      family: 4,
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2',
      },
    } as SMTPTransport.Options);

    // ✅ Verificar conexão mas NÃO desabilitar permanentemente se falhar
    try {
      await this.transporter.verify();
      this.logger.log('✅ Conexão SMTP verificada com sucesso!');
      this.isConfigured = true;
      this.failCount = 0;
    } catch (error: any) {
      this.logger.warn(`⚠️ Verificação SMTP falhou: ${error.message}`);
      this.logger.warn(
        '   O serviço tentará enviar mesmo assim (verify() pode falhar em alguns provedores)',
      );
      // ✅ NÃO desabilitar - alguns SMTPs rejeitam VERIFY mas aceitam envio
      this.isConfigured = true;
    }
  }

  /**
   * ✅ Método de envio com retry e reconexão automática
   */
  private async sendMail(
    to: string,
    subject: string,
    html: string,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.isConfigured || !this.transporter) {
      this.logger.warn(`⚠️ Email ignorado (não configurado): ${to}`);

      // ✅ Tentar reinicializar uma vez
      this.logger.log('🔄 Tentando reinicializar transporter...');
      await this.initializeTransporter();

      if (!this.isConfigured || !this.transporter) {
        return {
          success: false,
          error: 'Email não configurado',
        };
      }
    }

    const from =
      process.env.MAIL_FROM || '"CuidarBem" <noreply@cuidarbem.com>';

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        this.logger.log(
          `📤 Enviando para ${to} (tentativa ${attempt}/${this.MAX_RETRIES})...`,
        );

        const result = await this.transporter.sendMail({
          from,
          to,
          subject,
          html,
        });

        this.logger.log(`✅ Enviado! ID: ${result.messageId}`);
        this.failCount = 0; // reset contador de falhas

        return {
          success: true,
          messageId: result.messageId,
        };
      } catch (error: any) {
        this.logger.error(
          `❌ Tentativa ${attempt} falhou para ${to}: ${error.message}`,
        );
        this.logger.error(`   Código: ${error.code}`);
        this.logger.error(`   Response: ${error.response}`);
        this.logger.error(`   ResponseCode: ${error.responseCode}`);

        // ✅ Erros que NÃO vale a pena retentar
        const permanentErrors = [
          'EAUTH', // credenciais erradas
          '535',   // auth failed
          '553',   // email inválido
          '550',   // mailbox not found
        ];

        const isPermanent = permanentErrors.some(
          (code) =>
            error.code === code ||
            error.responseCode?.toString() === code ||
            error.response?.includes(code),
        );

        if (isPermanent) {
          this.logger.error(
            `❌ Erro permanente - não tentando novamente: ${error.code}`,
          );
          this.failCount++;

          // ✅ Se muitas falhas de auth, reinicializar transporter
          if (this.failCount >= 5 && error.code === 'EAUTH') {
            this.logger.warn(
              '🔄 Muitas falhas de autenticação - reinicializando transporter...',
            );
            await this.initializeTransporter();
          }

          return {
            success: false,
            error: `${error.code}: ${error.message}`,
          };
        }

        // ✅ Erros de conexão - reconectar antes de retentar
        const connectionErrors = [
          'ECONNECTION',
          'ECONNREFUSED',
          'ECONNRESET',
          'ETIMEDOUT',
          'ESOCKET',
          'EAI_AGAIN',
        ];

        if (connectionErrors.includes(error.code)) {
          this.logger.warn(
            `🔄 Erro de conexão (${error.code}) - reconectando...`,
          );
          await this.initializeTransporter();
        }

        // ✅ Esperar antes de retentar (backoff exponencial)
        if (attempt < this.MAX_RETRIES) {
          const delay = this.RETRY_DELAY_MS * Math.pow(2, attempt - 1);
          this.logger.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
          await this.sleep(delay);
        }
      }
    }

    this.failCount++;
    this.logger.error(
      `❌ Todas as ${this.MAX_RETRIES} tentativas falharam para ${to}`,
    );

    return {
      success: false,
      error: `Falha após ${this.MAX_RETRIES} tentativas`,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ═══════════════════════════════════════════
  // TEMPLATES (mesmos que você já tem)
  // ═══════════════════════════════════════════

  private baseTemplate(content: string) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f7fa; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 32px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .header p { color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px; }
        .content { padding: 32px; }
        .footer { background: #f8fafc; padding: 24px 32px; text-align: center; color: #94a3b8; font-size: 12px; }
        .btn { display: inline-block; background: #2563eb; color: white !important; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; margin: 16px 0; }
        .btn-accent { background: #22c55e; }
        .info-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 16px; margin: 16px 0; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0f2fe; }
        .info-row:last-child { border: none; }
      </style>
    </head>
    <body>
      <div class="container">
        ${content}
        <div class="footer">
          <p>CuidarBem &copy; ${new Date().getFullYear()} - Cuidado com amor e profissionalismo</p>
          <p>Este é um email automático, não responda diretamente.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  // ═══════════════════════════════════════════
  // MÉTODOS PÚBLICOS (agora retornam resultado)
  // ═══════════════════════════════════════════

  async sendWelcomeEmail(data: {
    to: string;
    name: string;
    role: 'client' | 'caregiver';
  }) {
    const isCaregiver = data.role === 'caregiver';

    const content = `
      <div class="header">
        <h1>💙 Bem-vindo ao CuidarBem!</h1>
        <p>Sua conta foi criada com sucesso</p>
      </div>
      <div class="content">
        <p style="font-size: 18px; color: #1e293b;">Olá, <strong>${data.name}</strong>!</p>

        <p style="color: #475569; line-height: 1.6;">
          ${
            isCaregiver
              ? 'Estamos muito felizes em tê-lo como cuidador na nossa plataforma! Agora você pode criar seu perfil profissional e começar a receber solicitações de atendimento.'
              : 'Obrigado por se cadastrar! Agora você pode encontrar cuidadores qualificados para ajudar quem você ama.'
          }
        </p>

        <div class="info-box">
          <h3 style="margin: 0 0 12px; color: #1e293b;">Próximos passos:</h3>
          ${
            isCaregiver
              ? `
            <p style="margin: 8px 0; color: #475569;">✅ Complete seu perfil profissional</p>
            <p style="margin: 8px 0; color: #475569;">✅ Adicione suas especialidades e certificações</p>
            <p style="margin: 8px 0; color: #475569;">✅ Defina seus horários e valores</p>
            <p style="margin: 8px 0; color: #475569;">✅ Aguarde solicitações de clientes</p>
          `
              : `
            <p style="margin: 8px 0; color: #475569;">✅ Busque cuidadores na sua região</p>
            <p style="margin: 8px 0; color: #475569;">✅ Analise perfis e avaliações</p>
            <p style="margin: 8px 0; color: #475569;">✅ Solicite o atendimento desejado</p>
            <p style="margin: 8px 0; color: #475569;">✅ Pague com segurança pela plataforma</p>
          `
          }
        </div>

        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'https://cuidarbem.com.br'}/${isCaregiver ? 'perfil/cuidador' : 'cuidadores'}" class="btn">
            ${isCaregiver ? 'Completar Meu Perfil' : 'Buscar Cuidadores'}
          </a>
        </div>
      </div>
    `;

    return this.sendMail(
      data.to,
      `🎉 Bem-vindo ao CuidarBem, ${data.name}!`,
      this.baseTemplate(content),
    );
  }

  async sendNewBookingRequestEmail(data: {
    to: string;
    caregiverName: string;
    clientName: string;
    clientPhone: string;
    serviceName: string;
    durationLabel: string;
    startDate: string;
    address: string;
    totalAmount: number;
    notes?: string;
  }) {
    const content = `
      <div class="header">
        <h1>📋 Nova Solicitação de Atendimento!</h1>
        <p>Você recebeu uma nova solicitação</p>
      </div>
      <div class="content">
        <p style="font-size: 18px; color: #1e293b;">Olá, <strong>${data.caregiverName}</strong>!</p>

        <p style="color: #475569; line-height: 1.6;">
          Você recebeu uma nova solicitação de atendimento:
        </p>

        <div class="info-box">
          <div class="info-row">
            <span style="color: #64748b;">Cliente</span>
            <span style="color: #1e293b; font-weight: 600;">${data.clientName}</span>
          </div>
          <div class="info-row">
            <span style="color: #64748b;">Telefone</span>
            <span style="color: #1e293b; font-weight: 600;">${data.clientPhone}</span>
          </div>
          <div class="info-row">
            <span style="color: #64748b;">Serviço</span>
            <span style="color: #1e293b; font-weight: 600;">${data.serviceName}</span>
          </div>
          <div class="info-row">
            <span style="color: #64748b;">Duração</span>
            <span style="color: #1e293b; font-weight: 600;">${data.durationLabel}</span>
          </div>
          <div class="info-row">
            <span style="color: #64748b;">Data/Hora</span>
            <span style="color: #1e293b; font-weight: 600;">${data.startDate}</span>
          </div>
          <div class="info-row">
            <span style="color: #64748b;">Local</span>
            <span style="color: #1e293b; font-weight: 600;">${data.address}</span>
          </div>
          <div class="info-row">
            <span style="color: #64748b;">Valor Total</span>
            <span style="color: #22c55e; font-weight: 700; font-size: 18px;">R$ ${data.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        ${
          data.notes
            ? `
          <div style="background: #fef3c7; border: 1px solid #fde68a; border-radius: 12px; padding: 16px; margin: 16px 0;">
            <strong style="color: #92400e;">📝 Observações:</strong>
            <p style="color: #78350f; margin: 8px 0 0;">${data.notes}</p>
          </div>
        `
            : ''
        }

        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'https://cuidarbem.com.br'}/dashboard" class="btn btn-accent">
            Ver no Dashboard
          </a>
        </div>
      </div>
    `;

    return this.sendMail(
      data.to,
      `📋 Nova Solicitação: ${data.serviceName} - ${data.clientName}`,
      this.baseTemplate(content),
    );
  }

  async sendBookingConfirmationToClientEmail(data: {
    to: string;
    clientName: string;
    caregiverName: string;
    serviceName: string;
    durationLabel: string;
    startDate: string;
    totalAmount: number;
  }) {
    const content = `
      <div class="header">
        <h1>✅ Solicitação Enviada!</h1>
        <p>Aguardando confirmação do cuidador</p>
      </div>
      <div class="content">
        <p style="font-size: 18px; color: #1e293b;">Olá, <strong>${data.clientName}</strong>!</p>

        <p style="color: #475569; line-height: 1.6;">
          Sua solicitação foi enviada para <strong>${data.caregiverName}</strong>.
        </p>

        <div class="info-box">
          <div class="info-row">
            <span style="color: #64748b;">Cuidador</span>
            <span style="color: #1e293b; font-weight: 600;">${data.caregiverName}</span>
          </div>
          <div class="info-row">
            <span style="color: #64748b;">Serviço</span>
            <span style="color: #1e293b; font-weight: 600;">${data.serviceName}</span>
          </div>
          <div class="info-row">
            <span style="color: #64748b;">Duração</span>
            <span style="color: #1e293b; font-weight: 600;">${data.durationLabel}</span>
          </div>
          <div class="info-row">
            <span style="color: #64748b;">Data/Hora</span>
            <span style="color: #1e293b; font-weight: 600;">${data.startDate}</span>
          </div>
          <div class="info-row">
            <span style="color: #64748b;">Valor Estimado</span>
            <span style="color: #2563eb; font-weight: 700; font-size: 18px;">R$ ${data.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'https://cuidarbem.com.br'}/dashboard" class="btn">
            Acompanhar no Dashboard
          </a>
        </div>
      </div>
    `;

    return this.sendMail(
      data.to,
      `✅ Solicitação Enviada - ${data.serviceName}`,
      this.baseTemplate(content),
    );
  }

  async sendPaymentEmail(data: {
    to: string;
    clientName: string;
    caregiverName: string;
    amount: number;
    paymentUrl: string;
    pixKey?: string;
    bookingDate: string;
    serviceType: string;
  }) {
    const content = `
      <div class="header" style="background: linear-gradient(135deg, #2563eb, #1d4ed8);">
        <h1>💳 Pagamento Pendente</h1>
        <p>Seu agendamento foi confirmado!</p>
      </div>
      <div class="content">
        <p style="font-size: 18px; color: #1e293b;">Olá, <strong>${data.clientName}</strong>!</p>

        <p style="color: #475569; line-height: 1.6;">
          O cuidador <strong>${data.caregiverName}</strong> confirmou seu agendamento.
          Realize o pagamento para garantir o atendimento:
        </p>

        <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); border-radius: 16px; padding: 24px; text-align: center; margin: 24px 0;">
          <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 14px;">Valor Total</p>
          <p style="color: white; font-size: 36px; font-weight: 700; margin: 8px 0;">R$ ${data.amount.toFixed(2)}</p>
        </div>

        <div style="text-align: center;">
          <a href="${data.paymentUrl}" class="btn btn-accent" style="font-size: 16px; padding: 16px 48px;">
            💳 Pagar Agora
          </a>
        </div>

        ${
          data.pixKey
            ? `
          <div style="background: #f0fdf4; border: 2px dashed #86efac; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
            <p style="color: #16a34a; font-weight: 600; margin: 0 0 8px;">Ou pague via PIX:</p>
            <div style="background: white; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 14px; word-break: break-all; color: #1e293b;">
              ${data.pixKey}
            </div>
          </div>
        `
            : ''
        }
      </div>
    `;

    return this.sendMail(
      data.to,
      `💳 Pagamento Pendente - R$ ${data.amount.toFixed(2)}`,
      this.baseTemplate(content),
    );
  }

  async sendPaymentConfirmedEmail(data: {
    to: string;
    clientName: string;
    caregiverName: string;
    amount: number;
    bookingDate: string;
  }) {
    const content = `
      <div class="header" style="background: linear-gradient(135deg, #22c55e, #16a34a);">
        <h1>✅ Pagamento Confirmado!</h1>
        <p>Seu atendimento está garantido</p>
      </div>
      <div class="content">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="font-size: 64px;">✅</div>
        </div>

        <p style="font-size: 18px; color: #1e293b;">Olá, <strong>${data.clientName}</strong>!</p>

        <p style="color: #475569; line-height: 1.6;">
          Pagamento de <strong>R$ ${data.amount.toFixed(2)}</strong> confirmado!
          Atendimento com <strong>${data.caregiverName}</strong> em <strong>${data.bookingDate}</strong>.
        </p>

        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'https://cuidarbem.com.br'}/dashboard" class="btn">
            Ver no Dashboard
          </a>
        </div>
      </div>
    `;

    return this.sendMail(
      data.to,
      `✅ Pagamento Confirmado - CuidarBem`,
      this.baseTemplate(content),
    );
  }

  async sendServiceCompletedToClientEmail(data: {
    to: string;
    clientName: string;
    caregiverName: string;
    serviceName: string;
    caregiverId: string;
    bookingId: string;
  }) {
    const content = `
      <div class="header" style="background: linear-gradient(135deg, #22c55e, #16a34a);">
        <h1>🎉 Serviço Concluído!</h1>
        <p>Obrigado por usar o CuidarBem</p>
      </div>
      <div class="content">
        <p style="font-size: 18px; color: #1e293b;">Olá, <strong>${data.clientName}</strong>!</p>

        <p style="color: #475569; line-height: 1.6;">
          O serviço de <strong>${data.serviceName}</strong> com <strong>${data.caregiverName}</strong>
          foi concluído! Avalie o cuidador:
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.FRONTEND_URL || 'https://cuidarbem.com.br'}/cuidadores/${data.caregiverId}?avaliar=${data.bookingId}" class="btn btn-accent" style="font-size: 16px;">
            ⭐ Avaliar Cuidador
          </a>
        </div>
      </div>
    `;

    return this.sendMail(
      data.to,
      `🎉 Serviço Concluído - Avalie ${data.caregiverName}!`,
      this.baseTemplate(content),
    );
  }

  async sendServiceCompletedToCaregiverEmail(data: {
    to: string;
    caregiverName: string;
    clientName: string;
    serviceName: string;
    amount: number;
    platformFee: number;
    caregiverAmount: number;
  }) {
    const content = `
      <div class="header" style="background: linear-gradient(135deg, #22c55e, #16a34a);">
        <h1>💰 Pagamento Liberado!</h1>
        <p>Serviço concluído com sucesso</p>
      </div>
      <div class="content">
        <p style="font-size: 18px; color: #1e293b;">Olá, <strong>${data.caregiverName}</strong>!</p>

        <div style="background: linear-gradient(135deg, #22c55e, #16a34a); border-radius: 16px; padding: 24px; text-align: center; margin: 24px 0;">
          <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 14px;">Valor Liberado</p>
          <p style="color: white; font-size: 42px; font-weight: 700; margin: 8px 0;">R$ ${data.caregiverAmount.toFixed(2)}</p>
        </div>

        <div class="info-box">
          <div class="info-row">
            <span style="color: #64748b;">Valor do serviço</span>
            <span style="color: #1e293b;">R$ ${data.amount.toFixed(2)}</span>
          </div>
          <div class="info-row">
            <span style="color: #64748b;">Taxa da plataforma (10%)</span>
            <span style="color: #ef4444;">- R$ ${data.platformFee.toFixed(2)}</span>
          </div>
          <div class="info-row">
            <span style="color: #64748b; font-weight: 600;">Valor líquido</span>
            <span style="color: #22c55e; font-weight: 700;">R$ ${data.caregiverAmount.toFixed(2)}</span>
          </div>
        </div>

        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'https://cuidarbem.com.br'}/dashboard" class="btn">
            Ver Meus Pagamentos
          </a>
        </div>
      </div>
    `;

    return this.sendMail(
      data.to,
      `💰 Pagamento Liberado - R$ ${data.caregiverAmount.toFixed(2)}`,
      this.baseTemplate(content),
    );
  }

  async sendServiceCompletedEmail(data: {
    toClient: string;
    toCaregiver: string;
    clientName: string;
    caregiverName: string;
    amount: number;
    platformFee: number;
    caregiverAmount: number;
  }) {
    return this.sendServiceCompletedToCaregiverEmail({
      to: data.toCaregiver,
      caregiverName: data.caregiverName,
      clientName: data.clientName,
      serviceName: 'Atendimento',
      amount: data.amount,
      platformFee: data.platformFee,
      caregiverAmount: data.caregiverAmount,
    });
  }

  // ✅ Método de diagnóstico - útil para debug em produção
  async testConnection(): Promise<{
    configured: boolean;
    connected: boolean;
    error?: string;
  }> {
    if (!this.isConfigured || !this.transporter) {
      return {
        configured: false,
        connected: false,
        error: 'Transporter não configurado',
      };
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
}