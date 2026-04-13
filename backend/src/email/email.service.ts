// src/email/email.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService implements OnModuleInit {
  private resend: Resend | null = null;
  private readonly logger = new Logger(EmailService.name);
  private isConfigured = false;

  async onModuleInit() {
    const apiKey = process.env.RESEND_API_KEY;

    this.logger.log('📧 Configurando email (Resend)...');
    this.logger.log(`   API Key: ${apiKey ? apiKey.substring(0, 8) + '***' : '❌ NÃO CONFIGURADO'}`);
    this.logger.log(`   From: ${process.env.MAIL_FROM || 'padrão'}`);

    if (!apiKey) {
      this.logger.error('❌ RESEND_API_KEY não configurado!');
      return;
    }

    this.resend = new Resend(apiKey);
    this.isConfigured = true;

    // Teste rápido
    this.logger.log('✅ Resend configurado com sucesso!');
  }

  private async sendMail(
    to: string,
    subject: string,
    html: string,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.isConfigured || !this.resend) {
      this.logger.warn(`⚠️ Email ignorado (não configurado): ${to}`);
      return { success: false, error: 'Email não configurado' };
    }

    try {
      this.logger.log(`📤 Enviando para ${to}...`);
      this.logger.log(`   Assunto: ${subject}`);
      const startTime = Date.now();

      const { data, error } = await this.resend.emails.send({
        from: process.env.MAIL_FROM || 'CuidarBem <onboarding@resend.dev>',
        to,
        subject,
        html,
      });

      const duration = Date.now() - startTime;

      if (error) {
        this.logger.error(`❌ Resend erro (${duration}ms): ${error.message}`);
        return { success: false, error: error.message };
      }

      this.logger.log(`✅ Enviado! (${duration}ms) ID: ${data?.id}`);
      return { success: true, messageId: data?.id };
    } catch (error: any) {
      this.logger.error(`❌ Exceção ao enviar para ${to}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async testConnection(): Promise<{
    configured: boolean;
    provider: string;
    error?: string;
  }> {
    return {
      configured: this.isConfigured,
      provider: this.isConfigured ? 'resend' : 'none',
    };
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
</html>`;
  }

  // ═══════════════════════════════════════════
  // 1. BEM-VINDO
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
          ${isCaregiver
            ? 'Estamos muito felizes em tê-lo como cuidador na nossa plataforma! Agora você pode criar seu perfil profissional e começar a receber solicitações de atendimento.'
            : 'Obrigado por se cadastrar! Agora você pode encontrar cuidadores qualificados para ajudar quem você ama.'}
        </p>

        <div class="info-box">
          <h3 style="margin: 0 0 12px; color: #1e293b;">Próximos passos:</h3>
          ${isCaregiver ? `
            <p style="margin: 8px 0; color: #475569;">✅ Complete seu perfil profissional</p>
            <p style="margin: 8px 0; color: #475569;">✅ Adicione suas especialidades e certificações</p>
            <p style="margin: 8px 0; color: #475569;">✅ Defina seus horários e valores</p>
            <p style="margin: 8px 0; color: #475569;">✅ Aguarde solicitações de clientes</p>
          ` : `
            <p style="margin: 8px 0; color: #475569;">✅ Busque cuidadores na sua região</p>
            <p style="margin: 8px 0; color: #475569;">✅ Analise perfis e avaliações</p>
            <p style="margin: 8px 0; color: #475569;">✅ Solicite o atendimento desejado</p>
            <p style="margin: 8px 0; color: #475569;">✅ Pague com segurança pela plataforma</p>
          `}
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

  // ═══════════════════════════════════════════
  // 2. NOVA SOLICITAÇÃO (para cuidador)
  // ═══════════════════════════════════════════

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
          Você recebeu uma nova solicitação de atendimento. Confira os detalhes:
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

        ${data.notes ? `
          <div style="background: #fef3c7; border: 1px solid #fde68a; border-radius: 12px; padding: 16px; margin: 16px 0;">
            <strong style="color: #92400e;">📝 Observações do cliente:</strong>
            <p style="color: #78350f; margin: 8px 0 0;">${data.notes}</p>
          </div>
        ` : ''}

        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'https://cuidarbem.com.br'}/dashboard" class="btn btn-accent">
            Ver no Dashboard
          </a>
        </div>

        <p style="color: #64748b; font-size: 14px; margin-top: 24px; text-align: center;">
          ⚠️ Acesse o dashboard para <strong>aceitar</strong> ou <strong>recusar</strong> a solicitação.
        </p>
      </div>
    `;

    return this.sendMail(
      data.to,
      `📋 Nova Solicitação: ${data.serviceName} - ${data.clientName}`,
      this.baseTemplate(content),
    );
  }

  // ═══════════════════════════════════════════
  // 3. CONFIRMAÇÃO PARA CLIENTE
  // ═══════════════════════════════════════════

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
          Sua solicitação de atendimento foi enviada com sucesso! 
          O cuidador <strong>${data.caregiverName}</strong> receberá a notificação e responderá em breve.
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

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin: 16px 0;">
          <p style="color: #166534; margin: 0;">
            <strong>🔒 Próximos passos:</strong><br>
            1. Aguarde a confirmação do cuidador<br>
            2. Após a confirmação, o atendimento seguirá normalmente, sem cobrança neste momento<br>
            3. O pagamento será solicitado por email somente após o término do serviço
          </p>
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

  // ═══════════════════════════════════════════
  // 4. PAGAMENTO PENDENTE
  // ═══════════════════════════════════════════

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
        <p>Seu serviço foi finalizado</p>
      </div>
      <div class="content">
        <p style="font-size: 18px; color: #1e293b;">Olá, <strong>${data.clientName}</strong>!</p>
        
        <p style="color: #475569; line-height: 1.6;">
          O atendimento com <strong>${data.caregiverName}</strong> foi concluído.
          Como o pagamento é feito somente após o término do serviço, agora falta apenas quitar este atendimento na plataforma:
        </p>

        <div class="info-box">
          <div class="info-row">
            <span style="color: #64748b;">Cuidador</span>
            <span style="color: #1e293b; font-weight: 600;">${data.caregiverName}</span>
          </div>
          <div class="info-row">
            <span style="color: #64748b;">Serviço</span>
            <span style="color: #1e293b; font-weight: 600;">${data.serviceType}</span>
          </div>
          <div class="info-row">
            <span style="color: #64748b;">Data</span>
            <span style="color: #1e293b; font-weight: 600;">${data.bookingDate}</span>
          </div>
        </div>

        <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); border-radius: 16px; padding: 24px; text-align: center; margin: 24px 0;">
          <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 14px;">Valor Total</p>
          <p style="color: white; font-size: 36px; font-weight: 700; margin: 8px 0;">R$ ${data.amount.toFixed(2)}</p>
        </div>

        <div style="text-align: center;">
          <a href="${data.paymentUrl}" class="btn btn-accent" style="font-size: 16px; padding: 16px 48px;">
            💳 Pagar Agora
          </a>
        </div>

        ${data.pixKey ? `
          <div style="background: #f0fdf4; border: 2px dashed #86efac; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
            <p style="color: #16a34a; font-weight: 600; margin: 0 0 8px;">Ou pague via PIX:</p>
            <div style="background: white; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 14px; word-break: break-all; color: #1e293b;">
              ${data.pixKey}
            </div>
          </div>
        ` : ''}

        <div style="background: #fef3c7; border: 1px solid #fde68a; border-radius: 12px; padding: 16px; margin: 16px 0;">
          <p style="color: #92400e; margin: 0; font-size: 14px;">
            ⚠️ <strong>Importante:</strong> Assim que o pagamento for aprovado,
            a plataforma registra a quitação do serviço concluído e processa o repasse ao cuidador.
          </p>
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
      `💳 Pagamento Pendente - R$ ${data.amount.toFixed(2)}`,
      this.baseTemplate(content),
    );
  }

  // ═══════════════════════════════════════════
  // 5. PAGAMENTO CONFIRMADO
  // ═══════════════════════════════════════════

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
        <p>Pagamento do serviço concluído com sucesso</p>
      </div>
      <div class="content">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="font-size: 64px;">✅</div>
        </div>
        
        <p style="font-size: 18px; color: #1e293b;">Olá, <strong>${data.clientName}</strong>!</p>
        
        <p style="color: #475569; line-height: 1.6;">
          Seu pagamento de <strong>R$ ${data.amount.toFixed(2)}</strong> foi confirmado com sucesso.
          Este pagamento se refere ao atendimento já concluído com <strong>${data.caregiverName}</strong>, realizado em <strong>${data.bookingDate}</strong>.
        </p>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin: 16px 0;">
          <p style="color: #166534; margin: 0;">
            ✅ O pagamento foi aprovado e o serviço foi quitado com sucesso na plataforma.
          </p>
        </div>

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

  async sendBookingApprovedEmail(data: {
    to: string;
    clientName: string;
    caregiverName: string;
    serviceName: string;
    bookingDate: string;
    amount: number;
  }) {
    const content = `
      <div class="header">
        <h1>✅ Agendamento Confirmado!</h1>
        <p>Seu cuidador confirmou o atendimento</p>
      </div>
      <div class="content">
        <p style="font-size: 18px; color: #1e293b;">Olá, <strong>${data.clientName}</strong>!</p>
        
        <p style="color: #475569; line-height: 1.6;">
          O cuidador <strong>${data.caregiverName}</strong> confirmou seu atendimento de
          <strong> ${data.serviceName}</strong> para <strong>${data.bookingDate}</strong>.
        </p>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin: 16px 0;">
          <p style="color: #166534; margin: 0;">
            ✅ O agendamento está confirmado.<br>
            💡 Não é necessário realizar pagamento agora.<br>
            📩 O link de pagamento será enviado por email somente após o término do serviço.
          </p>
        </div>

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
            <span style="color: #64748b;">Data</span>
            <span style="color: #1e293b; font-weight: 600;">${data.bookingDate}</span>
          </div>
          <div class="info-row">
            <span style="color: #64748b;">Valor</span>
            <span style="color: #2563eb; font-weight: 700;">R$ ${data.amount.toFixed(2)}</span>
          </div>
        </div>

        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'https://cuidarbem.com.br'}/dashboard" class="btn">
            Ver no Dashboard
          </a>
        </div>
      </div>
    `;

    return this.sendMail(
      data.to,
      `✅ Agendamento Confirmado - ${data.serviceName}`,
      this.baseTemplate(content),
    );
  }

  async sendCaregiverCheckInEmail(data: {
    to: string;
    clientName: string;
    caregiverName: string;
    serviceName: string;
    address: string;
    checkInAt: string;
    distanceMeters?: number;
  }) {
    const distanceText =
      typeof data.distanceMeters === 'number'
        ? `${data.distanceMeters}m do local combinado`
        : 'próximo ao local combinado';

    const content = `
      <div class="header" style="background: linear-gradient(135deg, #16a34a, #15803d);">
        <h1>📍 Cuidador no Local</h1>
        <p>O atendimento acaba de ser iniciado</p>
      </div>
      <div class="content">
        <p style="font-size: 18px; color: #1e293b;">Olá, <strong>${data.clientName}</strong>!</p>

        <p style="color: #475569; line-height: 1.6;">
          O cuidador <strong>${data.caregiverName}</strong> realizou o check-in e já está
          <strong> ${distanceText}</strong>.
        </p>

        <div class="info-box">
          <div class="info-row">
            <span style="color: #64748b;">Serviço</span>
            <span style="color: #1e293b; font-weight: 600;">${data.serviceName}</span>
          </div>
          <div class="info-row">
            <span style="color: #64748b;">Check-in</span>
            <span style="color: #1e293b; font-weight: 600;">${data.checkInAt}</span>
          </div>
          <div class="info-row">
            <span style="color: #64748b;">Endereço</span>
            <span style="color: #1e293b; font-weight: 600;">${data.address}</span>
          </div>
        </div>

        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 16px; margin: 16px 0;">
          <p style="color: #1d4ed8; margin: 0;">
            💬 Se precisar alinhar qualquer detalhe do atendimento, acompanhe a conversa pelo dashboard.
          </p>
        </div>

        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'https://cuidarbem.com.br'}/dashboard" class="btn btn-accent">
            Acompanhar Atendimento
          </a>
        </div>
      </div>
    `;

    return this.sendMail(
      data.to,
      `📍 ${data.caregiverName} realizou o check-in`,
      this.baseTemplate(content),
    );
  }

  // ═══════════════════════════════════════════
  // 6. SERVIÇO CONCLUÍDO (CLIENTE)
  // ═══════════════════════════════════════════

  async sendServiceCompletedToClientEmail(data: {
    to: string;
    clientName: string;
    caregiverName: string;
    serviceName: string;
    caregiverId: string;
    bookingId: string;
    paymentCreated?: boolean;
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
          foi marcado como concluído! Sua avaliação é muito importante.
        </p>

        ${data.paymentCreated ? `
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 16px; margin: 16px 0;">
            <p style="color: #1d4ed8; margin: 0;">
              📩 Também enviamos o email com o link para pagamento deste atendimento concluído.
            </p>
          </div>
        ` : ''}

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

  // ═══════════════════════════════════════════
  // 7. PAGAMENTO LIBERADO (CUIDADOR)
  // ═══════════════════════════════════════════

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
        
        <p style="color: #475569; line-height: 1.6;">
          O serviço de <strong>${data.serviceName}</strong> para <strong>${data.clientName}</strong> 
          foi concluído e o pagamento foi liberado!
        </p>

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
            <span style="color: #64748b; font-weight: 600;">Seu valor líquido</span>
            <span style="color: #22c55e; font-weight: 700;">R$ ${data.caregiverAmount.toFixed(2)}</span>
          </div>
        </div>

        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'https://cuidarbem.com.br'}/dashboard" class="btn">
            Ver Meus Pagamentos
          </a>
        </div>

        <p style="color: #64748b; font-size: 14px; margin-top: 24px; text-align: center;">
          Obrigado por fazer parte da comunidade CuidarBem! 💙
        </p>
      </div>
    `;

    return this.sendMail(
      data.to,
      `💰 Pagamento Liberado - R$ ${data.caregiverAmount.toFixed(2)}`,
      this.baseTemplate(content),
    );
  }

  // ═══════════════════════════════════════════
  // LEGADO (compatibilidade)
  // ═══════════════════════════════════════════

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

  // 8. NOVO RELATÓRIO DISPONÍVEL (CLIENTE)

  async sendNewFeedbackAvailableEmail(data: {
    to: string;
    clientName: string;
    caregiverName: string;
    serviceName: string;
    feedbackDate: string;
    dayNumber?: number;
    isFinal: boolean;
  }) {
    const reportType = data.isFinal 
      ? 'Relatório Final' 
      : data.dayNumber 
      ? `Relatório do Dia ${data.dayNumber}` 
      : 'Novo Relatório';

    const content = `
      <div class="header" style="background: linear-gradient(135deg, #7c3aed, #6d28d9);">
        <h1>📋 ${reportType} Disponível</h1>
        <p>Seu cuidador enviou um relatório de atendimento</p>
      </div>
      <div class="content">
        <p style="font-size: 18px; color: #1e293b;">Olá, <strong>${data.clientName}</strong>!</p>
        
        <p style="color: #475569; line-height: 1.6;">
          <strong>${data.caregiverName}</strong> enviou ${data.isFinal ? 'o relatório final' : 'um novo relatório'} 
          sobre o atendimento de <strong>${data.serviceName}</strong>.
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
            <span style="color: #64748b;">Data do Relatório</span>
            <span style="color: #1e293b; font-weight: 600;">${data.feedbackDate}</span>
          </div>
          ${data.dayNumber ? `
          <div class="info-row">
            <span style="color: #64748b;">Dia</span>
            <span style="color: #7c3aed; font-weight: 700;">Dia ${data.dayNumber}</span>
          </div>
          ` : ''}
          <div class="info-row">
            <span style="color: #64748b;">Tipo</span>
            <span style="color: #1e293b; font-weight: 600;">${data.isFinal ? '✅ Relatório Final' : '📝 Relatório Diário'}</span>
          </div>
        </div>

        ${data.isFinal ? `
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin: 16px 0;">
            <p style="color: #166534; margin: 0;">
              ✅ Este é o relatório final do atendimento, contendo um resumo completo do período de cuidados.
            </p>
          </div>
        ` : `
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 16px; margin: 16px 0;">
            <p style="color: #1d4ed8; margin: 0;">
              📝 Este relatório contém informações sobre o dia de atendimento, 
              permitindo que você acompanhe de perto os cuidados prestados.
            </p>
          </div>
        `}

        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.FRONTEND_URL || 'https://cuidarbem.com.br'}/dashboard" class="btn" style="background: linear-gradient(135deg, #7c3aed, #6d28d9); font-size: 16px; padding: 16px 48px;">
            📋 Consultar Relatório
          </a>
        </div>

        <p style="color: #64748b; font-size: 14px; margin-top: 24px; text-align: center;">
          Acesse seu dashboard para visualizar o relatório completo com todos os detalhes do atendimento.
        </p>
      </div>
    `;

    return this.sendMail(
      data.to,
      `📋 ${reportType} - ${data.serviceName}`,
      this.baseTemplate(content),
    );
  }
}
