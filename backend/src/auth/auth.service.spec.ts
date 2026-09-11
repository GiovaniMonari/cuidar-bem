import { ForbiddenException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const usersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    registerSuccessfulLogin: jest.fn(),
    findByValidPasswordResetToken: jest.fn(),
    resetPasswordWithToken: jest.fn(),
  };
  const jwtService = { sign: jest.fn().mockReturnValue('signed-token') };
  const emailProducer = {
    sendWelcome: jest.fn().mockResolvedValue(undefined),
    sendPasswordReset: jest.fn().mockResolvedValue(undefined),
  };
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(usersService as any, jwtService as any, emailProducer as any);
  });

  it('rejects public admin registration', async () => {
    await expect(service.register({ role: 'admin' } as any)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(usersService.create).not.toHaveBeenCalled();
  });

  it('rejects unknown login credentials', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await expect(service.login('unknown@example.com', 'secret')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('blocks banned accounts before issuing a token', async () => {
    usersService.findByEmail.mockResolvedValue({
      _id: 'user-1',
      email: 'user@example.com',
      password: await bcrypt.hash('Strong!123', 1),
      isActive: false,
      moderationStatus: 'banned',
      banReason: 'fraude',
    });

    await expect(service.login('user@example.com', 'Strong!123')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(jwtService.sign).not.toHaveBeenCalled();
    expect(usersService.registerSuccessfulLogin).not.toHaveBeenCalled();
  });

  it('logs in active users and returns the signed token', async () => {
    usersService.findByEmail.mockResolvedValue({
      _id: { toString: () => 'user-1' },
      email: 'user@example.com',
      name: 'User',
      password: await bcrypt.hash('Strong!123', 1),
      role: 'client',
      isActive: true,
      moderationStatus: 'approved',
    });

    await expect(service.login('user@example.com', 'Strong!123')).resolves.toMatchObject({
      access_token: 'signed-token',
      user: { id: expect.anything(), email: 'user@example.com' },
    });
    expect(usersService.registerSuccessfulLogin).toHaveBeenCalledWith('user-1');
  });

  it('rejects weak password resets before accessing the user record', async () => {
    await expect(service.resetPassword('token', '123')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(usersService.findByValidPasswordResetToken).not.toHaveBeenCalled();
  });
});