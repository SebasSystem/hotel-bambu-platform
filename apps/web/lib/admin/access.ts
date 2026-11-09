import { hasAnyPermission, type Permission, type PermissionArea } from '@hotel-bambu/shared';

/**
 * Which permission opens each admin section (feature admin-users-roles, ADR 0017). Mirrors the
 * API `@RequirePermission` metadata of the endpoints each page reads, so a page the user can
 * open never fails with a 403. Order follows the navigation: it decides the first allowed page.
 */
const ROUTE_ACCESS: readonly { href: string; anyOf: readonly Permission[] }[] = [
  { href: '/admin', anyOf: ['dashboard.view'] },
  { href: '/admin/hotel', anyOf: ['hotel.view'] },
  { href: '/admin/nearby-places', anyOf: ['hotel.view'] },
  { href: '/admin/room-types', anyOf: ['rooms.view'] },
  { href: '/admin/rooms', anyOf: ['rooms.view'] },
  { href: '/admin/amenities', anyOf: ['rooms.view'] },
  { href: '/admin/content', anyOf: ['content.view'] },
  { href: '/admin/hero-slides', anyOf: ['content.view'] },
  { href: '/admin/gallery', anyOf: ['content.view'] },
  { href: '/admin/media', anyOf: ['media.view'] },
  { href: '/admin/policies', anyOf: ['content.view'] },
  { href: '/admin/faq', anyOf: ['content.view'] },
  { href: '/admin/social', anyOf: ['hotel.view'] },
  { href: '/admin/users', anyOf: ['users.view'] },
  { href: '/admin/roles', anyOf: ['users.view'] },
  // Own profile and password: every signed-in admin.
  { href: '/admin/account', anyOf: [] },
];

/** Search parameter the shell reads to explain a redirect away from a forbidden page. */
export const ACCESS_DENIED_PARAM = 'acceso';
const ACCESS_DENIED_VALUE = 'denegado';

export function isAccessDenied(value: string | null | undefined): boolean {
  return value === ACCESS_DENIED_VALUE;
}

/** Spanish label of each permission area (roles page, docs). */
export const PERMISSION_AREA_LABELS: Record<PermissionArea, string> = {
  dashboard: 'Resumen',
  hotel: 'Datos del hotel',
  rooms: 'Habitaciones',
  content: 'Contenido',
  media: 'Fotos y medios',
  activity: 'Actividad',
  users: 'Usuarios y roles',
};

function pathOf(href: string): string {
  const path = href.split(/[?#]/)[0] ?? href;
  return path.length > 1 ? path.replace(/\/+$/, '') : path;
}

/**
 * Permissions (any of) that open the section of `href`; `[]` means every signed-in admin, `null`
 * an unknown admin route.
 */
export function routePermissions(href: string): readonly Permission[] | null {
  const path = pathOf(href);
  if (path === '/admin') return ROUTE_ACCESS[0]!.anyOf;
  const match = ROUTE_ACCESS.find(
    (route) =>
      route.href !== '/admin' && (path === route.href || path.startsWith(`${route.href}/`)),
  );
  return match ? match.anyOf : null;
}

export function canAccess(permissions: readonly string[], href: string): boolean {
  const anyOf = routePermissions(href);
  if (anyOf === null) return false;
  return anyOf.length === 0 || hasAnyPermission(permissions, anyOf);
}

/** First section in navigation order the user may open (the account page at worst). */
export function firstAllowedPath(permissions: readonly string[]): string {
  return ROUTE_ACCESS.find((route) => canAccess(permissions, route.href))?.href ?? '/admin/account';
}

/** Where a forbidden page sends the user; the notice flag makes the shell explain why. */
export function accessRedirect(
  permissions: readonly string[],
  { notice = true }: { notice?: boolean } = {},
): string {
  const target = firstAllowedPath(permissions);
  return notice ? `${target}?${ACCESS_DENIED_PARAM}=${ACCESS_DENIED_VALUE}` : target;
}
