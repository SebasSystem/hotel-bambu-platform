import { describe, expect, it } from 'vitest';
import {
  CONSENT_COOKIE,
  CONSENT_MAX_AGE_SECONDS,
  CONSENT_POLICY_VERSION,
  consentCookieString,
  createConsent,
  hasConsent,
  parseConsentCookie,
  parseConsentValue,
} from './consent';

function cookieFor(value: object): string {
  return `foo=bar; ${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(value))}`;
}

describe('consent cookie', () => {
  it('denies every category by default', () => {
    expect(hasConsent('analytics', '')).toBe(false);
    expect(hasConsent('analytics', 'other=1')).toBe(false);
  });

  it('reads granted categories for the current policy version', () => {
    const cookie = cookieFor({
      v: CONSENT_POLICY_VERSION,
      id: 'c0ffee00c0ffee00c0ffee00',
      analytics: true,
      functional: false,
    });
    expect(hasConsent('analytics', cookie)).toBe(true);
    expect(hasConsent('functional', cookie)).toBe(false);
    expect(hasConsent('marketing', cookie)).toBe(false);
  });

  it('ignores consent given for an older policy version (asks again, 17.5.10)', () => {
    const cookie = cookieFor({ v: '0-old', id: 'c0ffee00c0ffee00c0ffee00', analytics: true });
    expect(parseConsentCookie(cookie)).toBeNull();
    expect(hasConsent('analytics', cookie)).toBe(false);
  });

  it('treats malformed or non-boolean values as no consent', () => {
    expect(parseConsentCookie(`${CONSENT_COOKIE}=%7Bnot-json`)).toBeNull();
    expect(hasConsent('analytics', `${CONSENT_COOKIE}=%7Bnot-json`)).toBe(false);
    const truthy = cookieFor({ v: CONSENT_POLICY_VERSION, id: 'x'.repeat(20), analytics: 'yes' });
    expect(hasConsent('analytics', truthy)).toBe(false);
    expect(parseConsentValue(undefined)).toBeNull();
  });

  it('creates a random, versioned decision with only explicit grants', () => {
    const a = createConsent({ functional: true, analytics: false });
    const b = createConsent({ functional: true, analytics: false });
    expect(a.v).toBe(CONSENT_POLICY_VERSION);
    expect(a.id).toMatch(/^[A-Za-z0-9_-]{16,64}$/);
    expect(a.id).not.toBe(b.id);
    expect(a).toMatchObject({ functional: true, analytics: false, marketing: false });
  });

  it('keeps the same random id when the visitor changes an earlier decision', () => {
    const first = createConsent({ functional: false, analytics: false });
    const second = createConsent({ functional: true, analytics: true }, first);
    expect(second.id).toBe(first.id);
    expect(second.analytics).toBe(true);
  });

  it('serialises a first-party, Lax, path-wide cookie that round-trips', () => {
    const state = createConsent({ functional: true, analytics: true });
    const cookie = consentCookieString(state, { secure: true });
    expect(cookie).toContain(`${CONSENT_COOKIE}=`);
    expect(cookie).toContain(`Max-Age=${CONSENT_MAX_AGE_SECONDS}`);
    expect(cookie).toContain('Path=/');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Secure');
    expect(consentCookieString(state, { secure: false })).not.toContain('Secure');
    const pair = cookie.split(';')[0] ?? '';
    expect(parseConsentCookie(pair)).toEqual(state);
  });
});
