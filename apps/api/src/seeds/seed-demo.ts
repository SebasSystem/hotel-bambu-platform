import type { PrismaClient } from '../generated/prisma/client.js';
import { AMENITIES } from './base-data.js';

/** Room equipment only: HOTEL amenities are never assigned per room (ADR 0015). */
const ROOM_AMENITIES = AMENITIES.filter((amenity) => amenity.scope === 'ROOM');
import { DEMO_FAQS, DEMO_MARKER, DEMO_POLICIES, buildDemoRooms } from './demo-data.js';
import { assertDemoSeedAllowed } from './seed-guards.js';

export interface SeedDemoResult {
  rooms: number;
  faqs: number;
  policies: number;
}

/**
 * Demo seed (local/staging only). Re-runnable: rooms are upserted by slug (demo text refreshed,
 * images and status kept); [DEMO] FAQ and policy rows are replaced. Requires db:seed:base first
 * (amenity catalog). Rooms start as DRAFT; media:import adds photos and publishes rooms that get
 * a cover, honouring the publication rule (cover image with alt text).
 */
export async function seedDemo(
  prisma: PrismaClient,
  env: Readonly<Record<string, string | undefined>> = process.env,
): Promise<SeedDemoResult> {
  assertDemoSeedAllowed(env);

  return prisma.$transaction(async (tx) => {
    const amenities = await tx.amenity.findMany({
      where: { scope: 'ROOM', name: { in: ROOM_AMENITIES.map((a) => a.name) } },
      select: { id: true },
    });
    if (amenities.length !== ROOM_AMENITIES.length) {
      throw new Error('Amenity catalog missing: run db:seed:base before db:seed:demo.');
    }

    for (const room of buildDemoRooms()) {
      const data = {
        name: room.name,
        type: room.type,
        capacity: room.capacity,
        beds: room.beds,
        shortDescription: room.shortDescription,
        description: room.description,
        sortOrder: room.sortOrder,
        // TODO(hotel): real informative rates (COP, taxes included). Null hides the price.
        basePrice: null,
        currency: 'COP',
        priceUnit: 'PER_NIGHT' as const,
        taxesIncluded: true,
      };
      const saved = await tx.room.upsert({
        where: { slug: room.slug },
        create: { slug: room.slug, status: 'DRAFT', ...data },
        update: data,
        select: { id: true },
      });
      await tx.roomAmenity.createMany({
        data: amenities.map((a) => ({ roomId: saved.id, amenityId: a.id })),
        skipDuplicates: true,
      });
    }

    await tx.faq.deleteMany({ where: { question: { startsWith: DEMO_MARKER } } });
    await tx.faq.createMany({
      data: DEMO_FAQS.map((faq, index) => ({ ...faq, sortOrder: index, published: true })),
    });

    await tx.hotelPolicy.deleteMany({ where: { title: { startsWith: DEMO_MARKER } } });
    await tx.hotelPolicy.createMany({
      data: DEMO_POLICIES.map((policy, index) => ({
        ...policy,
        sortOrder: index,
        published: true,
      })),
    });

    return {
      rooms: await tx.room.count({ where: { name: { startsWith: DEMO_MARKER } } }),
      faqs: await tx.faq.count({ where: { question: { startsWith: DEMO_MARKER } } }),
      policies: await tx.hotelPolicy.count({ where: { title: { startsWith: DEMO_MARKER } } }),
    };
  });
}
