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

export const mainNav = [
  { href: routes.rooms, label: ui.nav.rooms },
  { href: routes.services, label: ui.nav.services },
  { href: routes.gallery, label: ui.nav.gallery },
  { href: routes.location, label: ui.nav.location },
  { href: routes.faq, label: ui.nav.faq },
  { href: routes.contact, label: ui.nav.contact },
] as const;

export const footerNav = [
  { href: routes.home, label: ui.nav.home },
  ...mainNav,
  { href: routes.policies, label: ui.nav.policies },
] as const;

export const legalNav = [
  { href: routes.legalData, label: ui.legal.data },
  { href: routes.legalPrivacy, label: ui.legal.privacy },
  { href: routes.legalCookies, label: ui.legal.cookies },
] as const;
