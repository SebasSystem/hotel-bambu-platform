import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PUBLIC_REDIRECTS } from '@/lib/public/redirects';
import { buildSitemap } from './sitemap';

const rooms = [
  { slug: 'habitacion-individual', updatedAt: '2026-11-04T10:00:00.000Z' },
  { slug: 'habitacion-pareja', updatedAt: '2026-11-06T03:32:40.568Z' },
];

describe('buildSitemap', () => {
  const previous = process.env.SITE_URL;
  beforeEach(() => {
    process.env.SITE_URL = 'https://hotelbambuplaza.com';
  });
  afterEach(() => {
    process.env.SITE_URL = previous;
  });

  const urls = (entries: { url: string }[]) => entries.map((entry) => entry.url);

  it('lists every public page and every published room type on the production origin', () => {
    const entries = buildSitemap({
      rooms,
      hotelUpdatedAt: '2026-11-05T12:00:00.000Z',
      legalApproved: false,
    });
    expect(urls(entries)).toEqual([
      'https://hotelbambuplaza.com/',
      'https://hotelbambuplaza.com/habitaciones',
      'https://hotelbambuplaza.com/habitaciones/habitacion-individual',
      'https://hotelbambuplaza.com/habitaciones/habitacion-pareja',
      'https://hotelbambuplaza.com/ubicacion',
      'https://hotelbambuplaza.com/galeria',
      'https://hotelbambuplaza.com/politicas-del-hotel',
    ]);
  });

  it('never lists a redirected URL or an admin/API path', () => {
    const entries = buildSitemap({ rooms, hotelUpdatedAt: null, legalApproved: true });
    const paths = entries.map((entry) => new URL(entry.url).pathname);
    for (const rule of PUBLIC_REDIRECTS) expect(paths).not.toContain(rule.source);
    expect(paths.filter((path) => /^\/(admin|api)(\/|$)/.test(path))).toEqual([]);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('takes lastModified from the data: room types, the hotel profile, or the newest of both', () => {
    const entries = buildSitemap({
      rooms,
      hotelUpdatedAt: '2026-11-05T12:00:00.000Z',
      legalApproved: false,
    });
    const at = (path: string) =>
      entries.find((entry) => entry.url === `https://hotelbambuplaza.com${path}`)?.lastModified;
    expect(at('/habitaciones/habitacion-individual')).toEqual(new Date('2026-11-04T10:00:00.000Z'));
    expect(at('/habitaciones')).toEqual(new Date('2026-11-06T03:32:40.568Z'));
    expect(at('/')).toEqual(new Date('2026-11-06T03:32:40.568Z'));
    expect(at('/ubicacion')).toEqual(new Date('2026-11-05T12:00:00.000Z'));
    // No data source for these pages: no invented date.
    expect(at('/galeria')).toBeUndefined();
    expect(at('/politicas-del-hotel')).toBeUndefined();
  });

  it('adds the legal pages only once the hotel approved them', () => {
    const draft = urls(buildSitemap({ rooms: [], hotelUpdatedAt: null, legalApproved: false }));
    const approved = urls(buildSitemap({ rooms: [], hotelUpdatedAt: null, legalApproved: true }));
    expect(draft.some((url) => url.includes('/legal/'))).toBe(false);
    expect(approved.filter((url) => url.includes('/legal/'))).toHaveLength(3);
  });

  it('ignores an unparsable date instead of emitting an invalid lastmod', () => {
    const entries = buildSitemap({
      rooms: [{ slug: 'x', updatedAt: 'not a date' }],
      hotelUpdatedAt: null,
      legalApproved: false,
    });
    expect(entries.every((entry) => entry.lastModified === undefined)).toBe(true);
  });
});
