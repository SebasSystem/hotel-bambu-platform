import { ui } from '@/lib/i18n/es';

/**
 * Public routes (requirement 4.1). `/habitaciones/<slug>` matches the admin "Ver en el sitio".
 * C3 merged `/contacto` into `/ubicacion` and `/preguntas-frecuentes` into `/politicas-del-hotel`
 * (301s in `redirects.ts`).
 */
export const routes = {
  home: '/',
  rooms: '/habitaciones',
  room: (slug: string) => `/habitaciones/${slug}`,
  gallery: '/galeria',
  location: '/ubicacion',
  policies: '/politicas-del-hotel',
  legalData: '/legal/tratamiento-de-datos',
  legalPrivacy: '/legal/aviso-de-privacidad',
  legalCookies: '/legal/cookies',
} as const;

export interface NavItem {
  href: string;
  label: string;
}

/** Header navigation (mockup: Inicio + the main sections, underline on hover/active). */
export const mainNav: readonly NavItem[] = [
  { href: routes.home, label: ui.nav.home },
  { href: routes.rooms, label: ui.nav.rooms },
  { href: routes.gallery, label: ui.nav.gallery },
  { href: routes.location, label: ui.nav.location },
  { href: routes.policies, label: ui.nav.policies },
];

/** Mobile menu: the same sections (every page fits the menu since the C3 merge). */
export const mobileNav: readonly NavItem[] = mainNav;

/** Footer "Explorar" column. */
export const footerNav: readonly NavItem[] = [
  { href: routes.home, label: ui.nav.home },
  { href: routes.rooms, label: ui.nav.rooms },
  { href: routes.gallery, label: ui.pages.gallery },
];

/** Footer "Información" column (full page names, descriptive anchors). */
export const infoNav: readonly NavItem[] = [
  { href: routes.location, label: ui.pages.location },
  { href: routes.policies, label: ui.pages.policies },
];

export const legalNav: readonly NavItem[] = [
  { href: routes.legalData, label: ui.legal.data },
  { href: routes.legalPrivacy, label: ui.legal.privacy },
  { href: routes.legalCookies, label: ui.legal.cookies },
];

/** Active state for `aria-current`: home matches exactly, sections also match nested routes. */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === routes.home) return pathname === routes.home;
  return pathname === href || pathname.startsWith(`${href}/`);
}
