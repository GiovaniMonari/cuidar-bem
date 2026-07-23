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
import { EmailProducer } from 'src/queue/email.producer';

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
    private emailProducer: EmailProducer,
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
      await this.emailProducer.sendPaymentPending({
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

  // 2. O PROCESSADOR ASSÍNCRONO: Executado pelo PaymentsWorker em segundo plano (0.1.2)
  async processPaymentStatusChange(mpPaymentId: string): Promise<void> {
    this.logger.log(`⚙️ [Worker] Processando mudança de status do pagamento MP: ${mpPaymentId}`);
    
    const mpPaymentApi = new MPPayment(this.mpClient);

    try {
      // 1. Busca os dados em tempo real na API do MercadoPago (0.1.2)
      const mpPayment = await mpPaymentApi.get({ id: Number(mpPaymentId) });

      // 2. Localiza o registro do pagamento usando a referência externa gerada no checkout
      const payment = await this.paymentModel.findOne({
        transactionId: mpPayment.external_reference,
      });

      if (!payment) {
        this.logger.warn(`[Worker] Pagamento não encontrado no banco: ${mpPayment.external_reference}`);
        return;
      }

      // 3. IDEMPOTÊNCIA EM NÍVEL DE BANCO: Se o pagamento já foi aprovado e processado, ignora (0.1.4)
      if (payment.status === 'held' && mpPayment.status === 'approved') {
        this.logger.log(`✨ [Worker] O pagamento ${payment.transactionId} já estava marcado como aprovado/retido. Abortando.`);
        return;
      }

      payment.mpPaymentId = String(mpPayment.id);
      payment.mpStatus = mpPayment.status;

      // 4. Se foi aprovado, executa as alterações e notificações em cascata (0.1.6)
      if (mpPayment.status === 'approved') {
        const booking = await this.bookingsService.findOne(
          payment.bookingId.toString(),
        );

        payment.status = 'held';
        payment.paidAt = new Date();
        payment.history.push({
          status: payment.status,
          date: new Date(),
          description: 'Pagamento aprovado - valor retido na plataforma (Processado via Fila)',
        });

        const clientUser = booking?.clientId as any;
        const caregiver = booking?.caregiverId as any;

        // Dispara o e-mail de confirmação usando o produtor da fila que consertamos (0.1.2, 0.1.5)
        await this.emailProducer.sendPaymentConfirmed({
          to: clientUser?.email,
          clientName: clientUser?.name || 'Cliente',
          caregiverName: caregiver?.userId?.name || 'Cuidador',
          amount: payment.amount,
          bookingDate: new Date(booking?.startDate).toLocaleDateString('pt-BR'),
        });

        this.logger.log(`✅ [Worker] Pagamento ${payment.transactionId} aprovado, retido e e-mail enfileirado.`);
      } 
      else if (mpPayment.status === 'rejected') {
        payment.status = 'failed';
        payment.history.push({
          status: 'failed',
          date: new Date(),
          description: 'Pagamento rejeitado pelo MercadoPago',
        });
      } 
      else if (mpPayment.status === 'pending') {
        payment.history.push({
          status: 'pending',
          date: new Date(),
          description: 'Pagamento pendente de confirmação',
        });
      }

      // Salva as alterações no banco com segurança
      await payment.save();

    } catch (error: any) {
      this.logger.error(`❌ [Worker Error] Falha crítica ao processar pagamento MP ${mpPaymentId}: ${error.message}`);
      // Disparamos o throw aqui para o BullMQ saber que falhou e tentar novamente via backoff exponencial (0.1.5)
      throw error; 
    }
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
      await this.emailProducer.sendPaymentConfirmed({
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
