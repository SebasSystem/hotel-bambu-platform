import type { PrismaClient } from '../generated/prisma/client.js';
import {
  AMENITIES,
  HOTEL_FACTS,
  HOTEL_NAME,
  LANDING_SECTIONS,
  missingHotelFacts,
} from './base-data.js';

export interface SeedBaseResult {
  hotelProfile: 'created' | 'kept';
  /** Approved facts written into empty profile fields on this run. */
  hotelFactsFilled: number;
  landingSections: number;
  amenities: number;
}

/**
 * Idempotent base seed. Creates missing rows only (`update: {}`) and fills only empty hotel profile
 * fields: content edited in /admin is never overwritten by a re-run. Safe in every environment.
 */
export async function seedBase(prisma: PrismaClient): Promise<SeedBaseResult> {
  return prisma.$transaction(async (tx) => {
    const existingHotel = await tx.hotelProfile.findUnique({ where: { id: 1 } });
    let hotelFactsFilled = Object.keys(HOTEL_FACTS).length;
    if (existingHotel) {
      const missing = missingHotelFacts({
        ...existingHotel,
        latitude: existingHotel.latitude === null ? null : Number(existingHotel.latitude),
        longitude: existingHotel.longitude === null ? null : Number(existingHotel.longitude),
      });
      hotelFactsFilled = Object.keys(missing).length;
      if (hotelFactsFilled > 0) await tx.hotelProfile.update({ where: { id: 1 }, data: missing });
    } else {
      await tx.hotelProfile.create({ data: { id: 1, name: HOTEL_NAME, ...HOTEL_FACTS } });
    }

    for (const [index, key] of LANDING_SECTIONS.entries()) {
      await tx.landingSection.upsert({
        where: { key },
        create: { key, enabled: true, sortOrder: index },
        update: {},
      });
    }

    for (const [index, amenity] of AMENITIES.entries()) {
      await tx.amenity.upsert({
        where: { name: amenity.name },
        create: { ...amenity, active: true, sortOrder: index },
        update: {},
      });
    }

    return {
      hotelProfile: existingHotel ? 'kept' : 'created',
      hotelFactsFilled,
      landingSections: await tx.landingSection.count(),
      amenities: await tx.amenity.count(),
    };
  });
}
