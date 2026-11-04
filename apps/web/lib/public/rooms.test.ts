import { describe, expect, it } from 'vitest';
import { otherRooms, roomTypeFromParam, summarizeRoomTypes } from './rooms';
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
    shortDescription: null,
    capacity,
    basePrice,
    currency: 'COP',
    priceUnit: 'PER_NIGHT',
    taxesIncluded: true,
    cover: null,
    amenities: [
      { name: 'Wi-Fi', iconKey: 'wifi' },
      ...(slug.endsWith('tv') ? [{ name: 'Televisor', iconKey: 'tv' }] : []),
    ],
  };
}

describe('summarizeRoomTypes', () => {
  it('groups published rooms by type with count, capacity, cheapest rate and shared amenities', () => {
    const summary = summarizeRoomTypes([
      room('p1-tv', 'COUPLE', 150000, 2),
      room('i1', 'INDIVIDUAL', null),
      room('p2', 'COUPLE', 120000, 2),
    ]);
    expect(summary.map((s) => s.type)).toEqual(['INDIVIDUAL', 'COUPLE']);
    const couple = summary[1]!;
    expect(couple.count).toBe(2);
    expect(couple.maxCapacity).toBe(2);
    expect(couple.cheapest?.basePrice).toBe(120000);
    expect(couple.sharedAmenities.map((a) => a.name)).toEqual(['Wi-Fi']);
    expect(summary[0]!.cheapest).toBeNull();
  });
});

describe('roomTypeFromParam / otherRooms', () => {
  it('maps URL filter values and ignores unknown ones', () => {
    expect(roomTypeFromParam('pareja')).toBe('COUPLE');
    expect(roomTypeFromParam(['individual'])).toBe('INDIVIDUAL');
    expect(roomTypeFromParam('suite')).toBeNull();
    expect(roomTypeFromParam(undefined)).toBeNull();
  });

  it('suggests rooms of the same type first, excluding the current one', () => {
    const rooms = [
      room('a', 'COUPLE', null),
      room('b', 'INDIVIDUAL', null),
      room('c', 'COUPLE', null),
    ];
    expect(otherRooms(rooms, rooms[0]!).map((r) => r.slug)).toEqual(['c', 'b']);
  });
});
