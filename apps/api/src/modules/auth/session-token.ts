import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/** 256-bit opaque session token, sent only in the HttpOnly cookie. */
export function generateSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

/** Only this hash is stored (Session.tokenHash): a database leak does not reveal live tokens. */
export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

/**
 * CSRF token bound to the session (HMAC-based synchronizer token, OWASP "signed double submit"):
 * `HMAC-SHA256(SESSION_SECRET, "csrf:" + sessionId)`. Nothing extra is stored, a token from one
 * session is useless in another, and an attacker cannot mint one without the secret.
 */
export function csrfTokenFor(secret: string, sessionId: string): string {
  return createHmac('sha256', secret).update(`csrf:${sessionId}`).digest('base64url');
}

export function isValidCsrfToken(secret: string, sessionId: string, candidate: unknown): boolean {
  if (typeof candidate !== 'string' || candidate.length === 0 || candidate.length > 128)
    return false;
  const expected = Buffer.from(csrfTokenFor(secret, sessionId));
  const received = Buffer.from(candidate);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

/** Keyed hash for optional session metadata (never the raw IP / user agent). */
export function keyedHash(secret: string, value: string): string {
  return createHmac('sha256', secret).update(`meta:${value}`).digest('hex').slice(0, 32);
}

export interface SessionTimes {
  createdAt: Date;
  lastSeenAt: Date;
  expiresAt: Date;
}

export type SessionExpiry = 'valid' | 'absolute' | 'idle';

/** Absolute expiry (expiresAt) and idle expiry (lastSeenAt + idle window). */
export function sessionExpiry(session: SessionTimes, now: Date, idleMs: number): SessionExpiry {
  if (session.expiresAt.getTime() <= now.getTime()) return 'absolute';
  if (session.lastSeenAt.getTime() + idleMs <= now.getTime()) return 'idle';
  return 'valid';
}
