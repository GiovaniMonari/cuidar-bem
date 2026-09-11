import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AdminGuard } from './admin.guard';

describe('AdminGuard', () => {
  const context = (user: unknown) =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    }) as ExecutionContext;

  it('allows administrators', () => {
    expect(new AdminGuard().canActivate(context({ role: 'admin' }))).toBe(true);
  });

  it('rejects non-administrators', () => {
    expect(() => new AdminGuard().canActivate(context({ role: 'client' }))).toThrow(
      ForbiddenException,
    );
  });
});