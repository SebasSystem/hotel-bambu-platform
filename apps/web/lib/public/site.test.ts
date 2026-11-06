import { describe, expect, it } from 'vitest';
import type { PublicGalleryItem, PublicMedia, PublicRoomSummary, PublicSite } from './types';
import {
  displayPhone,
  fullAddress,
  heroImages,
  homeHotelAmenities,
  introText,
  isSectionEnabled,
  mapLinks,
} from './site';

const base = {
  name: 'Hotel Bambú Plaza',
  latitude: null,
  longitude: null,
  address: null,
  municipality: null,
  department: null,
  mapUrl: null,
};

describe('mapLinks', () => {
  it('is null without coordinates, address or map URL (block hidden)', () => {
    expect(mapLinks(base)).toBeNull();
  });

  it('prefers coordinates (Prisma decimals may arrive as strings)', () => {
    const links = mapLinks({ ...base, latitude: '1.1478', longitude: -76.6476 });
    expect(links?.embedUrl).toBe(
      `https://www.google.com/maps?q=${encodeURIComponent('1.1478,-76.6476')}&z=16&output=embed`,
    );
    expect(links?.directionsUrl).toContain('destination=1.1478%2C-76.6476');
  });

  it('uses the address and keeps a configured map URL for directions', () => {
    const links = mapLinks({
      ...base,
      address: 'Calle 1',
      municipality: 'Mocoa',
      mapUrl: 'https://maps.app.goo.gl/x',
    });
    expect(links?.embedUrl).toContain(encodeURIComponent('Hotel Bambú Plaza, Calle 1, Mocoa'));
    expect(links?.directionsUrl).toBe('https://maps.app.goo.gl/x');
  });
});

describe('fullAddress / displayPhone', () => {
  it('joins configured parts only', () => {
    expect(fullAddress({ address: null, municipality: 'Mocoa', department: 'Putumayo' })).toBe(
      'Mocoa, Putumayo',
    );
    expect(fullAddress({ address: null, municipality: null, department: null })).toBeNull();
  });

  it('formats Colombian mobile numbers', () => {
    expect(displayPhone('573001234567')).toBe('+57 300 123 4567');
    expect(displayPhone('15551234567')).toBe('+15551234567');
  });
});

const photo = (id: string, altText = id): PublicMedia => ({
  id,
  altText,
  caption: null,
  width: 1600,
  height: 900,
  blurDataUrl: null,
  dominantColor: null,
  variants: [],
});

const siteWith = (overrides: Partial<PublicSite>): PublicSite =>
  ({
    hotel: {},
    sections: [],
    heroSlides: [],
    hotelAmenities: [],
    homeAmenities: [],
    socialLinks: [],
    ...overrides,
  }) as unknown as PublicSite;

describe('heroImages', () => {
  const gallery = [
    { id: 'g', category: 'ROOMS', featured: true, media: photo('g1') },
  ] as PublicGalleryItem[];
  const rooms = [{ cover: photo('r1') }] as PublicRoomSummary[];

  it('uses the admin hero slides, in order and all of them, when there are any', () => {
    const slides = ['s1', 's2', 's3', 's4'].map((id) => ({ id, caption: null, media: photo(id) }));
    const site = siteWith({ heroSlides: slides });
    expect(heroImages(site, gallery, rooms).map((media) => media.id)).toEqual([
      's1',
      's2',
      's3',
      's4',
    ]);
  });

  it('puts the slide caption on its media', () => {
    const site = siteWith({ heroSlides: [{ id: 's1', caption: 'Llegada', media: photo('m1') }] });
    expect(heroImages(site, [], [])[0]?.caption).toBe('Llegada');
  });

  it('falls back to featured gallery photos, then room type covers, without slides', () => {
    const more = [
      ...gallery,
      { id: 'g2', category: 'ROOMS', featured: false, media: photo('g2') },
    ] as PublicGalleryItem[];
    expect(heroImages(siteWith({}), more, rooms).map((media) => media.id)).toEqual([
      'g1',
      'g2',
      'r1',
    ]);
    expect(heroImages(siteWith({}), [], [])).toEqual([]);
  });
});

describe('homeHotelAmenities', () => {
  it('keeps the hotel-wide amenities flagged for the home', () => {
    const amenity = (name: string, showOnHome: boolean) => ({
      id: name,
      name,
      description: null,
      iconKey: 'wifi',
      showOnHome,
    });
    const site = siteWith({
      hotelAmenities: [amenity('Wi-Fi', true), amenity('Recepción', false)],
    });
    expect(homeHotelAmenities(site).map((a) => a.name)).toEqual(['Wi-Fi']);
  });
});

describe('introText (home "Sobre nosotros")', () => {
  it('uses the hotel description, the single description source', () => {
    expect(introText('Hotel en Mocoa.')).toBe('Hotel en Mocoa.');
  });

  it('is null when there is no real about text, so the intro is hidden', () => {
    expect(introText(null)).toBeNull();
    expect(introText(' \n ')).toBeNull();
  });
});

describe('isSectionEnabled', () => {
  it('follows the enabled sections the API returns', () => {
    const site = siteWith({ sections: [{ key: 'ABOUT', sortOrder: 0 }] });
    expect(isSectionEnabled(site, 'ABOUT')).toBe(true);
    expect(isSectionEnabled(site, 'FAQ')).toBe(false);
  });
});
