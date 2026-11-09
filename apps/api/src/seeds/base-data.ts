import type { AmenityScope, IconKey } from '@hotel-bambu/shared';
import type { LandingSectionKey } from '../generated/prisma/enums.js';

/**
 * Base seed content (requirement 15.5): structure and facts confirmed by the owner only.
 * Unknown hotel data stays null and is listed in docs/pendientes-hotel.md, never invented.
 */

export const HOTEL_NAME = 'Hotel Bambú Plaza';

export const HOTEL_COORDINATES = { latitude: 1.146883, longitude: -76.64794 } as const;

/** Google Maps link built from the coordinates (owner link: maps.app.goo.gl/MYQBgcYNJzk3A6zL7). */
export function mapUrlFor(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${latitude.toFixed(6)},${longitude.toFixed(6)}`;
}

/**
 * Hotel facts approved for publication by the owner on 2026-11-05 (address, coordinates, phone,
 * RNT and tagline from the framed prints, docs/assets/photo-inventory.md). The about text and the
 * meta description are written from the framed mission only. The phone is not confirmed as
 * WhatsApp, so `whatsappNumber` stays empty.
 *
 * The check-in/out times are editable default content (`default-content.ts`).
 *
 * TODO(hotel): legalName, email, openingHours, whatsappNumber, directions.
 */
export const HOTEL_FACTS = {
  tagline: 'Hotel Bambú Plaza: descanso, comodidad y confianza en el corazón de Mocoa',
  shortDescription:
    'Hotel Bambú Plaza, en el corazón de Mocoa (Putumayo): alojamiento confortable, seguro y familiar para familias y viajeros de negocios.',
  description: [
    'En Hotel Bambú Plaza queremos brindarte una experiencia de alojamiento confortable, segura y familiar, en una ubicación privilegiada en el corazón de Mocoa. Te recibimos con atención cálida e instalaciones adecuadas para tu estadía.',
    'Si viajas en familia, encontrarás un ambiente ideal para el descanso. Si vienes a Mocoa por actividades comerciales o administrativas, tendrás un lugar cómodo desde el cual atender tus compromisos y descansar al final del día.',
  ].join('\n\n'),
  address: 'Calle 8 # 7-10',
  municipality: 'Mocoa',
  department: 'Putumayo',
  country: 'Colombia',
  latitude: HOTEL_COORDINATES.latitude,
  longitude: HOTEL_COORDINATES.longitude,
  mapUrl: mapUrlFor(HOTEL_COORDINATES.latitude, HOTEL_COORDINATES.longitude),
  phone: '+57 310 679 8260',
  rntNumber: '232175',
} as const;

export type HotelFactField = keyof typeof HOTEL_FACTS;

/**
 * Facts to write on an existing profile: only the fields that are still empty, so a re-run never
 * overwrites what the hotel edited in /admin.
 */
export function missingHotelFacts(
  current: Readonly<Partial<Record<HotelFactField, unknown>>>,
): Partial<typeof HOTEL_FACTS> {
  const isEmpty = (value: unknown) =>
    value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
  return Object.fromEntries(
    Object.entries(HOTEL_FACTS).filter(([field]) => isEmpty(current[field as HotelFactField])),
  ) as Partial<typeof HOTEL_FACTS>;
}

/** Home sections in their default order; headings live in the web code (ADR 0016). */
export const LANDING_SECTIONS: readonly LandingSectionKey[] = [
  'HERO',
  'ABOUT',
  'ROOMS',
  'SERVICES',
  'GALLERY',
  'LOCATION',
  'FAQ',
  'CONTACT',
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
