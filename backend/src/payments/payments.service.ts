import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MercadoPagoConfig, Preference, Payment as MPPayment } from 'mercadopago';
import { v4 as uuidv4 } from 'uuid';
import { Payment, PaymentDocument } from './schemas/payment.schema';
import { BookingsService } from '../bookings/bookings.service';
import { CaregiversService } from '../caregivers/caregivers.service';
import { UsersService } from '../users/schemas/users.service';
import { EmailService } from '../email/email.service';

const PLATFORM_FEE_PERCENT = 10; // 10% taxa da plataforma

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

  // Calcular valores
  private calculateAmounts(totalAmount: number) {
    const platformFee = Math.round(totalAmount * PLATFORM_FEE_PERCENT) / 100;
    const caregiverAmount = totalAmount - platformFee;
    return { platformFee, caregiverAmount };
  }

  // 1. Criar cobrança quando cuidador aceita o agendamento
  async createPayment(bookingId: string): Promise<PaymentDocument> {
    const booking = await this.bookingsService.findOne(bookingId);
    if (!booking) throw new NotFoundException('Agendamento não encontrado');

    // Verificar se já existe pagamento
    const existing = await this.paymentModel.findOne({ bookingId });
    if (existing) return existing;

    // Calcular horas e valor
    const start = new Date(booking.startDate);
    const end = new Date(booking.endDate);
    const hours = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60)));
    const caregiver = booking.caregiverId as any;
    const hourlyRate = caregiver?.hourlyRate || 50;
    const totalAmount = hours * hourlyRate;

    const { platformFee, caregiverAmount } = this.calculateAmounts(totalAmount);
    const transactionId = `CB-${uuidv4().substring(0, 8).toUpperCase()}`;

    // Criar preferência no Mercado Pago
    const preference = new Preference(this.mpClient);
    const caregiverName = caregiver?.userId?.name || 'Cuidador';
    const clientUser = booking.clientId as any;

    let mpPreference: any;

    try {
      mpPreference = await preference.create({
        body: {
          items: [
            {
              id: transactionId,
              title: `CuidarBem - Atendimento com ${caregiverName}`,
              description: `${hours}h de cuidado - ${booking.careType || 'Atendimento domiciliar'}`,
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
          payment_methods: {
            installments: 3,
            excluded_payment_types: [],
          },
        },
      });
    } catch (error) {
      this.logger.error(`Erro Mercado Pago: ${error.message}`);
      // Criar pagamento mesmo sem MP (para testes)
      mpPreference = {
        id: `test-${transactionId}`,
        init_point: '#',
        sandbox_init_point: '#',
      };
    }

    // Salvar pagamento
    const payment = new this.paymentModel({
      transactionId,
      bookingId: booking._id,
      clientId: clientUser?._id,
      caregiverId: caregiver?._id,
      amount: totalAmount,
      platformFee,
      caregiverAmount,
      status: 'pending',
      mpPreferenceId: mpPreference.id,
      paymentUrl: mpPreference.init_point || mpPreference.sandbox_init_point,
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

    // Enviar email para o cliente
    await this.emailService.sendPaymentEmail({
      to: clientUser?.email,
      clientName: clientUser?.name || booking.clientName || 'Cliente',
      caregiverName,
      amount: totalAmount,
      paymentUrl: mpPreference.init_point || mpPreference.sandbox_init_point || '#',
      bookingDate: start.toLocaleDateString('pt-BR'),
      serviceType: booking.careType || 'Atendimento domiciliar',
    });

    this.logger.log(`💳 Pagamento ${transactionId} criado: R$ ${totalAmount}`);
    return saved;
  }

  // 2. Webhook do Mercado Pago
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
          payment.status = 'held'; // Dinheiro retido no mediador
          payment.paidAt = new Date();
          payment.history.push({
            status: 'held',
            date: new Date(),
            description: 'Pagamento aprovado - valor retido na plataforma',
          });

          // Atualizar booking
          const booking = await this.bookingsService.findOne(
            payment.bookingId.toString(),
          );

          // Enviar email de confirmação
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
        this.logger.error(`Erro no webhook: ${error.message}`);
      }
    }
  }

  // 3. Liberar pagamento (quando serviço é concluído)
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

    // Enviar emails de conclusão
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

  // 4. Reembolso (quando cancela)
  async refundPayment(bookingId: string): Promise<PaymentDocument> {
    const payment = await this.paymentModel.findOne({ bookingId });
    if (!payment) throw new NotFoundException('Pagamento não encontrado');

    if (!['held', 'paid'].includes(payment.status)) {
      throw new BadRequestException('Pagamento não pode ser reembolsado');
    }

    // Reembolso via Mercado Pago
    if (payment.mpPaymentId) {
      try {
        const mpPaymentApi = new MPPayment(this.mpClient);
        await mpPaymentApi.cancel({ id: payment.mpPaymentId });
      } catch (error) {
        this.logger.error(`Erro no reembolso MP: ${error.message}`);
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

  // 5. Buscar pagamento por booking
  async findByBooking(bookingId: string): Promise<PaymentDocument | null> {
    return this.paymentModel.findOne({ bookingId });
  }

  // 6. Buscar todos os pagamentos de um usuário
  async findByUser(userId: string, role: string) {
    const query = role === 'client' ? { clientId: userId } : { caregiverId: userId };
    return this.paymentModel
      .find(query)
      .populate('bookingId')
      .sort({ createdAt: -1 });
  }

  // 7. Simular pagamento aprovado (para testes sem MP real)
  async simulatePayment(bookingId: string): Promise<PaymentDocument> {
    const payment = await this.paymentModel.findOne({ bookingId });
    if (!payment) throw new NotFoundException('Pagamento não encontrado');

    payment.status = 'held';
    payment.paidAt = new Date();
    payment.mpStatus = 'approved';
    payment.mpPaymentId = `SIM-${Date.now()}`;
    payment.history.push({
      status: 'held',
      date: new Date(),
      description: '(Simulado) Pagamento aprovado e retido',
    });

    await payment.save();

    // Enviar email de confirmação
    const booking = await this.bookingsService.findOne(bookingId);
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