import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.MAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
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
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f7fa; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 32px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .header p { color: rgba(255,255,255,0.8); margin: 8px 0 0; }
        .content { padding: 32px; }
        .greeting { font-size: 18px; color: #1e293b; margin-bottom: 16px; }
        .info-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 20px; margin: 20px 0; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0f2fe; }
        .info-row:last-child { border: none; }
        .info-label { color: #64748b; font-size: 14px; }
        .info-value { color: #1e293b; font-weight: 600; font-size: 14px; }
        .amount-box { background: linear-gradient(135deg, #2563eb, #1d4ed8); border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
        .amount-label { color: rgba(255,255,255,0.8); font-size: 14px; }
        .amount-value { color: white; font-size: 36px; font-weight: 700; margin: 8px 0; }
        .pay-button { display: inline-block; background: #22c55e; color: white; padding: 16px 48px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; margin: 24px 0; }
        .pix-box { background: #f0fdf4; border: 2px dashed #86efac; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
        .pix-label { color: #16a34a; font-weight: 600; margin-bottom: 8px; }
        .pix-key { background: white; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 14px; word-break: break-all; color: #1e293b; }
        .footer { background: #f8fafc; padding: 24px 32px; text-align: center; color: #94a3b8; font-size: 12px; }
        .warning { background: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; margin: 16px 0; color: #92400e; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💙 CuidarBem</h1>
          <p>Seu agendamento foi confirmado!</p>
        </div>
        
        <div class="content">
          <p class="greeting">Olá, <strong>${data.clientName}</strong>!</p>
          
          <p style="color: #475569; line-height: 1.6;">
            Ótima notícia! O cuidador <strong>${data.caregiverName}</strong> 
            confirmou seu agendamento. Para garantir o atendimento, 
            realize o pagamento abaixo:
          </p>

          <div class="info-box">
            <div class="info-row">
              <span class="info-label">Cuidador</span>
              <span class="info-value">${data.caregiverName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Data</span>
              <span class="info-value">${data.bookingDate}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Serviço</span>
              <span class="info-value">${data.serviceType}</span>
            </div>
          </div>

          <div class="amount-box">
            <div class="amount-label">Valor Total</div>
            <div class="amount-value">R$ ${data.amount.toFixed(2)}</div>
          </div>

          <div style="text-align: center;">
            <a href="${data.paymentUrl}" class="pay-button">
              💳 Pagar Agora
            </a>
          </div>

          ${data.pixKey ? `
          <div class="pix-box">
            <div class="pix-label">Ou pague via PIX</div>
            <div class="pix-key">${data.pixKey}</div>
            <p style="color: #16a34a; font-size: 12px; margin: 8px 0 0;">
              Copie a chave acima e cole no app do seu banco
            </p>
          </div>
          ` : ''}

          <div class="warning">
            ⚠️ <strong>Importante:</strong> O pagamento ficará retido na plataforma 
            até a conclusão do serviço. Sua segurança é nossa prioridade.
          </div>
        </div>

        <div class="footer">
          <p>CuidarBem © 2024 - Cuidado com amor e profissionalismo</p>
          <p>Este é um email automático, não responda.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.MAIL_FROM || '"CuidarBem" <noreply@cuidarbem.com>',
        to: data.to,
        subject: `✅ Agendamento Confirmado - Pagamento de R$ ${data.amount.toFixed(2)}`,
        html,
      });
      this.logger.log(`📧 Email de pagamento enviado para ${data.to}`);
    } catch (error) {
      this.logger.error(`❌ Erro ao enviar email: ${error.message}`);
    }
  }

  async sendPaymentConfirmedEmail(data: {
    to: string;
    clientName: string;
    caregiverName: string;
    amount: number;
    bookingDate: string;
  }) {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f7fa; margin: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #22c55e, #16a34a); padding: 32px; text-align: center; }
        .header h1 { color: white; margin: 0; }
        .content { padding: 32px; }
        .success-icon { font-size: 64px; text-align: center; margin: 16px 0; }
        .footer { background: #f8fafc; padding: 24px; text-align: center; color: #94a3b8; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💚 Pagamento Confirmado!</h1>
        </div>
        <div class="content">
          <div class="success-icon">✅</div>
          <p>Olá, <strong>${data.clientName}</strong>!</p>
          <p>Seu pagamento de <strong>R$ ${data.amount.toFixed(2)}</strong> foi confirmado.</p>
          <p>O atendimento com <strong>${data.caregiverName}</strong> está garantido para <strong>${data.bookingDate}</strong>.</p>
          <p style="background: #f0fdf4; padding: 16px; border-radius: 8px; color: #166534;">
            🔒 O valor ficará retido na plataforma e será liberado ao cuidador 
            após a conclusão do serviço.
          </p>
        </div>
        <div class="footer">CuidarBem © 2024</div>
      </div>
    </body>
    </html>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.MAIL_FROM || '"CuidarBem" <noreply@cuidarbem.com>',
        to: data.to,
        subject: '✅ Pagamento Confirmado - CuidarBem',
        html,
      });
      this.logger.log(`📧 Confirmação de pagamento enviada para ${data.to}`);
    } catch (error) {
      this.logger.error(`❌ Erro ao enviar email: ${error.message}`);
    }
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
    // Email para o cuidador
    const caregiverHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f7fa; margin: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 32px; text-align: center; }
        .header h1 { color: white; margin: 0; }
        .content { padding: 32px; }
        .amount { font-size: 36px; font-weight: 700; color: #22c55e; text-align: center; margin: 16px 0; }
        .footer { background: #f8fafc; padding: 24px; text-align: center; color: #94a3b8; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💰 Pagamento Liberado!</h1>
        </div>
        <div class="content">
          <p>Olá, <strong>${data.caregiverName}</strong>!</p>
          <p>O serviço para <strong>${data.clientName}</strong> foi concluído.</p>
          <div class="amount">R$ ${data.caregiverAmount.toFixed(2)}</div>
          <p style="text-align:center; color: #64748b;">Valor liberado para sua conta</p>
          <p style="background: #f0f9ff; padding: 12px; border-radius: 8px; font-size: 13px; color: #475569;">
            Valor total: R$ ${data.amount.toFixed(2)}<br>
            Taxa da plataforma (10%): R$ ${data.platformFee.toFixed(2)}<br>
            <strong>Seu valor: R$ ${data.caregiverAmount.toFixed(2)}</strong>
          </p>
        </div>
        <div class="footer">CuidarBem © 2024</div>
      </div>
    </body>
    </html>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.MAIL_FROM || '"CuidarBem" <noreply@cuidarbem.com>',
        to: data.toCaregiver,
        subject: '💰 Pagamento Liberado - CuidarBem',
        html: caregiverHtml,
      });
    } catch (error) {
      this.logger.error(`❌ Erro ao enviar email: ${error.message}`);
    }
  }
}