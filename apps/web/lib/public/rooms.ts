import type { PublicRoomSummary } from './types';

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
export function publishedRoomTotal(types: Pick<PublicRoomSummary, 'publishedRoomCount'>[]): number {
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
export function otherRooms(rooms: PublicRoomSummary[], current: PublicRoomSummary, limit = 3) {
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
export function roomTypeFilters(rooms: Pick<PublicRoomSummary, 'type'>[]): RoomTypeFilter[] {
  return ORDER.flatMap((type) => {
    const count = rooms.filter((room) => room.type === type).length;
    if (count === 0) return [];
    const { param, singular } = ROOM_TYPES_PUBLIC[type];
    return [{ type, param, label: singular, count }];
  });
}

export function filterRoomsByType<T extends Pick<PublicRoomSummary, 'type'>>(
  rooms: T[],
  active: RoomTypeKey | null,
): T[] {
  return active ? rooms.filter((room) => room.type === active) : rooms;
}
