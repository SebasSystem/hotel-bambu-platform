import { ui } from '@/lib/i18n/es';

/** Public routes (requirement 4.1). `/habitaciones/<slug>` matches the admin "Ver en el sitio". */
export const routes = {
  home: '/',
  rooms: '/habitaciones',
  room: (slug: string) => `/habitaciones/${slug}`,
  services: '/servicios',
  gallery: '/galeria',
  location: '/ubicacion',
  faq: '/preguntas-frecuentes',
  policies: '/politicas-del-hotel',
  contact: '/contacto',
  legalData: '/legal/tratamiento-de-datos',
  legalPrivacy: '/legal/aviso-de-privacidad',
  legalCookies: '/legal/cookies',
} as const;

export interface NavItem {
  href: string;
  label: string;
}

/** Desktop header navigation (mockup: Inicio + the main sections, underline on hover/active). */
export const mainNav: readonly NavItem[] = [
  { href: routes.home, label: ui.nav.home },
  { href: routes.rooms, label: ui.nav.rooms },
  { href: routes.services, label: ui.nav.services },
  { href: routes.gallery, label: ui.nav.gallery },
  { href: routes.location, label: ui.nav.location },
  { href: routes.contact, label: ui.nav.contact },
];

/** Mobile menu: the header sections plus the help pages that do not fit the desktop bar. */
export const mobileNav: readonly NavItem[] = [
  ...mainNav,
  { href: routes.faq, label: ui.nav.faq },
  { href: routes.policies, label: ui.nav.policies },
];

/** Footer "Explora" column. */
export const footerNav: readonly NavItem[] = [
  { href: routes.home, label: ui.nav.home },
  { href: routes.rooms, label: ui.nav.rooms },
  { href: routes.services, label: ui.nav.services },
  { href: routes.gallery, label: ui.nav.gallery },
];

/** Footer "Información" column. */
export const infoNav: readonly NavItem[] = [
  { href: routes.faq, label: ui.nav.faq },
  { href: routes.policies, label: ui.nav.policies },
  { href: routes.location, label: ui.nav.location },
  { href: routes.contact, label: ui.nav.contact },
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
