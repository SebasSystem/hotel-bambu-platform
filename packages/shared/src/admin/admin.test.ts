import { describe, expect, it } from 'vitest';
import {
  hotelProfileUpdateSchema,
  isAllowedSocialUrl,
  promotionCreateSchema,
  reorderSchema,
  roomCreateSchema,
  roomImagesSchema,
  socialLinkCreateSchema,
  templateVariables,
} from './admin.js';

const ID_A = '01a1a882-2549-7326-9bd7-7806f53f0c75';
const ID_B = '01a1a882-2549-7326-9bd7-7806f53f0c76';

describe('admin schemas', () => {
  it('rejects unexpected properties', () => {
    expect(
      roomCreateSchema.safeParse({ name: 'A', type: 'COUPLE', capacity: 2, admin: true }).success,
    ).toBe(false);
  });

  it('applies room defaults and trims text', () => {
    const room = roomCreateSchema.parse({ name: '  Suite  ', type: 'COUPLE', capacity: 2 });
    expect(room).toMatchObject({
      name: 'Suite',
      priceUnit: 'PER_NIGHT',
      taxesIncluded: true,
      amenityIds: [],
    });
  });

  it('turns empty optional text into null', () => {
    expect(hotelProfileUpdateSchema.parse({ legalName: '', mapUrl: '', email: '' })).toEqual({
      legalName: null,
      mapUrl: null,
      email: null,
    });
  });

  it('normalizes and validates the WhatsApp number', () => {
    expect(hotelProfileUpdateSchema.parse({ whatsappNumber: '+57 310 679-8260' })).toEqual({
      whatsappNumber: '573106798260',
    });
    expect(hotelProfileUpdateSchema.safeParse({ whatsappNumber: '0123' }).success).toBe(false);
  });

  it('accepts only https URLs on the expected social hosts', () => {
    expect(isAllowedSocialUrl('INSTAGRAM', 'https://www.instagram.com/hotel')).toBe(true);
    expect(isAllowedSocialUrl('INSTAGRAM', 'https://instagram.com.evil.example/x')).toBe(false);
    expect(
      socialLinkCreateSchema.safeParse({ platform: 'FACEBOOK', url: 'http://facebook.com/x' })
        .success,
    ).toBe(false);
    expect(
      socialLinkCreateSchema.safeParse({ platform: 'FACEBOOK', url: 'https://evil.example' })
        .success,
    ).toBe(false);
    expect(
      socialLinkCreateSchema.safeParse({ platform: 'OTHER', url: 'https://anything.example' })
        .success,
    ).toBe(true);
  });

  it('requires promotions to end after they start', () => {
    const base = { title: 'Promo', startsAt: '2026-12-01T00:00:00Z' };
    expect(
      promotionCreateSchema.safeParse({ ...base, endsAt: '2026-11-01T00:00:00Z' }).success,
    ).toBe(false);
    expect(
      promotionCreateSchema.safeParse({ ...base, endsAt: '2026-12-31T00:00:00Z' }).success,
    ).toBe(true);
  });

  it('allows at most one cover and no duplicate images', () => {
    expect(
      roomImagesSchema.safeParse({
        images: [
          { mediaAssetId: ID_A, isCover: true },
          { mediaAssetId: ID_B, isCover: true },
        ],
      }).success,
    ).toBe(false);
    expect(
      roomImagesSchema.safeParse({ images: [{ mediaAssetId: ID_A }, { mediaAssetId: ID_A }] })
        .success,
    ).toBe(false);
  });

  it('rejects duplicate ids when reordering', () => {
    expect(reorderSchema.safeParse({ ids: [ID_A, ID_A] }).success).toBe(false);
  });

  it('extracts template variables', () => {
    expect(templateVariables('Hola {{habitacion}} y {{ promocion }}')).toEqual([
      'habitacion',
      'promocion',
    ]);
  });
});
