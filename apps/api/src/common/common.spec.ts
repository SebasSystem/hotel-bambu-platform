import { BadRequestException, ConflictException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { Prisma } from '../generated/prisma/client.js';
import { isPromotionActive } from '../modules/promotions/promotions.js';
import { hotelDay } from '../modules/analytics/analytics.js';
import { disallowedVariables } from '../modules/hotel/hotel.js';
import { toPublicMedia } from '../modules/media/media-url.js';
import { changedFields } from '../modules/audit/audit.service.js';
import { toErrorResponse } from './http-exception.filter.js';

describe('toErrorResponse', () => {
  it('keeps validation details in the uniform shape', () => {
    const { status, body } = toErrorResponse(
      new BadRequestException({ message: 'Validation failed', details: [{ path: 'name' }] }),
    );
    expect(status).toBe(400);
    expect(body).toEqual({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation failed',
      details: [{ path: 'name' }],
    });
  });

  it('maps unique violations to 409 without leaking the constraint', () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed on secret_idx',
      {
        code: 'P2002',
        clientVersion: 'test',
      },
    );
    const { status, body } = toErrorResponse(error);
    expect(status).toBe(409);
    expect(JSON.stringify(body)).not.toContain('secret_idx');
  });

  it('hides unexpected errors behind a generic 500', () => {
    const { status, body } = toErrorResponse(new Error('db password is hunter2'));
    expect(status).toBe(500);
    expect(body.message).toBe('Internal server error.');
    expect(JSON.stringify(body)).not.toContain('hunter2');
  });

  it('passes through Nest HTTP exceptions', () => {
    expect(toErrorResponse(new ConflictException('Slug is already in use.')).body.message).toBe(
      'Slug is already in use.',
    );
  });
});

describe('publication helpers', () => {
  const media = {
    id: 'm1',
    altText: 'Fachada',
    caption: null,
    width: 960,
    height: 1280,
    blurDataUrl: null,
    dominantColor: '#123456',
    variants: [
      { width: 960, height: 1280, format: 'webp', key: 'media/2026/11/abc/960.webp', sizeBytes: 1 },
      { width: 640, height: 853, format: 'avif', key: 'media/2026/11/abc/640.avif', sizeBytes: 1 },
      { bogus: true },
    ],
    status: 'READY',
  };

  it('builds public variant URLs sorted by width and drops malformed entries', () => {
    const result = toPublicMedia(media, 'https://cdn.example/hotel-media');
    expect(result?.variants.map((v) => v.url)).toEqual([
      'https://cdn.example/hotel-media/media/2026/11/abc/640.avif',
      'https://cdn.example/hotel-media/media/2026/11/abc/960.webp',
    ]);
  });

  it('never exposes unprocessed or undescribed media', () => {
    expect(toPublicMedia({ ...media, status: 'PROCESSING' }, 'https://cdn.example')).toBeNull();
    expect(toPublicMedia({ ...media, altText: ' ' }, 'https://cdn.example')).toBeNull();
  });

  it('shows promotions only while published and in date', () => {
    const promo = {
      status: 'PUBLISHED',
      startsAt: new Date('2026-11-01T00:00:00Z'),
      endsAt: new Date('2026-11-10T00:00:00Z'),
    };
    expect(isPromotionActive(promo, new Date('2026-11-05T00:00:00Z'))).toBe(true);
    expect(isPromotionActive(promo, new Date('2026-11-10T00:00:00Z'))).toBe(false);
    expect(isPromotionActive({ ...promo, status: 'DRAFT' }, new Date('2026-11-05T00:00:00Z'))).toBe(
      false,
    );
  });

  it('only allows declared WhatsApp template variables', () => {
    expect(disallowedVariables('Hola {{habitacion}} {{ precio }}', ['habitacion'])).toEqual([
      'precio',
    ]);
    expect(disallowedVariables('Hola', [])).toEqual([]);
  });

  it('counts analytics per hotel-local day (America/Bogota, UTC-5)', () => {
    expect(hotelDay(new Date('2026-11-05T03:00:00Z')).toISOString()).toBe(
      '2026-11-04T00:00:00.000Z',
    );
    expect(hotelDay(new Date('2026-11-05T06:00:00Z')).toISOString()).toBe(
      '2026-11-05T00:00:00.000Z',
    );
  });

  it('audits field names only, never secret-looking keys', () => {
    expect(changedFields({ name: 'x', passwordHash: 'y', csrfToken: 'z', slug: 's' })).toEqual([
      'name',
      'slug',
    ]);
  });
});
