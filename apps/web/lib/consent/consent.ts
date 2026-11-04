/**
 * Consent state (requirement 17.5). The consent manager (`components/consent`) writes the
 * `hb_consent` cookie and records evidence through `POST /api/v1/public/consents`; the server
 * layout and `trackEvent` read it. Non-essential categories stay denied until an explicit grant.
 *
 * Bump `CONSENT_POLICY_VERSION` on any material change to the cookie policy: decisions taken under
 * another version are ignored, so the banner asks again (17.5.10).
 */
export const CONSENT_COOKIE = 'hb_consent';
export const CONSENT_POLICY_VERSION = '2026-11-v1';
/** 180 days: the decision is asked again after six months. */
export const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

export type ConsentCategory = 'functional' | 'analytics' | 'marketing';

export interface ConsentState {
  /** Policy version the decision was taken under. */
  v: string;
  /** Random identifier (evidence only, 17.5.9). Never an IP or a user id. */
  id: string;
  functional: boolean;
  analytics: boolean;
  /** Prepared but unused: no marketing technology is installed (17.5). Always false in the UI. */
  marketing: boolean;
}

export type ConsentChoices = Partial<Record<ConsentCategory, boolean>>;

const ID_PATTERN = /^[A-Za-z0-9_-]{16,64}$/;

/** Parses the raw (URI-encoded JSON) cookie value. Null when absent, invalid or outdated. */
export function parseConsentValue(raw: string | undefined): ConsentState | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(raw));
    if (!parsed || typeof parsed !== 'object') return null;
    const value = parsed as Record<string, unknown>;
    if (value.v !== CONSENT_POLICY_VERSION) return null;
    if (typeof value.id !== 'string' || !ID_PATTERN.test(value.id)) return null;
    return {
      v: CONSENT_POLICY_VERSION,
      id: value.id,
      functional: value.functional === true,
      analytics: value.analytics === true,
      marketing: value.marketing === true,
    };
  } catch {
    return null;
  }
}

/** Reads the decision from a `Cookie` header or `document.cookie`. */
export function parseConsentCookie(cookieHeader: string): ConsentState | null {
  const raw = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${CONSENT_COOKIE}=`))
    ?.slice(CONSENT_COOKIE.length + 1);
  return parseConsentValue(raw);
}

/** True only with an explicit grant under the current policy. Pass `document.cookie` in the browser. */
export function hasConsent(category: ConsentCategory, cookieHeader: string): boolean {
  return parseConsentCookie(cookieHeader)?.[category] === true;
}

function randomId(): string {
  return globalThis.crypto.randomUUID().replace(/-/g, '');
}

/** New decision. Keeps the earlier random id so evidence of one browser stays linked. */
export function createConsent(
  choices: ConsentChoices,
  previous?: ConsentState | null,
): ConsentState {
  return {
    v: CONSENT_POLICY_VERSION,
    id: previous?.id ?? randomId(),
    functional: choices.functional === true,
    analytics: choices.analytics === true,
    // No marketing technology exists yet; the category is never granted from the UI (17.5).
    marketing: false,
  };
}

export function consentCookieString(state: ConsentState, options: { secure: boolean }): string {
  const value = encodeURIComponent(JSON.stringify(state));
  const parts = [
    `${CONSENT_COOKIE}=${value}`,
    'Path=/',
    `Max-Age=${CONSENT_MAX_AGE_SECONDS}`,
    'SameSite=Lax',
  ];
  if (options.secure) parts.push('Secure');
  return parts.join('; ');
}
