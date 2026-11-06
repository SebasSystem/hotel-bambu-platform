import { z } from 'zod';
import type { GalleryCategory, RoomKind } from '../../generated/prisma/enums.js';

/** One entry of docs/assets/assets-manifest.json (metadata only; originals are not versioned). */
export const manifestEntrySchema = z.object({
  file: z.string().min(1),
  category: z.enum(['room', 'common', 'exterior', 'detail', 'signage', 'food', 'surroundings']),
  roomType: z.string().nullable(),
  roomGroup: z.string().nullable().optional(),
  quality: z.enum(['ok', 'needs-edit', 'discard']),
  people: z.boolean(),
  altEs: z.string().min(1),
  notes: z.string().optional(),
});

export const manifestSchema = z.array(manifestEntrySchema);
export type ManifestEntry = z.infer<typeof manifestEntrySchema>;

const CATEGORY_MAP: Record<ManifestEntry['category'], GalleryCategory> = {
  room: 'ROOMS',
  common: 'COMMON_AREAS',
  exterior: 'EXTERIOR',
  detail: 'DETAILS',
  signage: 'DETAILS',
  food: 'FOOD',
  surroundings: 'SURROUNDINGS',
};

const ROOM_TYPE_MAP: Record<string, RoomKind> = {
  individual: 'INDIVIDUAL',
  single: 'INDIVIDUAL',
  couple: 'COUPLE',
  twin: 'TWIN',
  family: 'FAMILY',
};

export interface ImportCandidate {
  file: string;
  altText: string;
  galleryCategory: GalleryCategory;
  isRoomPhoto: boolean;
  roomType: RoomKind | null;
  /**
   * Publishable without further review: quality "ok" and no identifiable people (people need
   * written authorization, requirement 15.1).
   */
  publishable: boolean;
}

/** Drops `discard` entries and maps the manifest vocabulary to the data model. */
export function planImport(entries: readonly ManifestEntry[]): ImportCandidate[] {
  return entries
    .filter((entry) => entry.quality !== 'discard')
    .map((entry) => ({
      file: entry.file,
      altText: entry.altEs.trim(),
      galleryCategory: CATEGORY_MAP[entry.category],
      isRoomPhoto: entry.category === 'room',
      roomType: entry.roomType ? (ROOM_TYPE_MAP[entry.roomType.toLowerCase()] ?? null) : null,
      publishable: entry.quality === 'ok' && !entry.people,
    }));
}

/**
 * Spreads room photos over rooms, always picking the least-loaded eligible room (ties: room order),
 * so every room gets a photo before any gets a second. Photos with a known room type only go to
 * rooms of that type when any exist; typed photos are placed first. Deterministic.
 */
export function assignRoomPhotos<
  P extends { roomType: RoomKind | null },
  R extends { type: RoomKind },
>(photos: readonly P[], rooms: readonly R[]): Array<{ photo: P; room: R }> {
  if (rooms.length === 0) return [];
  const load = new Map<R, number>(rooms.map((room) => [room, 0]));
  const ordered = [...photos.filter((p) => p.roomType), ...photos.filter((p) => !p.roomType)];
  return ordered.map((photo) => {
    const sameType = photo.roomType ? rooms.filter((r) => r.type === photo.roomType) : [];
    const pool = sameType.length > 0 ? sameType : rooms;
    let target = pool[0] as R;
    for (const room of pool) {
      if ((load.get(room) ?? 0) < (load.get(target) ?? 0)) target = room;
    }
    load.set(target, (load.get(target) ?? 0) + 1);
    return { photo, room: target };
  });
}
