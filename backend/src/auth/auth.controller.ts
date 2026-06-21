import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RequestBanReviewDto } from './dto/request-ban-review.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ValidateResetTokenDto } from './dto/validate-reset-token.dto';
import { RateLimit } from './decorators/rate-limit.decorator';
import { RateLimitGuard } from './guards/rate-limit.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  @UseGuards(RateLimitGuard)
  @RateLimit(5, 900, 'Muitas tentativas de login. Aguarde 15 minutos.')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('forgot-password')
  @UseGuards(RateLimitGuard)
  @RateLimit(3, 3600, 'Muitas solicitações de redefinição. Aguarde 1 hora.')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Post('validate-reset-token')
  validateResetToken(@Body() dto: ValidateResetTokenDto) {
    return this.authService.validatePasswordResetToken(dto.token);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @Post('request-ban-review')
  @UseGuards(RateLimitGuard)
  @RateLimit(2, 3600, 'Muitas solicitações de revisão. Aguarde 1 hora.')
  requestBanReview(@Body() dto: RequestBanReviewDto) {
    return this.authService.requestBanReview(dto.email, dto.message);
  }
}