import { formatRoomPrice } from '@/lib/public/format';
import type { PublicHotel, PublicRoomDetail } from '@/lib/public/types';

/**
 * Generated SEO title and meta description of a room type page (owner decision 2026-11-05, ADR
 * 0016: no per-room SEO fields). Built from real data only: the type, its capacity, beds, area,
 * room amenities and rate, and the hotel city. Pattern from docs/research/seo-content-strategy.md
 * §7: "Habitación {Tipo} para {N} personas – Hotel Bambú Plaza".
 */

type SeoRoomType = Pick<
  PublicRoomDetail,
  | 'name'
  | 'capacity'
  | 'beds'
  | 'areaM2'
  | 'amenities'
  | 'basePrice'
  | 'priceUnit'
  | 'taxesIncluded'
>;
type SeoHotel = Pick<PublicHotel, 'name' | 'municipality' | 'department'>;

const MAX_DESCRIPTION = 160;

/** Lowercase bed names for running text (admin labels are title case). */
const BED_NAMES: Record<string, [singular: string, plural: string]> = {
  SINGLE: ['cama sencilla', 'camas sencillas'],
  DOUBLE: ['cama doble', 'camas dobles'],
  QUEEN: ['cama queen', 'camas queen'],
  KING: ['cama king', 'camas king'],
  BUNK: ['camarote', 'camarotes'],
  SOFA_BED: ['sofá cama', 'sofás cama'],
};

const people = (count: number) => `${count} ${count === 1 ? 'persona' : 'personas'}`;

function listOf(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} y ${items.at(-1)}`;
}

function bedsText(beds: SeoRoomType['beds']): string | null {
  const parts = (beds ?? [])
    .filter((bed) => bed.count > 0)
    .map((bed) => {
      const [one, many] = BED_NAMES[bed.type] ?? [bed.type.toLowerCase(), bed.type.toLowerCase()];
      return `${bed.count} ${bed.count === 1 ? one : many}`;
    });
  return parts.length > 0 ? parts.join(', ') : null;
}

export function roomTypeSeo(
  type: SeoRoomType,
  hotel: SeoHotel,
): { title: string; description: string } {
  const city = hotel.municipality?.trim() || null;
  const title = `${type.name} para ${people(type.capacity)}${city ? ` en ${city}` : ''} – ${hotel.name}`;

  const place = [hotel.name, city, hotel.department?.trim() || null].filter(Boolean).join(', ');
  const lead = `${type.name} para ${people(type.capacity)} en ${place}.`;
  const details = [bedsText(type.beds), type.areaM2 ? `${type.areaM2} m²` : null].filter(Boolean);
  const amenities = type.amenities.slice(0, 3).map((amenity) => amenity.name.toLowerCase());
  const price = formatRoomPrice(type);
  const rate = price ? `Desde ${price.amount}${price.unit ? ` ${price.unit}` : ''}.` : null;

  // Optional parts in order of value; the least valuable go first when the text is too long.
  const optional = [
    details.length > 0 ? `${details.join(', ')}.` : null,
    amenities.length > 0 ? `Con ${listOf(amenities)}.` : null,
  ];
  const compose = (parts: (string | null)[]) =>
    [lead, ...parts, rate].filter(Boolean).join(' ').replace(/\s/g, ' ');
  let description = compose(optional);
  for (let drop = optional.length - 1; description.length > MAX_DESCRIPTION && drop >= 0; drop--) {
    optional[drop] = null;
    description = compose(optional);
  }
  return { title, description };
}
