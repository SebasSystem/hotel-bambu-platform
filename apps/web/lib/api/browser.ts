import { CSRF_COOKIE_NAME } from '@hotel-bambu/shared';
import { createApiClient } from './client';

/** Browser base: same-origin rewrite to the API (ADR 0005 / requirement 12.4). */
export const BROWSER_API_BASE = '/api/v1';

let currentCsrfToken: string | null = null;

/** Set from `GET /auth/me` (admin layout) or the login/change-password responses. */
export function setCsrfToken(token: string | null): void {
  currentCsrfToken = token;
}

export function readCookie(name: string, cookieString?: string): string | null {
  const source = cookieString ?? (typeof document === 'undefined' ? '' : document.cookie);
  for (const part of source.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

export function loginUrl(nextPath?: string): string {
  return nextPath && nextPath.startsWith('/admin') && !nextPath.startsWith('/admin/login')
    ? `/admin/login?next=${encodeURIComponent(nextPath)}`
    : '/admin/login';
}

/** Admin client: every 401 sends the browser to the login page. */
export const browserApi = createApiClient({
  baseUrl: BROWSER_API_BASE,
  getCsrfToken: () => currentCsrfToken ?? readCookie(CSRF_COOKIE_NAME),
  onUnauthorized: () => {
    window.location.assign(loginUrl(window.location.pathname));
  },
});

/** Login page client: a 401 there is "wrong credentials", not "session expired". */
export const anonymousBrowserApi = createApiClient({
  baseUrl: BROWSER_API_BASE,
  getCsrfToken: () => readCookie(CSRF_COOKIE_NAME),
});
