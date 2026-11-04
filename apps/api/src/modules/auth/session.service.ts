import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AuthenticatedAdmin, AuthenticatedSession } from '../../common/request-context.js';
import {
  generateSessionToken,
  hashSessionToken,
  keyedHash,
  sessionExpiry,
} from './session-token.js';

export interface ClientMeta {
  ip: string;
  userAgent?: string | undefined;
}

export interface ResolvedSession {
  session: AuthenticatedSession;
  admin: AuthenticatedAdmin;
}

/** Writes lastSeenAt at most this often (idle tracking without a write per request). */
const TOUCH_INTERVAL_MS = 60_000;

/** Server-side sessions (requirement 16.1/16.2, ADR 0008). */
@Injectable()
export class SessionService {
  private readonly idleMs: number;
  private readonly absoluteMs: number;
  private readonly secret: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.idleMs = config.get('SESSION_IDLE_MINUTES', { infer: true }) * 60_000;
    this.absoluteMs = config.get('SESSION_ABSOLUTE_HOURS', { infer: true }) * 3_600_000;
    this.secret = config.get('SESSION_SECRET', { infer: true });
  }

  get absoluteLifetimeMs(): number {
    return this.absoluteMs;
  }

  async create(
    adminUserId: string,
    meta: ClientMeta,
    now = new Date(),
  ): Promise<{ token: string; session: AuthenticatedSession }> {
    const token = generateSessionToken();
    const session = await this.prisma.session.create({
      data: {
        tokenHash: hashSessionToken(token),
        adminUserId,
        expiresAt: new Date(now.getTime() + this.absoluteMs),
        lastSeenAt: now,
        createdAt: now,
        ipHash: keyedHash(this.secret, meta.ip),
        userAgentHash: meta.userAgent ? keyedHash(this.secret, meta.userAgent) : null,
      },
      select: { id: true, expiresAt: true },
    });
    return { token, session };
  }

  /** Valid session + active admin, or null. Expired sessions are deleted on sight. */
  async resolve(token: string, now = new Date()): Promise<ResolvedSession | null> {
    if (!token || token.length > 128) return null;
    const row = await this.prisma.session.findUnique({
      where: { tokenHash: hashSessionToken(token) },
      include: {
        adminUser: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            active: true,
            passwordChangedAt: true,
          },
        },
      },
    });
    if (!row) return null;

    const expiry = sessionExpiry(row, now, this.idleMs);
    const user = row.adminUser;
    if (expiry !== 'valid' || !user.active || user.passwordChangedAt > row.createdAt) {
      await this.prisma.session.deleteMany({ where: { id: row.id } });
      return null;
    }

    if (now.getTime() - row.lastSeenAt.getTime() >= TOUCH_INTERVAL_MS) {
      await this.prisma.session.updateMany({ where: { id: row.id }, data: { lastSeenAt: now } });
    }
    return {
      session: { id: row.id, expiresAt: row.expiresAt },
      admin: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }

  async revokeToken(token: string): Promise<void> {
    if (!token || token.length > 128) return;
    await this.prisma.session.deleteMany({ where: { tokenHash: hashSessionToken(token) } });
  }

  async revokeById(sessionId: string): Promise<void> {
    await this.prisma.session.deleteMany({ where: { id: sessionId } });
  }

  async revokeAllForUser(adminUserId: string): Promise<void> {
    await this.prisma.session.deleteMany({ where: { adminUserId } });
  }

  /** Housekeeping: removes sessions past their absolute or idle expiry. */
  async purgeExpired(now = new Date()): Promise<number> {
    const result = await this.prisma.session.deleteMany({
      where: {
        OR: [
          { expiresAt: { lte: now } },
          { lastSeenAt: { lte: new Date(now.getTime() - this.idleMs) } },
        ],
      },
    });
    return result.count;
  }
}
