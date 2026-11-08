import { localPhone } from '@/lib/public/cta';
import { fullAddress } from '@/lib/public/site';
import { fromRate, sharedRoomAmenities, type RateInput } from '@/lib/public/rates';
import { publishedRoomTotal, ROOM_TYPES_PUBLIC, roomTypeFilters } from '@/lib/public/rooms';
import type { PublicHotel } from '@/lib/public/types';
import { fitDescription, fitTitle } from './limits';

/**
 * Titles and meta descriptions of the public pages, from the Spanish templates of
 * docs/research/seo-content-strategy.md §7. Built from real data only: a template part whose fact
 * is unknown (distance, breakfast, rate, schedule) is left out instead of filled in. Every text is
 * fitted to the limits of `limits.ts` (title <= 60, description <= 155): optional parts that would
 * overflow are left out, never cut mid-sentence.
 */

export interface PageSeoText {
  title: string;
  description: string;
}

type SeoHotel = Pick<
  PublicHotel,
  'name' | 'address' | 'municipality' | 'department' | 'phone' | 'checkInTime' | 'checkOutTime'
>;

type SeoType = RateInput & {
  type: string;
  capacity: number;
  publishedRoomCount: number;
  amenities: { name: string }[];
};

/** How the page invites contact: WhatsApp, a phone call, or nothing configured. */
export type CtaKind = 'whatsapp' | 'phone' | null;

function listOf(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} y ${items.at(-1)}`;
}

function place(hotel: SeoHotel): string | null {
  return [hotel.municipality, hotel.department].filter(Boolean).join(', ') || null;
}

function contactSentence(hotel: SeoHotel, cta: CtaKind, whatsapp: string, phone: string) {
  if (cta === 'whatsapp') return whatsapp;
  if (cta === 'phone' && hotel.phone) return `${phone} ${localPhone(hotel.phone)}.`;
  return null;
}

export function homeSeo(hotel: SeoHotel, types: SeoType[], cta: CtaKind): PageSeoText {
  const where = place(hotel);
  const title = fitTitle(
    where
      ? [
          `${hotel.name} – Hotel en ${where}`,
          `${hotel.name} – Hotel en ${hotel.municipality ?? where}`,
          hotel.name,
        ]
      : [hotel.name],
  );
  const rooms = publishedRoomTotal(types);
  if (!where && rooms === 0) {
    return { title, description: `${hotel.name}: habitaciones, ubicación y contacto directo.` };
  }
  const shared = sharedRoomAmenities(types).map((name) => name.toLowerCase());
  const rate = fromRate(types);
  const roomsText =
    rooms > 0
      ? `${rooms === 1 ? '1 habitación' : `${rooms} habitaciones`}${
          shared.length > 0 ? ` con ${listOf(shared.slice(0, 3))}` : ''
        }${rate ? `, desde ${rate.value}` : ''}.`
      : null;
  const contact = contactSentence(
    hotel,
    cta,
    'Reserva directa por WhatsApp.',
    'Consulta disponibilidad al',
  );
  const description = where
    ? fitDescription(`Hotel en el corazón de ${where}.`, [roomsText, contact])
    : fitDescription(roomsText ?? `${hotel.name}.`, [contact]);
  return { title, description };
}

export function roomsSeo(hotel: SeoHotel, types: SeoType[], cta: CtaKind): PageSeoText {
  const city = hotel.municipality ? ` en ${hotel.municipality}` : '';
  const title = fitTitle([`Habitaciones${city} – ${hotel.name}`, `Habitaciones – ${hotel.name}`]);
  const kinds = roomTypeFilters(types).map((filter) =>
    ROOM_TYPES_PUBLIC[filter.type].plural.replace(/^Habitaciones /, ''),
  );
  const capacity = Math.max(0, ...types.map((type) => type.capacity));
  const rate = fromRate(types);
  const description = fitDescription(
    kinds.length > 0
      ? `Habitaciones ${listOf(kinds)}${capacity > 0 ? ` para hasta ${capacity} ${capacity === 1 ? 'persona' : 'personas'}` : ''}.`
      : `Habitaciones de ${hotel.name}.`,
    [
      `Fotos reales, comodidades y tarifas${rate ? ` desde ${rate.value}` : ''}.`,
      contactSentence(
        hotel,
        cta,
        'Consulta disponibilidad por WhatsApp.',
        'Consulta disponibilidad al',
      ),
    ],
  );
  return { title, description };
}

export function locationSeo(hotel: SeoHotel, nearbyCount: number, cta: CtaKind): PageSeoText {
  const city = hotel.municipality ? `, ${hotel.municipality}` : '';
  const title = fitTitle([`Cómo llegar a ${hotel.name}${city}`, `Cómo llegar a ${hotel.name}`]);
  const address = fullAddress(hotel);
  const extras = nearbyCount > 0 ? ', mapa y distancias a lugares cercanos' : ' y mapa';
  const full = address ? `Dirección (${address})${extras}.` : null;
  const lead =
    full && full.length <= 110
      ? full
      : address
        ? `Dirección${extras}.`
        : `Ubicación de ${hotel.name} e indicaciones para llegar.`;
  const description = fitDescription(lead, [
    contactSentence(hotel, cta, 'Escríbenos por WhatsApp.', 'Llámanos al'),
  ]);
  return { title, description };
}

export function policiesSeo(hotel: SeoHotel): PageSeoText {
  const times = [
    hotel.checkInTime ? `Check-in desde las ${hotel.checkInTime}` : null,
    hotel.checkOutTime ? `check-out hasta las ${hotel.checkOutTime}` : null,
  ].filter((part): part is string => Boolean(part));
  const schedule =
    times.length > 0 ? `${times.join(', ').replace(/^check-out/, 'Check-out')}.` : null;
  const city = hotel.municipality ? ` en ${hotel.municipality}` : '';
  // "Políticas" is reserved for the legal pages (owner review 2026-11-08).
  const body = `Normas de la estadía y preguntas frecuentes de ${hotel.name}${city}.`;
  return {
    title: fitTitle([`Información para huéspedes – ${hotel.name}`, `Huéspedes – ${hotel.name}`]),
    description: schedule ? fitDescription(schedule, [body]) : fitDescription(body, []),
  };
}

export function gallerySeo(hotel: SeoHotel, categories: string[]): PageSeoText {
  const city = hotel.municipality ? ` en ${hotel.municipality}` : '';
  const labels = categories.map((label) => label.toLowerCase());
  const lead = `Fotos reales de ${hotel.name}${city}`;
  const withLabels = labels.length > 0 ? `${lead}: ${listOf(labels)}.` : `${lead}.`;
  return {
    title: fitTitle([
      `Galería de fotos – ${hotel.name}${hotel.municipality ? `, ${hotel.municipality}` : ''}`,
      `Galería de fotos – ${hotel.name}`,
    ]),
    description: fitDescription(withLabels.length <= 110 ? withLabels : `${lead}.`, [
      'Conoce el hotel y sus habitaciones antes de reservar.',
    ]),
  };
}
