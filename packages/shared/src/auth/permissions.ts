import { z } from 'zod';

/**
 * Admin permission catalog (feature `admin-users-roles`). One permission per admin area and level;
 * `manage` implies `view`. Roles store a list of these keys; the API enforces them per route
 * (`@RequirePermission`) and the admin panel uses them to hide what the user cannot reach.
 * The account page (own profile and password) needs no permission.
 */
export const PERMISSION_AREAS = [
  'dashboard',
  'hotel',
  'rooms',
  'content',
  'media',
  'activity',
  'users',
] as const;
export type PermissionArea = (typeof PERMISSION_AREAS)[number];

export const PERMISSION_LEVELS = ['view', 'manage'] as const;
export type PermissionLevel = (typeof PERMISSION_LEVELS)[number];

export type Permission = `${PermissionArea}.${PermissionLevel}`;

/** Every permission, in catalog order (area, then view before manage). */
export const PERMISSIONS: readonly Permission[] = PERMISSION_AREAS.flatMap((area) =>
  PERMISSION_LEVELS.map((level): Permission => `${area}.${level}`),
);

const CATALOG = new Set<string>(PERMISSIONS);

export function isPermission(value: string): value is Permission {
  return CATALOG.has(value);
}

/**
 * Effective permissions: unknown keys dropped, `<area>.view` added for every `<area>.manage`,
 * duplicates removed, catalog order.
 */
export function expandPermissions(permissions: readonly string[]): Permission[] {
  const granted = new Set<string>();
  for (const permission of permissions) {
    if (!isPermission(permission)) continue;
    granted.add(permission);
    if (permission.endsWith('.manage')) granted.add(permission.replace(/\.manage$/, '.view'));
  }
  return PERMISSIONS.filter((permission) => granted.has(permission));
}

export function hasPermission(permissions: readonly string[], required: Permission): boolean {
  return expandPermissions(permissions).includes(required);
}

export function hasAnyPermission(
  permissions: readonly string[],
  anyOf: readonly Permission[],
): boolean {
  const effective = expandPermissions(permissions);
  return anyOf.some((permission) => effective.includes(permission));
}

export const permissionSchema = z.enum(PERMISSIONS as [Permission, ...Permission[]]);

/** Role permission list: catalog keys only, normalized with `expandPermissions`. */
export const permissionListSchema = z
  .array(permissionSchema)
  .max(PERMISSIONS.length * 2)
  .transform((permissions) => expandPermissions(permissions));

/** Name of the seeded system role: every permission, cannot be edited or deleted. */
export const SYSTEM_ROLE_NAME = 'Administrador';
