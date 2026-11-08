import { formatRoomPrice } from '@/lib/public/format';
import { amenitiesInEveryRoom, bedsText } from '@/lib/public/rooms';
import { localPhone } from '@/lib/public/cta';
import type { PublicHotel, PublicRoomTypeDetail } from '@/lib/public/types';
import { fitDescription, fitTitle } from './limits';
import type { CtaKind } from './page-seo';

/**
 * Generated SEO title and meta description of a room type page (owner decision 2026-11-05, ADR
 * 0016: no per-room SEO fields). Built from real data only: the type, its capacity, beds, area,
 * room amenities and rate, and the hotel city. Pattern from docs/research/seo-content-strategy.md
 * §7: "Habitación {Tipo} para {N} personas – Hotel Bambú Plaza", fitted to the limits of
 * `limits.ts` (the city, then the capacity, leave the title first).
 */

type SeoRoomType = Pick<
  PublicRoomTypeDetail,
  | 'name'
  | 'capacity'
  | 'beds'
  | 'areaM2'
  | 'amenities'
  | 'basePrice'
  | 'priceUnit'
  | 'taxesIncluded'
>;
type SeoHotel = Pick<PublicHotel, 'name' | 'municipality' | 'department'> &
  Partial<Pick<PublicHotel, 'phone'>>;

const people = (count: number) => `${count} ${count === 1 ? 'persona' : 'personas'}`;

function listOf(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} y ${items.at(-1)}`;
}

export function roomTypeSeo(
  type: SeoRoomType,
  hotel: SeoHotel,
  cta: CtaKind = null,
): { title: string; description: string } {
  const city = hotel.municipality?.trim() || null;
  const forPeople = `${type.name} para ${people(type.capacity)}`;
  const title = fitTitle([
    ...(city ? [`${forPeople} en ${city} – ${hotel.name}`] : []),
    `${forPeople} – ${hotel.name}`,
    `${type.name} – ${hotel.name}`,
  ]);

  const place = [hotel.name, city, hotel.department?.trim() || null].filter(Boolean).join(', ');
  const lead = `${type.name} para ${people(type.capacity)} en ${place}.`;
  const details = [bedsText(type.beds), type.areaM2 ? `${type.areaM2} m²` : null].filter(Boolean);
  const amenities = amenitiesInEveryRoom(type.amenities)
    .slice(0, 3)
    .map((amenity) => amenity.name.toLowerCase());
  const price = formatRoomPrice(type);
  const rate = price ? `Desde ${price.amount}${price.unit ? ` ${price.unit}` : ''}.` : null;

  const contact =
    cta === 'whatsapp'
      ? 'Reserva directa por WhatsApp.'
      : cta === 'phone' && hotel.phone
        ? `Consulta disponibilidad al ${localPhone(hotel.phone)}.`
        : null;
  // Optional parts in page order; a part that would overflow the limit is left out.
  const description = fitDescription(lead, [
    details.length > 0 ? `${details.join(', ')}.` : null,
    rate,
    amenities.length > 0 ? `Con ${listOf(amenities)}.` : null,
    contact,
  ]);
  return { title, description };
}
