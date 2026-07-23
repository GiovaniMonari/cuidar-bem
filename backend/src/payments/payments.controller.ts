import { Controller, Post, Body, HttpCode, HttpStatus, Logger, UseGuards, Get, Param, Req } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PAYMENTS_QUEUE } from '../queue/queue.constants';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    // 📦 Injeta a fila de pagamentos do BullMQ de forma correta
    @InjectQueue(PAYMENTS_QUEUE) private readonly paymentsQueue: Queue,
  ) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK) // Sempre retorna 200 rápido para o MercadoPago (0.1.5)
  async handleWebhook(@Body() body: any) {
    this.logger.log(`🔔 Webhook HTTP recebido: ${JSON.stringify(body)}`);

    // Verifica se a notificação é de fato sobre um pagamento válido
    if (body.type === 'payment' && body.data?.id) {
      const paymentId = String(body.data.id);

      try {
        // ENFILEIRAMENTO COM IDEMPOTÊNCIA: Define o 'jobId' igual ao ID do pagamento.
        // O Redis descarta na hora qualquer tentativa duplicada enviada em paralelo (0.1.4, 0.1.6)
        await this.paymentsQueue.add(
          'process-payment-update',
          { paymentId },
          { jobId: `mp:${paymentId}` } 
        );

        this.logger.log(`🚀 Webhook do pagamento ${paymentId} enviado para a fila.`);
        return { enqueued: true };
      } catch (error: any) {
        this.logger.error(`❌ Erro ao enfileirar webhook do pagamento ${paymentId}: ${error.message}`);
      }
    }

    // Retorna sucesso padrão mesmo para tipos ignorados (ex: merchant_order) para não gerar retries do MP
    return { received: true };
  }

  // Buscar pagamento de um booking
  @UseGuards(JwtAuthGuard)
  @Get('booking/:bookingId')
  findByBooking(@Param('bookingId') bookingId: string) {
    return this.paymentsService.findByBooking(bookingId);
  }

  // Listar meus pagamentos
  @UseGuards(JwtAuthGuard)
  @Get('my')
  findMy(@Req() req) {
    return this.paymentsService.findByUser(req.user.userId, req.user.role);
  }

  // Gerar pagamento PIX direto via Mercado Pago
  @UseGuards(JwtAuthGuard)
  @Post('pix/:bookingId')
  generatePix(@Param('bookingId') bookingId: string) {
    return this.paymentsService.generatePixPayment(bookingId);
  }

  // Simular pagamento (para testes)
  @UseGuards(JwtAuthGuard)
  @Post('simulate/:bookingId')
  simulatePayment(@Param('bookingId') bookingId: string) {
    return this.paymentsService.simulatePayment(bookingId);
  }
}