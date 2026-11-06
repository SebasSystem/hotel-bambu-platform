import type { PrismaClient } from '../generated/prisma/client.js';
import { AMENITIES } from './base-data.js';
import {
  DEMO_FAQS,
  DEMO_MARKER,
  DEMO_POLICIES,
  DEMO_ROOM_TYPES,
  buildDemoRooms,
} from './demo-data.js';
import { assertDemoSeedAllowed } from './seed-guards.js';

/** Room equipment only: HOTEL amenities are never assigned per room type (ADR 0015). */
const ROOM_AMENITIES = AMENITIES.filter((amenity) => amenity.scope === 'ROOM');

/** Bed setups the pre-ADR 0016 demo seed invented for its rooms. */
const LEGACY_DEMO_BEDS = [[{ type: 'SINGLE', count: 1 }], [{ type: 'DOUBLE', count: 1 }]];

export interface SeedDemoResult {
  roomTypes: number;
  rooms: number;
  faqs: number;
  policies: number;
}

/**
 * Demo seed (local/staging only). Re-runnable: the confirmed room types are created when missing
 * (an existing type keeps its data, except that a [DEMO] description is cleared), each gets the
 * confirmed room equipment, and a type without rooms gets one [DEMO] example room. Existing rooms
 * are never touched. [DEMO] FAQ and policy rows are replaced. Requires db:seed:base first
 * (amenity catalog). New types start as DRAFT; media:import adds photos and publishes them.
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

    // Descriptions invented by earlier demo seeds are removed (owner decision 2026-11-05).
    await tx.roomType.updateMany({
      where: { description: { startsWith: DEMO_MARKER } },
      data: { description: null },
    });
    // So are the bed setups they assumed (one single / one double bed), on types that only have
    // demo rooms: the real beds are unknown.
    for (const beds of LEGACY_DEMO_BEDS) {
      await tx.roomType.updateMany({
        where: {
          beds: { equals: beds },
          rooms: { every: { name: { startsWith: DEMO_MARKER } } },
        },
        data: { beds: [] },
      });
    }

    const typeIds = new Map<string, string>();
    for (const type of DEMO_ROOM_TYPES) {
      // An existing type of the same kind (e.g. created by the room-type migration) is reused.
      const existing =
        (await tx.roomType.findUnique({ where: { slug: type.slug }, select: { id: true } })) ??
        (await tx.roomType.findFirst({
          where: { type: type.type },
          orderBy: { sortOrder: 'asc' },
          select: { id: true },
        }));
      const saved =
        existing ??
        (await tx.roomType.create({
          data: {
            slug: type.slug,
            name: type.name,
            type: type.type,
            capacity: type.capacity,
            sortOrder: type.sortOrder,
            status: 'DRAFT',
            // TODO(hotel): description, beds, area and informative rates (COP, taxes included).
          },
          select: { id: true },
        }));
      typeIds.set(type.slug, saved.id);
      await tx.roomTypeAmenity.createMany({
        data: amenities.map((a) => ({ roomTypeId: saved.id, amenityId: a.id })),
        skipDuplicates: true,
      });
    }

    for (const [index, room] of buildDemoRooms().entries()) {
      const roomTypeId = typeIds.get(room.typeSlug)!;
      // Only for a type without rooms: existing rooms (demo or real) are never multiplied.
      const hasRooms = await tx.room.count({ where: { roomTypeId } });
      if (!hasRooms) {
        const max = await tx.room.aggregate({ _max: { sortOrder: true } });
        await tx.room.create({
          data: {
            name: room.name,
            roomTypeId,
            status: 'DRAFT',
            sortOrder: (max._max.sortOrder ?? -1) + 1 + index,
          },
        });
      }
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
      roomTypes: await tx.roomType.count(),
      rooms: await tx.room.count({ where: { name: { startsWith: DEMO_MARKER } } }),
      faqs: await tx.faq.count({ where: { question: { startsWith: DEMO_MARKER } } }),
      policies: await tx.hotelPolicy.count({ where: { title: { startsWith: DEMO_MARKER } } }),
    };
  });
}
