import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MercadoPagoConfig, Preference, Payment as MPPayment } from 'mercadopago';
import { v4 as uuidv4 } from 'uuid';
import { Payment, PaymentDocument } from './schemas/payment.schema';
import { BookingsService } from '../bookings/bookings.service';
import { CaregiversService } from '../caregivers/caregivers.service';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';

const PLATFORM_FEE_PERCENT = 10;

@Injectable()
export class PaymentsService {
  private mpClient: MercadoPagoConfig;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    private bookingsService: BookingsService,
    private caregiversService: CaregiversService,
    private usersService: UsersService,
    private emailService: EmailService,
  ) {
    this.mpClient = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN || '',
    });
  }

  private calculateAmounts(totalAmount: number) {
    const platformFee = Math.round(totalAmount * PLATFORM_FEE_PERCENT) / 100;
    const caregiverAmount = totalAmount - platformFee;
    return { platformFee, caregiverAmount };
  }

  async createPayment(bookingId: string): Promise<PaymentDocument> {
    const booking = await this.bookingsService.findOne(bookingId);
    if (!booking) throw new NotFoundException('Agendamento não encontrado');

    const existing = await this.paymentModel.findOne({ bookingId });
    if (existing) return existing;

    // Usar os valores já calculados no booking
    const totalAmount = booking.totalAmount || 0;
    const hours = booking.durationHours || 1;

    const { platformFee, caregiverAmount } = this.calculateAmounts(totalAmount);
    const transactionId = `CB-${uuidv4().substring(0, 8).toUpperCase()}`;

    const caregiver = booking.caregiverId as any;
    const caregiverName = caregiver?.userId?.name || 'Cuidador';
    const clientUser = booking.clientId as any;

    // Descrição usando os novos campos
    const serviceName = booking.serviceName || booking.serviceType || 'Atendimento domiciliar';
    const durationLabel = booking.durationLabel || `${hours}h`;

    const checkoutUrl = `${process.env.FRONTEND_URL}/pagamento/checkout?booking=${bookingId}`;

    let mpPreferenceId = '';
    let mpPaymentUrl = '';

    try {
      const preference = new Preference(this.mpClient);
      const mpPreference = await preference.create({
        body: {
          items: [
            {
              id: transactionId,
              title: `CuidarBem - ${serviceName}`,
              description: `${durationLabel} de cuidado com ${caregiverName}`,
              quantity: 1,
              unit_price: totalAmount,
              currency_id: 'BRL',
            },
          ],
          payer: {
            email: clientUser?.email || '',
            name: clientUser?.name || booking.clientName || '',
          },
          back_urls: {
            success: `${process.env.FRONTEND_URL}/pagamento/sucesso?booking=${bookingId}`,
            failure: `${process.env.FRONTEND_URL}/pagamento/erro?booking=${bookingId}`,
            pending: `${process.env.FRONTEND_URL}/pagamento/pendente?booking=${bookingId}`,
          },
          auto_return: 'approved',
          notification_url: `${process.env.BACKEND_URL}/api/payments/webhook`,
          external_reference: transactionId,
          statement_descriptor: 'CUIDARBEM',
        },
      });

      mpPreferenceId = mpPreference.id || '';
      mpPaymentUrl = mpPreference.init_point || mpPreference.sandbox_init_point || '';
      this.logger.log(`✅ Preferência MP criada: ${mpPreferenceId}`);
    } catch (error) {
      this.logger.warn(`⚠️ Mercado Pago indisponível`);
      this.logger.warn(`Usando checkout local: ${checkoutUrl}`);
    }

    const payment = new this.paymentModel({
      transactionId,
      bookingId: booking._id,
      clientId: clientUser?._id,
      caregiverId: caregiver?._id,
      amount: totalAmount,
      platformFee,
      caregiverAmount,
      status: 'pending',
      mpPreferenceId,
      paymentUrl: mpPaymentUrl || checkoutUrl,
      payerInfo: {
        email: clientUser?.email,
        name: clientUser?.name || booking.clientName,
      },
      history: [
        {
          status: 'pending',
          date: new Date(),
          description: 'Cobrança criada - aguardando pagamento',
        },
      ],
    });

    const saved = await payment.save();

    // Enviar email
    const start = new Date(booking.startDate);
    
    try {
      await this.emailService.sendPaymentEmail({
        to: clientUser?.email,
        clientName: clientUser?.name || booking.clientName || 'Cliente',
        caregiverName,
        amount: totalAmount,
        paymentUrl: checkoutUrl,
        bookingDate: start.toLocaleDateString('pt-BR'),
        serviceType: serviceName,
      });
    } catch (emailError) {
      this.logger.warn(`⚠️ Email não enviado`);
    }

    this.logger.log(`💳 Pagamento ${transactionId} criado: R$ ${totalAmount}`);
    return saved;
  }

  async handleWebhook(data: any) {
    this.logger.log(`🔔 Webhook recebido: ${JSON.stringify(data)}`);

    if (data.type === 'payment') {
      const mpPaymentApi = new MPPayment(this.mpClient);

      try {
        const mpPayment = await mpPaymentApi.get({ id: data.data.id });

        const payment = await this.paymentModel.findOne({
          transactionId: mpPayment.external_reference,
        });

        if (!payment) {
          this.logger.warn(`Pagamento não encontrado: ${mpPayment.external_reference}`);
          return;
        }

        payment.mpPaymentId = String(mpPayment.id);
        payment.mpStatus = mpPayment.status;

        if (mpPayment.status === 'approved') {
          const booking = await this.bookingsService.findOne(
            payment.bookingId.toString(),
          );

          payment.status = 'held';
          payment.paidAt = new Date();
          payment.history.push({
            status: payment.status,
            date: new Date(),
            description: 'Pagamento aprovado - valor retido na plataforma',
          });

          const clientUser = booking?.clientId as any;
          const caregiver = booking?.caregiverId as any;

          await this.emailService.sendPaymentConfirmedEmail({
            to: clientUser?.email,
            clientName: clientUser?.name || 'Cliente',
            caregiverName: caregiver?.userId?.name || 'Cuidador',
            amount: payment.amount,
            bookingDate: new Date(booking?.startDate).toLocaleDateString('pt-BR'),
          });

          this.logger.log(`✅ Pagamento ${payment.transactionId} aprovado e retido`);
        } else if (mpPayment.status === 'rejected') {
          payment.status = 'failed';
          payment.history.push({
            status: 'failed',
            date: new Date(),
            description: 'Pagamento rejeitado',
          });
        } else if (mpPayment.status === 'pending') {
          payment.history.push({
            status: 'pending',
            date: new Date(),
            description: 'Pagamento pendente de confirmação',
          });
        }

        await payment.save();
      } catch (error) {
        this.logger.error(`Erro no webhook`);
      }
    }
  }

  async releasePayment(bookingId: string): Promise<PaymentDocument> {
    const payment = await this.paymentModel.findOne({ bookingId });
    if (!payment) throw new NotFoundException('Pagamento não encontrado');

    if (payment.status !== 'held' && payment.status !== 'paid') {
      throw new BadRequestException(
        `Não é possível liberar pagamento com status: ${payment.status}`,
      );
    }

    payment.status = 'released';
    payment.releasedAt = new Date();
    payment.history.push({
      status: 'released',
      date: new Date(),
      description: `Valor de R$ ${payment.caregiverAmount.toFixed(2)} liberado para o cuidador`,
    });

    await payment.save();

    const booking = await this.bookingsService.findOne(bookingId);
    const clientUser = booking?.clientId as any;
    const caregiver = booking?.caregiverId as any;

    await this.emailService.sendServiceCompletedEmail({
      toClient: clientUser?.email,
      toCaregiver: caregiver?.userId?.email,
      clientName: clientUser?.name || 'Cliente',
      caregiverName: caregiver?.userId?.name || 'Cuidador',
      amount: payment.amount,
      platformFee: payment.platformFee,
      caregiverAmount: payment.caregiverAmount,
    });

    this.logger.log(`💰 Pagamento ${payment.transactionId} liberado: R$ ${payment.caregiverAmount}`);
    return payment;
  }

  async refundPayment(bookingId: string): Promise<PaymentDocument> {
    const payment = await this.paymentModel.findOne({ bookingId });
    if (!payment) throw new NotFoundException('Pagamento não encontrado');

    if (!['held', 'paid'].includes(payment.status)) {
      throw new BadRequestException('Pagamento não pode ser reembolsado');
    }

    if (payment.mpPaymentId) {
      try {
        const mpPaymentApi = new MPPayment(this.mpClient);
        await mpPaymentApi.cancel({ id: payment.mpPaymentId });
      } catch (error) {
        this.logger.error(`Erro no reembolso MP}`);
      }
    }

    payment.status = 'refunded';
    payment.refundedAt = new Date();
    payment.history.push({
      status: 'refunded',
      date: new Date(),
      description: `Reembolso de R$ ${payment.amount.toFixed(2)} realizado`,
    });

    await payment.save();
    this.logger.log(`↩️ Reembolso ${payment.transactionId}: R$ ${payment.amount}`);
    return payment;
  }

  async findByBooking(bookingId: string): Promise<PaymentDocument | null> {
    return this.paymentModel.findOne({ bookingId });
  }

  async findByUser(userId: string, role: string) {
    const query = role === 'client' ? { clientId: userId } : { caregiverId: userId };
    return this.paymentModel
      .find(query)
      .populate('bookingId')
      .sort({ createdAt: -1 });
  }

  async simulatePayment(bookingId: string): Promise<PaymentDocument> {
    const payment = await this.paymentModel.findOne({ bookingId });
    if (!payment) throw new NotFoundException('Pagamento não encontrado');

    const booking = await this.bookingsService.findOne(bookingId);

    payment.status = 'held';
    payment.paidAt = new Date();
    payment.mpStatus = 'approved';
    payment.mpPaymentId = `SIM-${Date.now()}`;
    payment.history.push({
      status: payment.status,
      date: new Date(),
      description: '(Simulado) Pagamento aprovado e retido',
    });

    await payment.save();

    const clientUser = booking?.clientId as any;
    const caregiver = booking?.caregiverId as any;

    if (clientUser?.email) {
      await this.emailService.sendPaymentConfirmedEmail({
        to: clientUser.email,
        clientName: clientUser.name || 'Cliente',
        caregiverName: caregiver?.userId?.name || 'Cuidador',
        amount: payment.amount,
        bookingDate: new Date(booking?.startDate).toLocaleDateString('pt-BR'),
      });
    }

    return payment;
  }
}
