import { describe, expect, it } from 'vitest';
import {
  csrfTokenFor,
  generateSessionToken,
  hashSessionToken,
  isValidCsrfToken,
  sessionExpiry,
} from './session-token.js';

const SECRET = 'test-secret-test-secret-test-secret-1234';
const IDLE_MS = 30 * 60_000;

describe('session tokens', () => {
  it('generates distinct 256-bit url-safe tokens', () => {
    const a = generateSessionToken();
    const b = generateSessionToken();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('stores a deterministic SHA-256 hash, never the token', () => {
    const token = generateSessionToken();
    expect(hashSessionToken(token)).toBe(hashSessionToken(token));
    expect(hashSessionToken(token)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashSessionToken(token)).not.toContain(token);
  });
});

describe('sessionExpiry', () => {
  const created = new Date('2026-11-04T10:00:00Z');
  const session = {
    createdAt: created,
    lastSeenAt: created,
    expiresAt: new Date('2026-11-04T22:00:00Z'),
  };

  it('is valid inside both windows', () => {
    expect(sessionExpiry(session, new Date('2026-11-04T10:29:00Z'), IDLE_MS)).toBe('valid');
  });

  it('expires after the idle window without activity', () => {
    expect(sessionExpiry(session, new Date('2026-11-04T10:30:00Z'), IDLE_MS)).toBe('idle');
  });

  it('activity extends the idle window but never the absolute expiry', () => {
    const active = { ...session, lastSeenAt: new Date('2026-11-04T21:59:00Z') };
    expect(sessionExpiry(active, new Date('2026-11-04T21:59:30Z'), IDLE_MS)).toBe('valid');
    expect(sessionExpiry(active, new Date('2026-11-04T22:00:00Z'), IDLE_MS)).toBe('absolute');
  });
});

describe('CSRF token', () => {
  it('accepts the token of the same session only', () => {
    const token = csrfTokenFor(SECRET, 'session-a');
    expect(isValidCsrfToken(SECRET, 'session-a', token)).toBe(true);
    expect(isValidCsrfToken(SECRET, 'session-b', token)).toBe(false);
    expect(isValidCsrfToken('another-secret-another-secret-12345', 'session-a', token)).toBe(false);
  });

  it('rejects missing, empty or oversized values', () => {
    expect(isValidCsrfToken(SECRET, 'session-a', undefined)).toBe(false);
    expect(isValidCsrfToken(SECRET, 'session-a', '')).toBe(false);
    expect(isValidCsrfToken(SECRET, 'session-a', 'x'.repeat(500))).toBe(false);
  });
});
