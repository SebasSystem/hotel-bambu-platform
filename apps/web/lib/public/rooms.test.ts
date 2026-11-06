import { describe, expect, it } from 'vitest';
import {
  filterRoomsByType,
  otherRooms,
  roomTypeFilters,
  roomTypeFromParam,
  roomTypeLabel,
  summarizeRoomTypes,
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
    shortDescription: null,
    capacity,
    basePrice,
    currency: 'COP',
    priceUnit: 'PER_NIGHT',
    taxesIncluded: true,
    cover: null,
    updatedAt: '2026-11-01T00:00:00.000Z',
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
