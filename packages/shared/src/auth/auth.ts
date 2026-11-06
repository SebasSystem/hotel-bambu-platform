import { z } from 'zod';

/**
 * Auth contract shared by the API and the admin panel (ADR 0008).
 *
 * - Session: opaque token in an HttpOnly cookie (`__Host-hb_session` in production,
 *   `hb_session` in development). The browser never reads it.
 * - CSRF: every unsafe request (POST/PUT/PATCH/DELETE) made with a session must send the
 *   token returned by `POST /auth/login` / `GET /auth/me` in the `x-csrf-token` header.
 *   The same value is also readable from the non-HttpOnly `hb_csrf` cookie.
 */
export const CSRF_HEADER_NAME = 'x-csrf-token';
export const CSRF_COOKIE_NAME = 'hb_csrf';

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

export const loginSchema = z.strictObject({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  // Bounded to keep Argon2 cost predictable; policy is not checked at login.
  password: z.string().min(1).max(PASSWORD_MAX_LENGTH),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const changePasswordSchema = z.strictObject({
  currentPassword: z.string().min(1).max(PASSWORD_MAX_LENGTH),
  newPassword: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export interface AuthSessionResponse {
  user: { id: string; email: string; name: string | null; role: 'ADMIN' };
  csrfToken: string;
  expiresAt: string;
}
