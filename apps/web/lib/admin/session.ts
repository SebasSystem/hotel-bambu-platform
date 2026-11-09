import type { Permission } from '@hotel-bambu/shared';
import { hasAnyPermission } from '@hotel-bambu/shared';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { serverApi } from '@/lib/api/server';
import type { SessionInfo } from '@/lib/api/types';
import { accessRedirect } from './access';

/**
 * Current admin session for Server Components: `GET /auth/me`, once per request (the panel
 * layout and the page share it). A 401 redirects to the login page (`serverApi`).
 */
export const getSession = cache((): Promise<SessionInfo> => serverApi.get<SessionInfo>('/auth/me'));

/**
 * Page gate (ADR 0017): returns the session when the role has any of `anyOf`; otherwise redirects
 * to the first section the role may open, with a notice flag the shell explains. The API stays the
 * authority (403 `PERMISSION_DENIED`); this only avoids rendering pages that would fail.
 */
export async function requirePermission(
  anyOf: Permission | readonly Permission[],
  options: { notice?: boolean } = {},
): Promise<SessionInfo> {
  const session = await getSession();
  const required = typeof anyOf === 'string' ? [anyOf] : anyOf;
  if (required.length === 0 || hasAnyPermission(session.user.permissions, required)) {
    return session;
  }
  redirect(accessRedirect(session.user.permissions, options));
}
