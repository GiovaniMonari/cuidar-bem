import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);
  private isConfigured = false;
  
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.MAIL_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    tls: {
      rejectUnauthorized: false, // ⬇️ Para ambientes com SSL restrito
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  this.isConfigured = true;
}

  private async sendMail(to: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({
        from: process.env.MAIL_FROM || '"CuidarBem" <noreply@cuidarbem.com>',
        to,
        subject,
        html,
      });
      this.logger.log(`📧 Email enviado para ${to}: ${subject}`);
    } catch (error) {
      this.logger.error(`❌ Erro ao enviar email para ${to}`);
    }
  }

  // Template base
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
        .btn { display: inline-block; background: #2563eb; color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; margin: 16px 0; }
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
          <p>CuidarBem © ${new Date().getFullYear()} - Cuidado com amor e profissionalismo</p>
          <p>Este é um email automático, não responda diretamente.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  // 1. Email de boas-vindas ao criar conta
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
          <a href="${process.env.FRONTEND_URL}/${isCaregiver ? 'perfil/cuidador' : 'cuidadores'}" class="btn">
            ${isCaregiver ? 'Completar Meu Perfil' : 'Buscar Cuidadores'}
          </a>
        </div>

        <p style="color: #64748b; font-size: 14px; margin-top: 24px;">
          Se tiver dúvidas, acesse nossa <a href="${process.env.FRONTEND_URL}/seguranca" style="color: #2563eb;">página de segurança</a> 
          ou entre em contato pelo email <strong>suporte@cuidarbem.com.br</strong>.
        </p>
      </div>
    `;

    await this.sendMail(
      data.to,
      `🎉 Bem-vindo ao CuidarBem, ${data.name}!`,
      this.baseTemplate(content),
    );
  }

  // 2. Email para cuidador quando recebe nova solicitação
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
          Você recebeu uma nova solicitação de atendimento. Confira os detalhes abaixo:
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
          <a href="${process.env.FRONTEND_URL}/dashboard" class="btn btn-accent">
            Ver no Dashboard
          </a>
        </div>

        <p style="color: #64748b; font-size: 14px; margin-top: 24px; text-align: center;">
          ⚠️ Acesse o dashboard para <strong>aceitar</strong> ou <strong>recusar</strong> a solicitação.
        </p>
      </div>
    `;

    await this.sendMail(
      data.to,
      `📋 Nova Solicitação: ${data.serviceName} - ${data.clientName}`,
      this.baseTemplate(content),
    );
  }

  // 3. Email para cliente quando faz solicitação
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
            2. Após confirmação, você receberá o link de pagamento<br>
            3. O pagamento fica retido até a conclusão do serviço
          </p>
        </div>

        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL}/dashboard" class="btn">
            Acompanhar no Dashboard
          </a>
        </div>
      </div>
    `;

    await this.sendMail(
      data.to,
      `✅ Solicitação Enviada - ${data.serviceName}`,
      this.baseTemplate(content),
    );
  }

  // 4. Email de pagamento (já existente, atualizado)
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
          Ótima notícia! O cuidador <strong>${data.caregiverName}</strong> 
          confirmou seu agendamento. Para garantir o atendimento, realize o pagamento abaixo:
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
            ⚠️ <strong>Importante:</strong> O pagamento ficará retido na plataforma 
            até a conclusão do serviço. Sua segurança é nossa prioridade.
          </p>
        </div>
      </div>
    `;

    await this.sendMail(
      data.to,
      `💳 Pagamento Pendente - R$ ${data.amount.toFixed(2)}`,
      this.baseTemplate(content),
    );
  }

  // 5. Email de confirmação de pagamento
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
          Seu pagamento de <strong>R$ ${data.amount.toFixed(2)}</strong> foi confirmado com sucesso!
        </p>

        <p style="color: #475569; line-height: 1.6;">
          O atendimento com <strong>${data.caregiverName}</strong> está garantido para <strong>${data.bookingDate}</strong>.
        </p>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin: 16px 0;">
          <p style="color: #166534; margin: 0;">
            🔒 O valor ficará retido na plataforma e será liberado ao cuidador 
            após a conclusão do serviço.
          </p>
        </div>

        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL}/dashboard" class="btn">
            Ver no Dashboard
          </a>
        </div>
      </div>
    `;

    await this.sendMail(
      data.to,
      `✅ Pagamento Confirmado - CuidarBem`,
      this.baseTemplate(content),
    );
  }

  // 6. Email de serviço concluído - para o CLIENTE
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
          foi marcado como concluído!
        </p>

        <p style="color: #475569; line-height: 1.6;">
          Esperamos que a experiência tenha sido excelente. Sua avaliação é muito importante 
          para ajudar outros clientes e valorizar o trabalho do cuidador.
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.FRONTEND_URL}/cuidadores/${data.caregiverId}?avaliar=${data.bookingId}" class="btn btn-accent" style="font-size: 16px;">
            ⭐ Avaliar Cuidador
          </a>
        </div>

        <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 16px; margin: 16px 0;">
          <p style="color: #0369a1; margin: 0; font-size: 14px;">
            💡 <strong>Dica:</strong> Avaliações honestas ajudam a comunidade CuidarBem 
            a encontrar os melhores profissionais!
          </p>
        </div>
      </div>
    `;

    await this.sendMail(
      data.to,
      `🎉 Serviço Concluído - Avalie ${data.caregiverName}!`,
      this.baseTemplate(content),
    );
  }

  // 7. Email de serviço concluído - para o CUIDADOR (pagamento liberado)
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
          <a href="${process.env.FRONTEND_URL}/dashboard" class="btn">
            Ver Meus Pagamentos
          </a>
        </div>

        <p style="color: #64748b; font-size: 14px; margin-top: 24px; text-align: center;">
          Obrigado por fazer parte da comunidade CuidarBem! 💙
        </p>
      </div>
    `;

    await this.sendMail(
      data.to,
      `💰 Pagamento Liberado - R$ ${data.caregiverAmount.toFixed(2)}`,
      this.baseTemplate(content),
    );
  }

  // Método legado (mantido para compatibilidade)
  async sendServiceCompletedEmail(data: {
    toClient: string;
    toCaregiver: string;
    clientName: string;
    caregiverName: string;
    amount: number;
    platformFee: number;
    caregiverAmount: number;
  }) {
    await this.sendServiceCompletedToCaregiverEmail({
      to: data.toCaregiver,
      caregiverName: data.caregiverName,
      clientName: data.clientName,
      serviceName: 'Atendimento',
      amount: data.amount,
      platformFee: data.platformFee,
      caregiverAmount: data.caregiverAmount,
    });
  }
}