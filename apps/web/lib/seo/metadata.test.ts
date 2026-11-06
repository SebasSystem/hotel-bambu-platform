import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { PublicMedia } from '@/lib/public/types';
import { DEFAULT_OG_IMAGE, pageMetadata } from './metadata';

const photo: PublicMedia = {
  id: 'm1',
  altText: 'Fachada del hotel',
  caption: null,
  width: 1600,
  height: 1067,
  blurDataUrl: null,
  dominantColor: null,
  variants: [
    { format: 'avif', width: 1600, height: 1067, url: 'https://media.example/1600.avif' },
    { format: 'webp', width: 960, height: 640, url: 'https://media.example/960.webp' },
    { format: 'webp', width: 1600, height: 1067, url: 'https://media.example/1600.webp' },
  ],
} as PublicMedia;

const base = {
  siteName: 'Hotel Bambú Plaza',
  title: 'Habitaciones en Mocoa – Hotel Bambú Plaza',
  description: 'Habitaciones individuales y de pareja.',
};

describe('pageMetadata', () => {
  const previous = process.env.SITE_URL;
  beforeEach(() => {
    process.env.SITE_URL = 'https://hotelbambuplaza.com/';
  });
  afterEach(() => {
    process.env.SITE_URL = previous;
  });

  it('declares a self-referential absolute canonical on the production origin', () => {
    const meta = pageMetadata({ ...base, path: '/habitaciones' });
    expect(meta.alternates?.canonical).toBe('https://hotelbambuplaza.com/habitaciones');
    expect(meta.openGraph).toMatchObject({ url: 'https://hotelbambuplaza.com/habitaciones' });
  });

  it('drops the query string and the hash from the canonical (filters are not pages)', () => {
    const meta = pageMetadata({ ...base, path: '/habitaciones?tipo=pareja#lista' });
    expect(meta.alternates?.canonical).toBe('https://hotelbambuplaza.com/habitaciones');
  });

  it('keeps the home canonical as the bare origin with its trailing slash', () => {
    expect(pageMetadata({ ...base, path: '/' }).alternates?.canonical).toBe(
      'https://hotelbambuplaza.com/',
    );
  });

  it('shares the largest WebP of a real photo with its alt text, in Colombian Spanish', () => {
    const meta = pageMetadata({ ...base, path: '/', image: photo });
    expect(meta.openGraph).toMatchObject({
      locale: 'es_CO',
      siteName: 'Hotel Bambú Plaza',
      title: base.title,
      description: base.description,
      images: [
        {
          url: 'https://media.example/1600.webp',
          width: 1600,
          height: 1067,
          alt: 'Fachada del hotel',
        },
      ],
    });
    expect(meta.twitter).toMatchObject({
      card: 'summary_large_image',
      title: base.title,
      images: ['https://media.example/1600.webp'],
    });
  });

  it('falls back to the brand share image without a photo', () => {
    const meta = pageMetadata({ ...base, path: '/galeria' });
    expect(meta.openGraph).toMatchObject({ images: [DEFAULT_OG_IMAGE] });
  });

  it('can mark a page noindex while keeping its links followable', () => {
    expect(pageMetadata({ ...base, path: '/legal/cookies', noindex: true }).robots).toEqual({
      index: false,
      follow: true,
    });
    expect(pageMetadata({ ...base, path: '/' }).robots).toBeUndefined();
  });
});
