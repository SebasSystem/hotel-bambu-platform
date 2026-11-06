import type { AmenityScope, IconKey } from '@hotel-bambu/shared';
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
  { key: 'SERVICES', title: 'Comodidades del hotel' },
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

/**
 * "Comodidades" confirmed by the owner (2026-11-04): every room has a private bathroom, TV and fan;
 * the hotel has Wi-Fi on every floor, solar panels and a water reserve (no laundry). Scopes follow
 * the owner decision of 2026-11-05 (ADR 0015): Wi-Fi is one hotel-wide amenity, not a room one.
 * No description that only restates the name (owner feedback): the site shows none then.
 */
export const AMENITIES: ReadonlyArray<{
  name: string;
  description?: string;
  iconKey: IconKey;
  scope: AmenityScope;
  showOnHome: boolean;
}> = [
  { name: 'Baño privado', iconKey: 'bath', scope: 'ROOM', showOnHome: true },
  { name: 'Televisor', iconKey: 'tv', scope: 'ROOM', showOnHome: true },
  { name: 'Ventilador', iconKey: 'fan', scope: 'ROOM', showOnHome: true },
  {
    name: 'Wi-Fi en todo el hotel',
    description: 'Conexión Wi-Fi en las habitaciones y en todos los pisos del hotel.',
    iconKey: 'wifi',
    scope: 'HOTEL',
    showOnHome: true,
  },
  {
    name: 'Paneles solares',
    iconKey: 'sun',
    scope: 'HOTEL',
    showOnHome: true,
  },
  {
    name: 'Reserva de agua',
    iconKey: 'droplets',
    scope: 'HOTEL',
    showOnHome: true,
  },
];
