import { describe, expect, it } from 'vitest';
import {
  filterRoomsByType,
  otherRooms,
  roomTypeFilters,
  roomTypeFromParam,
  publishedRoomTotal,
  roomExcerpt,
  roomTypeLabel,
  bedsText,
  roomTypeLead,
  roomAmenityLabel,
  amenitiesInEveryRoom,
} from './rooms';
import type { PublicRoomTypeSummary } from './types';

function room(
  slug: string,
  type: string,
  basePrice: number | null,
  capacity = 1,
): PublicRoomTypeSummary {
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
    beds: null,
    areaM2: null,
    amenities: [
      { name: 'Wi-Fi', iconKey: 'wifi', availability: 'ALL' as const },
      ...(slug.endsWith('tv')
        ? [{ name: 'Televisor', iconKey: 'tv', availability: 'ALL' as const }]
        : []),
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

describe('bedsText', () => {
  it('writes the bed setup in running text, or null without beds', () => {
    expect(
      bedsText([
        { type: 'DOUBLE', count: 1 },
        { type: 'SINGLE', count: 2 },
        { type: 'KING', count: 0 },
      ]),
    ).toBe('1 cama doble, 2 camas sencillas');
    expect(bedsText([])).toBeNull();
    expect(bedsText(null)).toBeNull();
  });
});

describe('roomTypeLead', () => {
  const type = {
    name: 'Habitación de pareja',
    capacity: 2,
    description: null,
    amenities: [{ name: 'Baño privado' }, { name: 'Televisor' }, { name: 'Ventilador' }],
  };

  it('uses the first paragraph of the hotel description when there is one', () => {
    expect(roomTypeLead({ ...type, description: 'Luminosa.\n\nSegundo.' }, 'Mocoa')).toBe(
      'Luminosa.',
    );
  });

  it('otherwise states the real facts: capacity, city and room amenities', () => {
    expect(roomTypeLead(type, 'Mocoa')).toBe(
      'Habitación de pareja para 2 personas en el corazón de Mocoa, con baño privado, televisor y ventilador.',
    );
    expect(roomTypeLead({ ...type, capacity: 1, amenities: [] }, null)).toBe(
      'Habitación de pareja para 1 persona.',
    );
  });
});

describe('room amenities across the published rooms (owner review A9)', () => {
  it('labels an amenity only some rooms have', () => {
    expect(roomAmenityLabel({ name: 'Aire acondicionado', availability: 'SOME' })).toBe(
      'Aire acondicionado en algunas habitaciones',
    );
    expect(roomAmenityLabel({ name: 'Televisor', availability: 'ALL' })).toBe('Televisor');
  });

  it('keeps only the amenities every room has for facts and structured data', () => {
    expect(
      amenitiesInEveryRoom([
        { name: 'Televisor', availability: 'ALL' as const },
        { name: 'Aire acondicionado', availability: 'SOME' as const },
      ]).map((amenity) => amenity.name),
    ).toEqual(['Televisor']);
  });

  it('builds the fallback lead only from amenities every room has', () => {
    expect(
      roomTypeLead(
        {
          name: 'Suite',
          capacity: 2,
          description: null,
          amenities: [
            { name: 'Televisor', availability: 'ALL' },
            { name: 'Aire acondicionado', availability: 'SOME' },
          ],
        },
        'Mocoa',
      ),
    ).toBe('Suite para 2 personas en el corazón de Mocoa, con televisor.');
  });
});
