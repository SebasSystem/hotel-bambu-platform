import type { AmenityAvailability } from '@hotel-bambu/shared';
import { ui } from '@/lib/i18n/es';
import type { PublicRoomTypeSummary } from './types';

/** Public room-type vocabulary and URL filter values (`/habitaciones?tipo=pareja`). */
export const ROOM_TYPES_PUBLIC = {
  INDIVIDUAL: { param: 'individual', singular: 'Individual', plural: 'Habitaciones individuales' },
  COUPLE: { param: 'pareja', singular: 'Pareja', plural: 'Habitaciones de pareja' },
  TWIN: { param: 'doble', singular: 'Doble', plural: 'Habitaciones dobles' },
  FAMILY: { param: 'familiar', singular: 'Familiar', plural: 'Habitaciones familiares' },
} as const;

export type RoomTypeKey = keyof typeof ROOM_TYPES_PUBLIC;

const ORDER = Object.keys(ROOM_TYPES_PUBLIC) as RoomTypeKey[];

export function roomTypeLabel(type: string): string {
  return ROOM_TYPES_PUBLIC[type as RoomTypeKey]?.singular ?? type;
}

export function roomTypeFromParam(param: string | string[] | undefined): RoomTypeKey | null {
  const value = Array.isArray(param) ? param[0] : param;
  return ORDER.find((key) => ROOM_TYPES_PUBLIC[key].param === value) ?? null;
}

/** Published rooms of every listed type (home fact stack, Hotel `numberOfRooms`). */
export function publishedRoomTotal(
  types: Pick<PublicRoomTypeSummary, 'publishedRoomCount'>[],
): number {
  return types.reduce((total, type) => total + type.publishedRoomCount, 0);
}

/** Card text: the first paragraph of the type description, cut at a word boundary. */
export function roomExcerpt(description: string | null, max = 180): string | null {
  const first = description
    ?.split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .find(Boolean);
  if (!first) return null;
  if (first.length <= max) return first;
  const cut = first.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 0 ? cut.lastIndexOf(' ') : max).trimEnd()}…`;
}

/** Other room types for the detail page: same kind first, then the rest. */
export function otherRooms(
  rooms: PublicRoomTypeSummary[],
  current: PublicRoomTypeSummary,
  limit = 3,
) {
  const others = rooms.filter((room) => room.slug !== current.slug);
  return [
    ...others.filter((room) => room.type === current.type),
    ...others.filter((room) => room.type !== current.type),
  ].slice(0, limit);
}

export interface RoomTypeFilter {
  type: RoomTypeKey;
  /** `?tipo=` value (shareable, indexable filter link). */
  param: string;
  label: string;
  count: number;
}

/** Catalogue chips: one per kind that has published room types, in the stable kind order. */
export function roomTypeFilters(rooms: Pick<PublicRoomTypeSummary, 'type'>[]): RoomTypeFilter[] {
  return ORDER.flatMap((type) => {
    const count = rooms.filter((room) => room.type === type).length;
    if (count === 0) return [];
    const { param, singular } = ROOM_TYPES_PUBLIC[type];
    return [{ type, param, label: singular, count }];
  });
}

export function filterRoomsByType<T extends Pick<PublicRoomTypeSummary, 'type'>>(
  rooms: T[],
  active: RoomTypeKey | null,
): T[] {
  return active ? rooms.filter((room) => room.type === active) : rooms;
}

/** Lowercase bed names for running text (admin labels are title case). */
const BED_NAMES: Record<string, [singular: string, plural: string]> = {
  SINGLE: ['cama sencilla', 'camas sencillas'],
  DOUBLE: ['cama doble', 'camas dobles'],
  QUEEN: ['cama queen', 'camas queen'],
  KING: ['cama king', 'camas king'],
  BUNK: ['camarote', 'camarotes'],
  SOFA_BED: ['sofá cama', 'sofás cama'],
};

/** "1 cama doble, 2 camas sencillas", or null when the type has no beds configured. */
export function bedsText(
  beds: { type: string; count: number }[] | null | undefined,
): string | null {
  const parts = (beds ?? [])
    .filter((bed) => bed.count > 0)
    .map((bed) => {
      const [one, many] = BED_NAMES[bed.type] ?? [bed.type.toLowerCase(), bed.type.toLowerCase()];
      return `${bed.count} ${bed.count === 1 ? one : many}`;
    });
  return parts.length > 0 ? parts.join(', ') : null;
}

function listOf(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} y ${items.at(-1)}`;
}

/** Public availability of a ROOM amenity across the published rooms of a type (A9). */
interface RoomAmenity {
  name: string;
  /** `SOME`: only some rooms have it. Absent in older payloads: every room. */
  availability?: AmenityAvailability;
}

/** Chip text: "Aire acondicionado en algunas habitaciones" when not every room has it. */
export function roomAmenityLabel(amenity: RoomAmenity): string {
  return amenity.availability === 'SOME' ? `${amenity.name} ${ui.rooms.inSomeRooms}` : amenity.name;
}

/** Amenities true for every room of the type: the only ones used in facts, SEO and JSON-LD. */
export function amenitiesInEveryRoom<T extends RoomAmenity>(amenities: readonly T[]): T[] {
  return amenities.filter((amenity) => amenity.availability !== 'SOME');
}

/**
 * Lead text of a room type page: the first paragraph of the hotel's description, or a factual
 * sentence built from the type (capacity, city, room amenities) when there is none yet.
 */
export function roomTypeLead(
  type: {
    name: string;
    capacity: number;
    description: string | null;
    amenities: RoomAmenity[];
  },
  city: string | null,
): string {
  const written = roomExcerpt(type.description, 400);
  if (written) return written;
  const people = `${type.capacity} ${type.capacity === 1 ? 'persona' : 'personas'}`;
  const amenities = amenitiesInEveryRoom(type.amenities).map((amenity) =>
    amenity.name.toLowerCase(),
  );
  return `${type.name} para ${people}${city ? ` en el corazón de ${city}` : ''}${
    amenities.length > 0 ? `, con ${listOf(amenities)}` : ''
  }.`;
}
