// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { PublicRoomTypeSummary } from '@/lib/public/types';
import { RoomCard } from './room-card';

const room: PublicRoomTypeSummary = {
  slug: 'suite',
  name: 'Suite',
  type: 'COUPLE',
  description: null,
  capacity: 2,
  basePrice: null,
  currency: 'COP',
  priceUnit: 'PER_NIGHT',
  taxesIncluded: true,
  cover: null,
  publishedRoomCount: 4,
  updatedAt: '2026-11-01T00:00:00.000Z',
  beds: null,
  areaM2: null,
  amenities: [
    { name: 'Televisor', iconKey: 'tv', availability: 'ALL' },
    { name: 'Aire acondicionado', iconKey: 'snowflake', availability: 'SOME' },
  ],
};

describe('RoomCard amenities (owner review A9)', () => {
  afterEach(cleanup);

  it('says when an amenity is only in some rooms of the type', () => {
    render(<RoomCard room={room} cta={null} />);
    const chips = screen.getAllByRole('listitem').map((item) => item.textContent);
    expect(chips).toEqual(['Televisor', 'Aire acondicionado en algunas habitaciones']);
  });
});
