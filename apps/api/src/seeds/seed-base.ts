import type { PrismaClient } from '../generated/prisma/client.js';
import {
  AMENITIES,
  HOTEL_NAME,
  LANDING_SECTIONS,
  SERVICES,
  WHATSAPP_TEMPLATES,
} from './base-data.js';

export interface SeedBaseResult {
  hotelProfile: 'created' | 'kept';
  landingSections: number;
  whatsappTemplates: number;
  amenities: number;
  services: number;
}

/**
 * Idempotent base seed. Creates missing rows only (`update: {}`): content edited in /admin is never
 * overwritten by a re-run. Safe in every environment.
 */
export async function seedBase(prisma: PrismaClient): Promise<SeedBaseResult> {
  return prisma.$transaction(async (tx) => {
    const existingHotel = await tx.hotelProfile.findUnique({ where: { id: 1 } });
    await tx.hotelProfile.upsert({
      where: { id: 1 },
      create: { id: 1, name: HOTEL_NAME },
      update: {},
    });

    for (const [index, section] of LANDING_SECTIONS.entries()) {
      await tx.landingSection.upsert({
        where: { key: section.key },
        create: {
          key: section.key,
          title: section.title,
          ctaLabel: section.ctaLabel ?? null,
          enabled: true,
          sortOrder: index,
        },
        update: {},
      });
    }

    for (const template of WHATSAPP_TEMPLATES) {
      await tx.whatsAppTemplate.upsert({
        where: { key: template.key },
        create: template,
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

    for (const [index, service] of SERVICES.entries()) {
      await tx.service.upsert({
        where: { name: service.name },
        create: { ...service, active: true, highlighted: true, sortOrder: index },
        update: {},
      });
    }

    return {
      hotelProfile: existingHotel ? 'kept' : 'created',
      landingSections: await tx.landingSection.count(),
      whatsappTemplates: await tx.whatsAppTemplate.count(),
      amenities: await tx.amenity.count(),
      services: await tx.service.count(),
    };
  });
}
