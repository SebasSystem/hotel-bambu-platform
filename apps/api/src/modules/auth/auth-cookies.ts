import type { CookieSerializeOptions } from '@fastify/cookie';
import { CSRF_COOKIE_NAME } from '@hotel-bambu/shared';
import type { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Session cookie (ADR 0008): HttpOnly, SameSite=Lax, Path=/, Secure in production. With Secure the
 * name carries the `__Host-` prefix, so the browser refuses it unless it is Secure, host-only (no
 * Domain) and Path=/ — a sibling subdomain cannot plant or overwrite it.
 */
export function sessionCookieName(secure: boolean): string {
  return secure ? '__Host-hb_session' : 'hb_session';
}

function baseOptions(secure: boolean, maxAgeSeconds: number): CookieSerializeOptions {
  return { path: '/', sameSite: 'lax', secure, maxAge: maxAgeSeconds };
}

export function readSessionToken(request: FastifyRequest, secure: boolean): string | undefined {
  return request.cookies[sessionCookieName(secure)];
}

export function setAuthCookies(
  reply: FastifyReply,
  secure: boolean,
  token: string,
  csrfToken: string,
  maxAgeSeconds: number,
): void {
  reply.setCookie(sessionCookieName(secure), token, {
    ...baseOptions(secure, maxAgeSeconds),
    httpOnly: true,
  });
  // Readable by the admin UI (convenience copy of the CSRF token; it is not a credential).
  reply.setCookie(CSRF_COOKIE_NAME, csrfToken, {
    ...baseOptions(secure, maxAgeSeconds),
    httpOnly: false,
  });
}

export function clearAuthCookies(reply: FastifyReply, secure: boolean): void {
  reply.clearCookie(sessionCookieName(secure), {
    path: '/',
    secure,
    sameSite: 'lax',
    httpOnly: true,
  });
  reply.clearCookie(CSRF_COOKIE_NAME, { path: '/', secure, sameSite: 'lax' });
}
