import { describe, expect, it } from 'vitest';
import { loginSchema } from '../auth/auth.js';
import {
  analyticsEventSchema,
  consentSchema,
  revalidateRequestSchema,
  roomCacheTag,
} from './public.js';

describe('public schemas', () => {
  it('accepts only whitelisted analytics events and sources', () => {
    expect(analyticsEventSchema.safeParse({ type: 'WHATSAPP_CLICK', source: 'hero' }).success).toBe(
      true,
    );
    expect(analyticsEventSchema.safeParse({ type: 'PURCHASE' }).success).toBe(false);
    expect(analyticsEventSchema.safeParse({ type: 'PAGE_VIEW', source: 'https://x' }).success).toBe(
      false,
    );
    expect(
      analyticsEventSchema.safeParse({ type: 'ROOM_VIEW', entityId: 'Juan Pérez' }).success,
    ).toBe(false);
  });

  it('validates consent evidence without personal data', () => {
    const valid = {
      consentId: 'c0ffee00c0ffee00c0ffee00',
      policyVersion: '2026-11',
      categories: { functional: true, analytics: false, marketing: false },
    };
    expect(consentSchema.safeParse(valid).success).toBe(true);
    expect(consentSchema.safeParse({ ...valid, ip: '1.2.3.4' }).success).toBe(false);
    expect(consentSchema.safeParse({ ...valid, consentId: 'short' }).success).toBe(false);
  });

  it('builds and validates cache tags', () => {
    expect(roomCacheTag('suite-101')).toBe('room:suite-101');
    expect(
      revalidateRequestSchema.safeParse({ tags: ['rooms', roomCacheTag('suite-101')] }).success,
    ).toBe(true);
    expect(revalidateRequestSchema.safeParse({ tags: ['<script>'] }).success).toBe(false);
  });

  it('normalizes the login email', () => {
    expect(loginSchema.parse({ email: ' Admin@Example.TEST ', password: 'x' }).email).toBe(
      'admin@example.test',
    );
  });
});
