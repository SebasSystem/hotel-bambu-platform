/**
 * Room-level amenity overrides (owner review A9). A room inherits its type's ROOM amenities; an
 * override either adds an amenity the type lacks (`available: true`) or marks a type amenity as
 * missing in that room (`available: false`). Only real differences from the type are stored.
 */
export interface RoomAmenityOverride {
  amenityId: string;
  available: boolean;
}

/** How a room type shows an amenity publicly: in every published room, or only in some. */
export type AmenityAvailability = 'ALL' | 'SOME';

/** Effective amenity ids of one room: type amenities with the overrides applied (type order first). */
export function roomAmenityIds(
  typeAmenityIds: readonly string[],
  overrides: readonly RoomAmenityOverride[],
): string[] {
  const byId = new Map(overrides.map((o) => [o.amenityId, o.available]));
  const inherited = typeAmenityIds.filter((id) => byId.get(id) !== false);
  const added = overrides
    .filter((o) => o.available && !typeAmenityIds.includes(o.amenityId))
    .map((o) => o.amenityId);
  return [...new Set([...inherited, ...added])];
}

/** Drops overrides that repeat what the type already says, and duplicates (last one wins). */
export function normalizeRoomAmenityOverrides(
  typeAmenityIds: readonly string[],
  overrides: readonly RoomAmenityOverride[],
): RoomAmenityOverride[] {
  const typeIds = new Set(typeAmenityIds);
  const byId = new Map<string, boolean>();
  for (const o of overrides) byId.set(o.amenityId, o.available);
  return [...byId]
    .filter(([amenityId, available]) => available !== typeIds.has(amenityId))
    .map(([amenityId, available]) => ({ amenityId, available }));
}

/**
 * Public availability per amenity across the PUBLISHED rooms of a type (one override list per
 * room). In every room → ALL; in some → SOME; in none → absent (hidden). Without published rooms
 * the type amenities are ALL, exactly as before overrides existed.
 */
export function roomTypeAmenityAvailability(
  typeAmenityIds: readonly string[],
  rooms: readonly (readonly RoomAmenityOverride[])[],
): Map<string, AmenityAvailability> {
  const result = new Map<string, AmenityAvailability>();
  if (rooms.length === 0) {
    for (const id of typeAmenityIds) result.set(id, 'ALL');
    return result;
  }
  const counts = new Map<string, number>();
  for (const overrides of rooms) {
    for (const id of roomAmenityIds(typeAmenityIds, overrides)) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  const candidates = [
    ...typeAmenityIds,
    ...[...counts.keys()].filter((id) => !typeAmenityIds.includes(id)),
  ];
  for (const id of candidates) {
    const count = counts.get(id) ?? 0;
    if (count === rooms.length) result.set(id, 'ALL');
    else if (count > 0) result.set(id, 'SOME');
  }
  return result;
}
