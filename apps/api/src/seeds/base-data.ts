import type { IconKey } from '@hotel-bambu/shared';
import type { LandingSectionKey, WhatsAppTemplateKey } from '../generated/prisma/enums.js';

/**
 * Base seed content (requirement 15.5): structure and facts confirmed by the owner only.
 * Unknown hotel data stays null and is listed in docs/pendientes-hotel.md — never invented, and
 * never seeded from what photos happen to show (address, phone, RNT) until the hotel confirms.
 */

export const HOTEL_NAME = 'Hotel Bambú Plaza';

// TODO(hotel): legalName, rntNumber, escnnaNotice, descriptions, address, municipality,
// department, coordinates, mapUrl, directions, phone, whatsappNumber, email, openingHours,
// checkInTime, checkOutTime. Left null so the site hides them until set in /admin.

export const LANDING_SECTIONS: ReadonlyArray<{
  key: LandingSectionKey;
  title: string;
  ctaLabel?: string;
}> = [
  { key: 'HERO', title: HOTEL_NAME, ctaLabel: 'Escríbenos por WhatsApp' },
  { key: 'ABOUT', title: 'Sobre nosotros' },
  { key: 'ROOMS', title: 'Habitaciones', ctaLabel: 'Ver habitaciones' },
  { key: 'SERVICES', title: 'Servicios' },
  { key: 'GALLERY', title: 'Galería', ctaLabel: 'Ver galería completa' },
  { key: 'LOCATION', title: 'Ubicación', ctaLabel: 'Cómo llegar' },
  { key: 'FAQ', title: 'Preguntas frecuentes' },
  { key: 'CONTACT', title: 'Contacto' },
];

/** Default messages from requirement 5.2 (editable in /admin). */
export const WHATSAPP_TEMPLATES: ReadonlyArray<{
  key: WhatsAppTemplateKey;
  label: string;
  body: string;
  allowedVariables: string[];
}> = [
  {
    key: 'GENERAL',
    label: 'Consulta general',
    body: 'Hola, vi su hotel en su página web y quisiera obtener más información.',
    allowedVariables: [],
  },
  {
    key: 'ROOM',
    label: 'Consulta por habitación',
    body: 'Hola, estoy interesado en la habitación {{habitacion}}. ¿Podrían brindarme información sobre disponibilidad y tarifa?',
    allowedVariables: ['habitacion'],
  },
  {
    key: 'PROMOTION',
    label: 'Consulta por promoción',
    body: 'Hola, vi la promoción {{promocion}} en su página web y quisiera más información.',
    allowedVariables: ['promocion'],
  },
];

/** Room amenities confirmed by the owner (2026-11-04): every room has all four. */
export const AMENITIES: ReadonlyArray<{ name: string; iconKey: IconKey; showOnHome: boolean }> = [
  { name: 'Baño privado', iconKey: 'bath', showOnHome: true },
  { name: 'Televisor', iconKey: 'tv', showOnHome: true },
  { name: 'Ventilador', iconKey: 'fan', showOnHome: true },
  { name: 'Wi-Fi', iconKey: 'wifi', showOnHome: true },
];

/** Hotel-level services confirmed by the owner (2026-11-04). The hotel has no laundry service. */
export const SERVICES: ReadonlyArray<{ name: string; description: string; iconKey: IconKey }> = [
  {
    name: 'Paneles solares',
    description: 'El hotel cuenta con paneles solares.',
    iconKey: 'sun',
  },
  {
    name: 'Reserva de agua',
    description: 'El hotel cuenta con reserva de agua.',
    iconKey: 'droplets',
  },
  {
    name: 'Internet en todos los pisos',
    description: 'Conexión a internet disponible en todos los pisos del hotel.',
    iconKey: 'router',
  },
];
