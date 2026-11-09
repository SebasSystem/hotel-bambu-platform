import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ChangePasswordInput, LoginInput } from '@hotel-bambu/shared';
import type { Env } from '../../config/env.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AuthenticatedAdmin, AuthenticatedSession } from '../../common/request-context.js';
import { AuditService } from '../audit/audit.service.js';
import { AUTHENTICATED_ADMIN_SELECT, toAuthenticatedAdmin } from './authenticated-admin.js';
import { FixedWindowLimiter, isLocked, nextLockoutState } from './login-throttle.js';
import {
  PASSWORD_POLICY_MESSAGES,
  checkPasswordPolicy,
  hashPassword,
  verifyPassword,
} from './password.js';
import { SessionService, type ClientMeta } from './session.service.js';

/** Same message for unknown email, wrong password, locked or inactive account (no enumeration). */
export const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password.';
const PER_ACCOUNT_IP_LIMIT = 10;
const PER_ACCOUNT_IP_WINDOW_MS = 15 * 60_000;

export interface LoginResult {
  token: string;
  session: AuthenticatedSession;
  admin: AuthenticatedAdmin;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger('Security');
  private readonly maxAttempts: number;
  private readonly lockMs: number;
  private readonly limiter = new FixedWindowLimiter(PER_ACCOUNT_IP_LIMIT, PER_ACCOUNT_IP_WINDOW_MS);
  /** Hash verified when the account does not exist, so response time does not reveal it. */
  private dummyHash: Promise<string> | undefined;

  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: SessionService,
    private readonly audit: AuditService,
    config: ConfigService<Env, true>,
  ) {
    this.maxAttempts = config.get('LOGIN_MAX_ATTEMPTS', { infer: true });
    this.lockMs = config.get('LOGIN_LOCK_MINUTES', { infer: true }) * 60_000;
  }

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= hashPassword('timing-equalizer-not-a-real-password');
    return this.dummyHash;
  }

  async login(input: LoginInput, meta: ClientMeta, now = new Date()): Promise<LoginResult> {
    if (!this.limiter.hit(`${meta.ip}|${input.email}`, now.getTime())) {
      this.logger.warn({ event: 'login_rate_limited', ip: meta.ip }, 'Login rate limited');
      throw new HttpException(
        'Too many login attempts. Try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const user = await this.prisma.adminUser.findUnique({
      where: { email: input.email },
      select: {
        ...AUTHENTICATED_ADMIN_SELECT,
        active: true,
        passwordHash: true,
        lockedUntil: true,
      },
    });

    if (!user) {
      await verifyPassword(await this.getDummyHash(), input.password);
      this.logger.warn(
        { event: 'login_failed', reason: 'unknown_account', ip: meta.ip },
        'Login failed',
      );
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    if (isLocked(user.lockedUntil, now)) {
      await verifyPassword(await this.getDummyHash(), input.password);
      this.logger.warn(
        { event: 'login_failed', reason: 'locked', adminUserId: user.id, ip: meta.ip },
        'Login failed',
      );
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const passwordOk = await verifyPassword(user.passwordHash, input.password);
    if (!passwordOk || !user.active) {
      await this.registerFailure(user.id, meta, now);
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    await this.prisma.adminUser.update({
      where: { id: user.id },
      data: { failedAttempts: 0, lockedUntil: null, lastLoginAt: now },
    });
    this.limiter.reset(`${meta.ip}|${input.email}`);
    const { token, session } = await this.sessions.create(user.id, meta, now);
    await this.audit.record(user.id, {
      action: 'auth.login',
      entity: 'AdminUser',
      entityId: user.id,
    });
    return {
      token,
      session,
      admin: toAuthenticatedAdmin(user),
    };
  }

  private async registerFailure(adminUserId: string, meta: ClientMeta, now: Date): Promise<void> {
    const { failedAttempts } = await this.prisma.adminUser.update({
      where: { id: adminUserId },
      data: { failedAttempts: { increment: 1 } },
      select: { failedAttempts: true },
    });
    const next = nextLockoutState(failedAttempts, this.maxAttempts, this.lockMs, now);
    if (next.lockedUntil) {
      await this.prisma.adminUser.update({ where: { id: adminUserId }, data: next });
      this.logger.warn({ event: 'account_locked', adminUserId, ip: meta.ip }, 'Account locked');
      await this.audit.record(null, {
        action: 'auth.lockout',
        entity: 'AdminUser',
        entityId: adminUserId,
        summary: { lockedUntil: next.lockedUntil.toISOString() },
      });
    } else {
      this.logger.warn(
        { event: 'login_failed', reason: 'bad_password', adminUserId, ip: meta.ip },
        'Login failed',
      );
    }
  }

  /**
   * Verifies the current password, applies the policy, revokes every session of the admin
   * (including the current one) and opens a fresh session (identifier rotation, 16.1).
   */
  async changePassword(
    admin: AuthenticatedAdmin,
    input: ChangePasswordInput,
    meta: ClientMeta,
  ): Promise<{ token: string; session: AuthenticatedSession }> {
    const user = await this.prisma.adminUser.findUniqueOrThrow({
      where: { id: admin.id },
      select: { passwordHash: true, email: true },
    });
    if (!(await verifyPassword(user.passwordHash, input.currentPassword))) {
      this.logger.warn(
        { event: 'password_change_failed', adminUserId: admin.id },
        'Wrong current password',
      );
      throw new UnprocessableEntityException({
        message: 'Current password is incorrect.',
        details: [
          { path: 'currentPassword', message: 'Current password is incorrect.', code: 'invalid' },
        ],
      });
    }
    const violations = checkPasswordPolicy(input.newPassword, user.email);
    if (input.newPassword === input.currentPassword) violations.push('too_simple');
    if (violations.length > 0) {
      throw new UnprocessableEntityException({
        message: 'Password does not meet the policy.',
        details: violations.map((v) => ({
          path: 'newPassword',
          message:
            input.newPassword === input.currentPassword && v === 'too_simple'
              ? 'New password must differ from the current one.'
              : PASSWORD_POLICY_MESSAGES[v],
          code: v,
        })),
      });
    }

    const passwordHash = await hashPassword(input.newPassword);
    const changedAt = new Date();
    await this.prisma.$transaction([
      this.prisma.adminUser.update({
        where: { id: admin.id },
        data: { passwordHash, passwordChangedAt: changedAt, failedAttempts: 0, lockedUntil: null },
      }),
      this.prisma.session.deleteMany({ where: { adminUserId: admin.id } }),
    ]);
    this.logger.warn({ event: 'password_changed', adminUserId: admin.id }, 'Password changed');
    await this.audit.record(admin.id, {
      action: 'auth.password_change',
      entity: 'AdminUser',
      entityId: admin.id,
    });
    return this.sessions.create(admin.id, meta, new Date(changedAt.getTime() + 1));
  }
}
