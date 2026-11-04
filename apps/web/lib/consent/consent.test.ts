import { describe, expect, it } from 'vitest';
import { CONSENT_COOKIE, hasConsent, parseConsentCookie } from './consent';

describe('consent (stub completed in T7)', () => {
  it('denies every category by default', () => {
    expect(hasConsent('analytics', '')).toBe(false);
    expect(hasConsent('analytics', 'other=1')).toBe(false);
  });

  it('reads granted categories from the consent cookie', () => {
    const value = encodeURIComponent(
      JSON.stringify({ v: '1', analytics: true, functional: false }),
    );
    const cookie = `foo=bar; ${CONSENT_COOKIE}=${value}`;
    expect(hasConsent('analytics', cookie)).toBe(true);
    expect(hasConsent('functional', cookie)).toBe(false);
    expect(hasConsent('marketing', cookie)).toBe(false);
  });

  it('treats malformed cookies as no consent', () => {
    expect(parseConsentCookie(`${CONSENT_COOKIE}=%7Bnot-json`)).toBeNull();
    expect(hasConsent('analytics', `${CONSENT_COOKIE}=%7Bnot-json`)).toBe(false);
  });
});
