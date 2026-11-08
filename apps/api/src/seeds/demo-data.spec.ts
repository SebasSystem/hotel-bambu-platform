import { slugSchema } from '@hotel-bambu/shared';
import { describe, expect, it } from 'vitest';
import { DEMO_MARKER, DEMO_ROOM_TYPES, buildDemoRooms } from './demo-data.js';

describe('demo data', () => {
  it('uses only the confirmed individual and couple types, with valid unique slugs', () => {
    expect(DEMO_ROOM_TYPES.map((t) => t.type)).toEqual(['INDIVIDUAL', 'COUPLE']);
    const slugs = DEMO_ROOM_TYPES.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slugSchema.safeParse(slug).success).toBe(true);
  });

  it('invents no descriptions, rates or beds for the types', () => {
    for (const type of DEMO_ROOM_TYPES) {
      expect(Object.keys(type).sort()).toEqual(['capacity', 'name', 'slug', 'sortOrder', 'type']);
    }
  });

  it('creates one example room per type instead of an invented split', () => {
    const rooms = buildDemoRooms();
    expect(rooms).toEqual([
      { name: '[DEMO] Habitación individual de ejemplo', typeSlug: 'habitacion-individual' },
      { name: '[DEMO] Habitación de pareja de ejemplo', typeSlug: 'habitacion-pareja' },
    ]);
  });

  it('marks every visible demo text and leaves guest policies and FAQ to the base seed', async () => {
    const demo: Record<string, unknown> = await import('./demo-data.js');
    expect(demo['DEMO_FAQS']).toBeUndefined();
    expect(demo['DEMO_POLICIES']).toBeUndefined();
    for (const room of buildDemoRooms()) expect(room.name.startsWith(DEMO_MARKER)).toBe(true);
  });
});
