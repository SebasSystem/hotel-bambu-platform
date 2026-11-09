import { PERMISSIONS, expandPermissions } from '@hotel-bambu/shared';
import type { AuthenticatedAdmin } from '../../common/request-context.js';

/** Prisma `select` for the admin fields a session exposes (login and per-request resolution). */
export const AUTHENTICATED_ADMIN_SELECT = {
  id: true,
  email: true,
  name: true,
  role: { select: { id: true, name: true, permissions: true, isSystem: true } },
} as const;

export interface AdminWithRole {
  id: string;
  email: string;
  name: string | null;
  role: { id: string; name: string; permissions: readonly string[]; isSystem: boolean };
}

/**
 * Request identity: role summary plus effective permissions. The system role always holds the
 * whole catalog (new permissions apply without a data migration); other roles are expanded
 * (`manage` implies `view`, unknown keys dropped). Loaded on every request, so role edits apply
 * on the next request.
 */
export function toAuthenticatedAdmin(user: AdminWithRole): AuthenticatedAdmin {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: { id: user.role.id, name: user.role.name },
    permissions: user.role.isSystem ? [...PERMISSIONS] : expandPermissions(user.role.permissions),
  };
}
