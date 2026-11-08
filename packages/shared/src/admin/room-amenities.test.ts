import { describe, expect, it } from 'vitest';
import {
  normalizeRoomAmenityOverrides,
  roomAmenityIds,
  roomTypeAmenityAvailability,
} from './room-amenities.js';
import { roomCreateSchema, roomUpdateSchema } from './admin.js';

const TV = '00000000-0000-7000-8000-000000000001';
const FAN = '00000000-0000-7000-8000-000000000002';
const AC = '00000000-0000-7000-8000-000000000003';

describe('roomAmenityIds', () => {
  it('inherits the type amenities and applies the room overrides', () => {
    expect(roomAmenityIds([TV, FAN], [])).toEqual([TV, FAN]);
    expect(
      roomAmenityIds(
        [TV, FAN],
        [
          { amenityId: FAN, available: false },
          { amenityId: AC, available: true },
        ],
      ),
    ).toEqual([TV, AC]);
  });
});

describe('normalizeRoomAmenityOverrides', () => {
  it('keeps only real differences from the type', () => {
    expect(
      normalizeRoomAmenityOverrides(
        [TV, FAN],
        [
          { amenityId: TV, available: true }, // same as the type: dropped
          { amenityId: FAN, available: false },
          { amenityId: AC, available: false }, // the type lacks it anyway: dropped
          { amenityId: AC, available: false },
        ],
      ),
    ).toEqual([{ amenityId: FAN, available: false }]);
  });
});

describe('roomTypeAmenityAvailability', () => {
  it('behaves as before when no room overrides anything', () => {
    expect(roomTypeAmenityAvailability([TV, FAN], [[], []])).toEqual(
      new Map([
        [TV, 'ALL'],
        [FAN, 'ALL'],
      ]),
    );
  });

  it('keeps type amenities when the type has no published rooms yet', () => {
    expect(roomTypeAmenityAvailability([TV], [])).toEqual(new Map([[TV, 'ALL']]));
  });

  it('marks amenities present in some rooms and hides those present in none', () => {
    const availability = roomTypeAmenityAvailability(
      [TV, FAN],
      [
        [
          { amenityId: FAN, available: false },
          { amenityId: AC, available: true },
        ],
        [{ amenityId: FAN, available: false }],
      ],
    );
    expect(availability).toEqual(
      new Map([
        [TV, 'ALL'],
        [AC, 'SOME'],
      ]),
    );
  });

  it('shows a room-only amenity as ALL when every published room adds it', () => {
    expect(
      roomTypeAmenityAvailability(
        [],
        [[{ amenityId: AC, available: true }], [{ amenityId: AC, available: true }]],
      ),
    ).toEqual(new Map([[AC, 'ALL']]));
  });
});

describe('room schemas', () => {
  it('accept amenity overrides, unique per amenity', () => {
    const room = roomCreateSchema.parse({
      name: '101',
      roomTypeId: TV,
      amenityOverrides: [{ amenityId: FAN, available: false }],
    });
    expect(room.amenityOverrides).toEqual([{ amenityId: FAN, available: false }]);
    expect(
      roomUpdateSchema.safeParse({
        amenityOverrides: [
          { amenityId: FAN, available: false },
          { amenityId: FAN, available: true },
        ],
      }).success,
    ).toBe(false);
  });
});
