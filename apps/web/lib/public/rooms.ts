import type { PublicMedia, PublicRoomSummary } from './types';

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

export interface RoomTypeSummary {
  type: RoomTypeKey;
  count: number;
  maxCapacity: number;
  cover: PublicMedia | null;
  /** Cheapest published rate of the type (keeps its unit and taxes flag), or null. */
  cheapest: Pick<PublicRoomSummary, 'basePrice' | 'priceUnit' | 'taxesIncluded'> | null;
  /** Amenities every room of the type has. */
  sharedAmenities: { name: string; iconKey: string }[];
}

/** Home teaser: one card per room type actually published, in a stable order. */
export function summarizeRoomTypes(rooms: PublicRoomSummary[]): RoomTypeSummary[] {
  return ORDER.flatMap((type) => {
    const ofType = rooms.filter((room) => room.type === type);
    if (ofType.length === 0) return [];
    const priced = ofType
      .filter((room) => room.basePrice !== null)
      .sort((a, b) => (a.basePrice ?? 0) - (b.basePrice ?? 0));
    const first = ofType[0]!;
    const sharedAmenities = first.amenities.filter((amenity) =>
      ofType.every((room) => room.amenities.some((other) => other.name === amenity.name)),
    );
    const cheapest = priced[0];
    return [
      {
        type,
        count: ofType.length,
        maxCapacity: Math.max(...ofType.map((room) => room.capacity)),
        cover: ofType.find((room) => room.cover)?.cover ?? null,
        cheapest: cheapest
          ? {
              basePrice: cheapest.basePrice,
              priceUnit: cheapest.priceUnit,
              taxesIncluded: cheapest.taxesIncluded,
            }
          : null,
        sharedAmenities,
      },
    ];
  });
}

/** Other rooms for the detail page: same type first, then the rest. */
export function otherRooms(rooms: PublicRoomSummary[], current: PublicRoomSummary, limit = 3) {
  const others = rooms.filter((room) => room.slug !== current.slug);
  return [
    ...others.filter((room) => room.type === current.type),
    ...others.filter((room) => room.type !== current.type),
  ].slice(0, limit);
}
