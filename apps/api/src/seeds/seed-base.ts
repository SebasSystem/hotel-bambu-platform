import type { PrismaClient } from '../generated/prisma/client.js';
import {
  AMENITIES,
  HOTEL_FACTS,
  HOTEL_NAME,
  LANDING_SECTIONS,
  missingHotelFacts,
} from './base-data.js';
import {
  DEFAULT_POLICIES,
  DEFAULT_STAY_TIMES,
  DEMO_MARKER,
  buildDefaultFaqs,
  escnnaNoticeFor,
} from './default-content.js';

export interface SeedBaseResult {
  hotelProfile: 'created' | 'kept';
  /** Approved facts and default texts written into empty profile fields on this run. */
  hotelFactsFilled: number;
  landingSections: number;
  amenities: number;
  /** Default guest policies: created only when the hotel has none. */
  policies: 'created' | 'kept';
  /** Default frequent questions: created only when the hotel has none. */
  faqs: 'created' | 'kept';
  /** Leftover [DEMO] policies and FAQ removed on this run (earlier demo seeds created them). */
  demoRowsRemoved: number;
}

const isEmpty = (value: string | null | undefined) => !value?.trim();

/**
 * Idempotent base seed. Creates missing rows only (`update: {}`) and fills only empty hotel profile
 * fields: content edited in /admin is never overwritten by a re-run. Safe in every environment.
 *
 * Default guest content (owner review 2026-11-08, `default-content.ts`): the ESCNNA notice and the
 * check-in/out times go into empty profile fields; the policies and the FAQ are created, published,
 * only when the hotel has none of them. One-off convergence: policies and FAQ whose title/question
 * starts with "[DEMO]" (created by earlier demo seeds) are deleted first, so a database that only
 * had demo rows receives the defaults. No other table is touched by that cleanup.
 */
export async function seedBase(prisma: PrismaClient): Promise<SeedBaseResult> {
  return prisma.$transaction(async (tx) => {
    const existingHotel = await tx.hotelProfile.findUnique({ where: { id: 1 } });
    let hotelFactsFilled: number;
    if (existingHotel) {
      const missing = {
        ...missingHotelFacts({
          ...existingHotel,
          latitude: existingHotel.latitude === null ? null : Number(existingHotel.latitude),
          longitude: existingHotel.longitude === null ? null : Number(existingHotel.longitude),
        }),
        ...(isEmpty(existingHotel.escnnaNotice)
          ? { escnnaNotice: escnnaNoticeFor(existingHotel.name) }
          : {}),
        ...(isEmpty(existingHotel.checkInTime)
          ? { checkInTime: DEFAULT_STAY_TIMES.checkInTime }
          : {}),
        ...(isEmpty(existingHotel.checkOutTime)
          ? { checkOutTime: DEFAULT_STAY_TIMES.checkOutTime }
          : {}),
      };
      hotelFactsFilled = Object.keys(missing).length;
      if (hotelFactsFilled > 0) await tx.hotelProfile.update({ where: { id: 1 }, data: missing });
    } else {
      const data = {
        id: 1,
        name: HOTEL_NAME,
        ...HOTEL_FACTS,
        escnnaNotice: escnnaNoticeFor(HOTEL_NAME),
        ...DEFAULT_STAY_TIMES,
      };
      await tx.hotelProfile.create({ data });
      hotelFactsFilled = Object.keys(data).length - 2; // id and name are not facts
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

    const removedPolicies = await tx.hotelPolicy.deleteMany({
      where: { title: { startsWith: DEMO_MARKER } },
    });
    const removedFaqs = await tx.faq.deleteMany({
      where: { question: { startsWith: DEMO_MARKER } },
    });

    const createPolicies = (await tx.hotelPolicy.count()) === 0;
    if (createPolicies) {
      await tx.hotelPolicy.createMany({
        data: DEFAULT_POLICIES.map((policy, index) => ({
          ...policy,
          sortOrder: index,
          published: true,
        })),
      });
    }

    const createFaqs = (await tx.faq.count()) === 0;
    if (createFaqs) {
      const profile = await tx.hotelProfile.findUniqueOrThrow({ where: { id: 1 } });
      await tx.faq.createMany({
        data: buildDefaultFaqs(profile).map((faq, index) => ({
          ...faq,
          sortOrder: index,
          published: true,
        })),
      });
    }

    return {
      hotelProfile: existingHotel ? 'kept' : 'created',
      hotelFactsFilled,
      landingSections: await tx.landingSection.count(),
      amenities: await tx.amenity.count(),
      policies: createPolicies ? 'created' : 'kept',
      faqs: createFaqs ? 'created' : 'kept',
      demoRowsRemoved: removedPolicies.count + removedFaqs.count,
    };
  });
}
