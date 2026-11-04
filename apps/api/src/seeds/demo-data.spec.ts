import { slugSchema } from '@hotel-bambu/shared';
import { describe, expect, it } from 'vitest';
import { DEMO_FAQS, DEMO_MARKER, DEMO_POLICIES, buildDemoRooms } from './demo-data.js';

describe('buildDemoRooms', () => {
  const rooms = buildDemoRooms();

  it('creates 16 rooms mixing individual and couple types', () => {
    expect(rooms).toHaveLength(16);
    expect(rooms.filter((r) => r.type === 'COUPLE').length).toBeGreaterThan(0);
    expect(rooms.filter((r) => r.type === 'INDIVIDUAL').length).toBeGreaterThan(0);
  });

  it('marks every visible text as demo', () => {
    for (const room of rooms) {
      expect(room.name.startsWith(DEMO_MARKER)).toBe(true);
      expect(room.shortDescription.startsWith(DEMO_MARKER)).toBe(true);
      expect(room.description.startsWith(DEMO_MARKER)).toBe(true);
    }
    for (const faq of DEMO_FAQS) expect(faq.question.startsWith(DEMO_MARKER)).toBe(true);
    for (const policy of DEMO_POLICIES) expect(policy.title.startsWith(DEMO_MARKER)).toBe(true);
  });

  it('generates unique, valid slugs from the names', () => {
    const slugs = rooms.map((r) => r.slug);
    expect(new Set(slugs).size).toBe(16);
    for (const slug of slugs) expect(slugSchema.safeParse(slug).success).toBe(true);
    expect(rooms[0]).toMatchObject({
      name: '[DEMO] Habitación Pareja 101',
      slug: 'demo-habitacion-pareja-101',
      capacity: 2,
    });
  });
});
