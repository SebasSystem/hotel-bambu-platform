import { isValidCsrfToken } from './session-token.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const ALLOWED_FETCH_SITES = new Set(['same-origin', 'none']);

export interface CsrfDecision {
  ok: boolean;
  reason?: 'cross-site' | 'origin' | 'token';
}

/**
 * CSRF policy for unsafe methods (ADR 0008, requirement 12.4/16.2). Two layers:
 * 1. Origin check: `Sec-Fetch-Site` (when sent) must be same-origin/none and `Origin` (when sent)
 *    must be one of WEB_ORIGINS. Applies to every unsafe request, public ones included (login,
 *    consents, events), which also blocks login CSRF.
 * 2. Token: requests authenticated by the session cookie must send `x-csrf-token` equal to the
 *    session-bound HMAC token. Server-to-server callers without Origin still need the token.
 */
export function evaluateCsrf(input: {
  method: string;
  origin: string | undefined;
  fetchSite: string | undefined;
  allowedOrigins: readonly string[];
  sessionId: string | undefined;
  token: unknown;
  secret: string;
}): CsrfDecision {
  if (SAFE_METHODS.has(input.method.toUpperCase())) return { ok: true };
  if (input.fetchSite && !ALLOWED_FETCH_SITES.has(input.fetchSite.toLowerCase())) {
    return { ok: false, reason: 'cross-site' };
  }
  if (
    input.origin !== undefined &&
    !input.allowedOrigins.includes(input.origin.replace(/\/+$/, ''))
  ) {
    return { ok: false, reason: 'origin' };
  }
  if (input.sessionId && !isValidCsrfToken(input.secret, input.sessionId, input.token)) {
    return { ok: false, reason: 'token' };
  }
  return { ok: true };
}
