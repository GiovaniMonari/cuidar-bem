import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // Webhook do Mercado Pago (sem auth)
  @Post('webhook')
  @HttpCode(200)
  async webhook(@Body() body: any) {
    await this.paymentsService.handleWebhook(body);
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
  findMy(@Request() req) {
    return this.paymentsService.findByUser(req.user.userId, req.user.role);
  }

  // Simular pagamento (para testes)
  @UseGuards(JwtAuthGuard)
  @Post('simulate/:bookingId')
  simulatePayment(@Param('bookingId') bookingId: string) {
    return this.paymentsService.simulatePayment(bookingId);
  }
}