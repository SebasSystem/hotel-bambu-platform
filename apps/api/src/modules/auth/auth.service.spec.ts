import { HttpException, UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService, INVALID_CREDENTIALS_MESSAGE } from './auth.service.js';
import { hashPassword } from './password.js';

const PASSWORD = 'correct horse battery staple';
const NOW = new Date('2026-11-04T12:00:00Z');
const META = { ip: '203.0.113.7', userAgent: 'vitest' };

interface FakeUser {
  id: string;
  email: string;
  name: string | null;
  role: { id: string; name: string; permissions: string[]; isSystem: boolean };
  active: boolean;
  passwordHash: string;
  failedAttempts: number;
  lockedUntil: Date | null;
  lastLoginAt: Date | null;
}

let passwordHash: string;

function setup(overrides: Partial<FakeUser> = {}) {
  const user: FakeUser = {
    id: 'admin-1',
    email: 'admin@example.test',
    name: null,
    role: { id: 'role-1', name: 'Editor', permissions: ['rooms.manage'], isSystem: false },
    active: true,
    passwordHash,
    failedAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
    ...overrides,
  };
  const prisma = {
    adminUser: {
      findUnique: vi.fn(async ({ where }: { where: { email: string } }) =>
        where.email === user.email ? { ...user } : null,
      ),
      update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        for (const [key, value] of Object.entries(data)) {
          if (value && typeof value === 'object' && 'increment' in value) {
            const counters = user as unknown as Record<string, number>;
            counters[key] = (counters[key] ?? 0) + (value as { increment: number }).increment;
          } else {
            (user as unknown as Record<string, unknown>)[key] = value;
          }
        }
        return { ...user };
      }),
    },
  };
  const sessions = {
    create: vi.fn(async () => ({
      token: 'token',
      session: { id: 'session-1', expiresAt: new Date(NOW.getTime() + 3_600_000) },
    })),
  };
  const audit = { record: vi.fn(async () => undefined) };
  const config = {
    get: (key: string) => ({ LOGIN_MAX_ATTEMPTS: 3, LOGIN_LOCK_MINUTES: 15 })[key],
  };
  const service = new AuthService(
    prisma as never,
    sessions as never,
    audit as never,
    config as never,
  );
  return { service, user, sessions, audit };
}

async function expectInvalid(promise: Promise<unknown>) {
  const error = await promise.catch((e: unknown) => e);
  expect(error).toBeInstanceOf(UnauthorizedException);
  expect((error as UnauthorizedException).message).toBe(INVALID_CREDENTIALS_MESSAGE);
}

describe('AuthService.login', () => {
  beforeEach(async () => {
    passwordHash ??= await hashPassword(PASSWORD);
  });

  it('opens a session and resets counters on success', async () => {
    const { service, user, sessions } = setup({ failedAttempts: 2 });
    const result = await service.login({ email: user.email, password: PASSWORD }, META, NOW);
    expect(result.admin).toEqual({
      id: 'admin-1',
      email: user.email,
      name: null,
      role: { id: 'role-1', name: 'Editor' },
      permissions: ['rooms.view', 'rooms.manage'],
    });
    expect(sessions.create).toHaveBeenCalledWith('admin-1', META, NOW);
    expect(user.failedAttempts).toBe(0);
    expect(user.lastLoginAt).toEqual(NOW);
  });

  it('answers the same generic error for an unknown email and a wrong password', async () => {
    const { service } = setup();
    await expectInvalid(
      service.login({ email: 'nobody@example.test', password: PASSWORD }, META, NOW),
    );
    await expectInvalid(
      service.login({ email: 'admin@example.test', password: 'wrong password!' }, META, NOW),
    );
  });

  it('locks the account after the configured number of failures', async () => {
    const { service, user, audit } = setup();
    for (let i = 0; i < 3; i += 1) {
      await expectInvalid(
        service.login({ email: user.email, password: 'wrong password!' }, META, NOW),
      );
    }
    expect(user.lockedUntil).toEqual(new Date(NOW.getTime() + 15 * 60_000));
    expect(audit.record).toHaveBeenCalledWith(
      null,
      expect.objectContaining({ action: 'auth.lockout' }),
    );

    // Even the right password is refused while locked, with the same message.
    await expectInvalid(service.login({ email: user.email, password: PASSWORD }, META, NOW));
  });

  it('accepts the right password again once the lock expires', async () => {
    const { service, user } = setup({ lockedUntil: new Date(NOW.getTime() - 1) });
    await expect(
      service.login({ email: user.email, password: PASSWORD }, META, NOW),
    ).resolves.toMatchObject({
      token: 'token',
    });
    expect(user.lockedUntil).toBeNull();
  });

  it('refuses inactive accounts generically', async () => {
    const { service, user } = setup({ active: false });
    await expectInvalid(service.login({ email: user.email, password: PASSWORD }, META, NOW));
  });

  it('rate limits repeated attempts for the same IP and account with 429', async () => {
    const { service, user } = setup({ lockedUntil: new Date(NOW.getTime() + 3_600_000) });
    for (let i = 0; i < 10; i += 1) {
      await expectInvalid(
        service.login({ email: user.email, password: 'wrong password!' }, META, NOW),
      );
    }
    const error = await service
      .login({ email: user.email, password: 'wrong password!' }, META, NOW)
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(HttpException);
    expect((error as HttpException).getStatus()).toBe(429);
  });
});
