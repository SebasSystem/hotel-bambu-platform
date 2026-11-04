/**
 * Minimal consent reader (requirement 17.5). STUB: the consent manager (banner, preferences,
 * `POST /public/consents` evidence, policy versioning) arrives in T7 and owns writing this cookie.
 * Until then nothing writes it, so every non-essential category stays denied (default: no tracking).
 */
export const CONSENT_COOKIE = 'hb_consent';

export type ConsentCategory = 'functional' | 'analytics' | 'marketing';

export interface ConsentState {
  v?: string;
  functional?: boolean;
  analytics?: boolean;
  marketing?: boolean;
}

export function parseConsentCookie(cookieHeader: string): ConsentState | null {
  const raw = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${CONSENT_COOKIE}=`))
    ?.slice(CONSENT_COOKIE.length + 1);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(raw));
    return parsed && typeof parsed === 'object' ? (parsed as ConsentState) : null;
  } catch {
    return null;
  }
}

/** True only with an explicit grant. Pass `document.cookie` in the browser. */
export function hasConsent(category: ConsentCategory, cookieHeader: string): boolean {
  return parseConsentCookie(cookieHeader)?.[category] === true;
}
