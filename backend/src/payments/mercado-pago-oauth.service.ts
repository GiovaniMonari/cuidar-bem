import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { Model } from 'mongoose';
import { Caregiver, CaregiverDocument } from '../caregivers/schemas/caregiver.schema';

type OAuthState = { userId: string; expiresAt: number; nonce: string };

@Injectable()
export class MercadoPagoOAuthService {
  private readonly logger = new Logger(MercadoPagoOAuthService.name);

  constructor(
    @InjectModel(Caregiver.name)
    private readonly caregiverModel: Model<CaregiverDocument>,
  ) {}

  getAuthorizationUrl(userId: string): string {
    const clientId = this.requiredEnv('MP_CLIENT_ID');
    const redirectUri = this.redirectUri();
    const state = this.signState({
      userId,
      expiresAt: Date.now() + 10 * 60 * 1000,
      nonce: randomBytes(16).toString('hex'),
    });
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      platform_id: 'mp',
      redirect_uri: redirectUri,
      state,
    });
    return `https://auth.mercadopago.com/authorization?${params.toString()}`;
  }

  async handleCallback(code: string, state: string): Promise<string> {
    const { userId } = this.verifyState(state);
    if (!code) throw new BadRequestException('Código OAuth não informado.');

    const body = new URLSearchParams({
      client_id: this.requiredEnv('MP_CLIENT_ID'),
      client_secret: this.requiredEnv('MP_CLIENT_SECRET'),
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.redirectUri(),
    });

    const response = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const data = await response.json() as {
      user_id?: number;
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      message?: string;
    };

    if (!response.ok || !data.user_id || !data.access_token || !data.refresh_token) {
      this.logger.error(`Falha ao trocar code OAuth: ${data.message || response.statusText}`);
      throw new BadRequestException('Não foi possível conectar a conta Mercado Pago.');
    }

    await this.caregiverModel.findOneAndUpdate(
      { userId },
      {
        $set: {
          mercadoPago: {
            userId: String(data.user_id),
            accessTokenEncrypted: this.encrypt(data.access_token),
            refreshTokenEncrypted: this.encrypt(data.refresh_token),
            expiresAt: data.expires_in
              ? new Date(Date.now() + data.expires_in * 1000)
              : undefined,
            connectedAt: new Date(),
          },
        },
      },
      { new: true },
    );

    return `${this.getFrontendUrl()}/perfil?mercadopago=connected`;
  }

  isConnected(connection?: { userId?: string }): boolean {
    return Boolean(connection?.userId);
  }

  decryptToken(value: string): string {
    const [ivHex, tagHex, encrypted] = value.split(':');
    const decipher = createDecipheriv('aes-256-gcm', this.encryptionKey(), Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    return Buffer.concat([decipher.update(Buffer.from(encrypted, 'hex')), decipher.final()]).toString('utf8');
  }

  private encrypt(value: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey(), iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    return `${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${encrypted.toString('hex')}`;
  }

  private signState(state: OAuthState): string {
    const payload = Buffer.from(JSON.stringify(state)).toString('base64url');
    const signature = createHmac('sha256', this.stateSecret()).update(payload).digest('base64url');
    return `${payload}.${signature}`;
  }

  private verifyState(value: string): OAuthState {
    const [payload, signature] = value.split('.');
    if (!payload || !signature) throw new BadRequestException('State OAuth inválido.');
    const expected = createHmac('sha256', this.stateSecret()).update(payload).digest('base64url');
    const valid = signature.length === expected.length && timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    if (!valid) throw new BadRequestException('State OAuth inválido.');
    const state = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as OAuthState;
    if (!state.userId || state.expiresAt < Date.now()) throw new BadRequestException('State OAuth expirado.');
    return state;
  }

  private encryptionKey(): Buffer {
    return createHmac('sha256', this.requiredEnv('MP_OAUTH_ENCRYPTION_KEY')).update('mercado-pago-tokens').digest();
  }

  private stateSecret(): string {
    return this.requiredEnv('MP_OAUTH_STATE_SECRET');
  }

  private redirectUri(): string {
    return process.env.MP_OAUTH_REDIRECT_URI || `${process.env.BACKEND_URL}/api/payments/oauth/callback`;
  }

  getFrontendUrl(): string {
    return process.env.FRONTEND_URL || 'http://localhost:3000';
  }

  private requiredEnv(name: string): string {
    const value = process.env[name];
    if (!value) throw new InternalServerErrorException(`Variável ${name} não configurada.`);
    return value;
  }
}