import { describe, expect, it } from 'vitest';
import {
  filterRoomsByType,
  otherRooms,
  roomTypeFilters,
  roomTypeFromParam,
  publishedRoomTotal,
  roomExcerpt,
  roomTypeLabel,
} from './rooms';
import type { PublicRoomSummary } from './types';

function room(
  slug: string,
  type: string,
  basePrice: number | null,
  capacity = 1,
): PublicRoomSummary {
  return {
    slug,
    name: slug,
    type,
    description: null,
    capacity,
    basePrice,
    currency: 'COP',
    priceUnit: 'PER_NIGHT',
    taxesIncluded: true,
    cover: null,
    publishedRoomCount: 1,
    updatedAt: '2026-11-01T00:00:00.000Z',
    amenities: [
      { name: 'Wi-Fi', iconKey: 'wifi' },
      ...(slug.endsWith('tv') ? [{ name: 'Televisor', iconKey: 'tv' }] : []),
    ],
  };
}

describe('publishedRoomTotal', () => {
  it('adds up the published rooms of every type (home fact stack)', () => {
    expect(
      publishedRoomTotal([
        { ...room('a', 'COUPLE', null), publishedRoomCount: 8 },
        { ...room('b', 'INDIVIDUAL', null), publishedRoomCount: 7 },
      ]),
    ).toBe(15);
    expect(publishedRoomTotal([])).toBe(0);
  });
});

describe('roomExcerpt', () => {
  it('is the first paragraph of the type description, or null', () => {
    expect(roomExcerpt('Cama doble y luz natural.\n\nSegundo párrafo.')).toBe(
      'Cama doble y luz natural.',
    );
    expect(roomExcerpt(null)).toBeNull();
    expect(roomExcerpt('  ')).toBeNull();
  });

  it('cuts a long paragraph at a word boundary with an ellipsis', () => {
    const excerpt = roomExcerpt('palabra '.repeat(40), 60)!;
    expect(excerpt.length).toBeLessThanOrEqual(61);
    expect(excerpt.endsWith('palabra…')).toBe(true);
  });
});

describe('roomTypeFromParam / otherRooms', () => {
  it('maps URL filter values and ignores unknown ones', () => {
    expect(roomTypeFromParam('pareja')).toBe('COUPLE');
    expect(roomTypeFromParam(['individual'])).toBe('INDIVIDUAL');
    expect(roomTypeFromParam('suite')).toBeNull();
    expect(roomTypeFromParam(undefined)).toBeNull();
  });

  it('suggests room types of the same kind first, excluding the current one', () => {
    const rooms = [
      room('a', 'COUPLE', null),
      room('b', 'INDIVIDUAL', null),
      room('c', 'COUPLE', null),
    ];
    expect(otherRooms(rooms, rooms[0]!).map((r) => r.slug)).toEqual(['c', 'b']);
  });
});

describe('room type filters (owner decision Q5)', () => {
  it('labels the four types in Spanish', () => {
    expect(['INDIVIDUAL', 'COUPLE', 'TWIN', 'FAMILY'].map(roomTypeLabel)).toEqual([
      'Individual',
      'Pareja',
      'Doble',
      'Familiar',
    ]);
  });

  it('offers one chip per type that has rooms, in a stable order, with counts', () => {
    const filters = roomTypeFilters([
      room('a', 'FAMILY', null),
      room('b', 'COUPLE', null),
      room('c', 'COUPLE', null),
    ]);
    expect(filters).toEqual([
      { type: 'COUPLE', param: 'pareja', label: 'Pareja', count: 2 },
      { type: 'FAMILY', param: 'familiar', label: 'Familiar', count: 1 },
    ]);
  });

  it('filters by the active type and keeps every room without one', () => {
    const rooms = [room('a', 'COUPLE', null), room('b', 'INDIVIDUAL', null)];
    expect(filterRoomsByType(rooms, 'INDIVIDUAL').map((r) => r.slug)).toEqual(['b']);
    expect(filterRoomsByType(rooms, null)).toHaveLength(2);
  });
});
