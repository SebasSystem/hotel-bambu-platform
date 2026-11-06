import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { PublicHotel, PublicRoomDetail, PublicSite } from '@/lib/public/types';
import { breadcrumbJsonLd, faqJsonLd, hotelJsonLd, roomJsonLd, serializeJsonLd } from './json-ld';

const media = {
  id: 'm1',
  altText: 'Habitación',
  caption: null,
  width: 960,
  height: 1280,
  blurDataUrl: null,
  dominantColor: null,
  variants: [{ width: 960, height: 1280, format: 'webp' as const, url: 'https://cdn.test/a.webp' }],
};

const hotel: PublicHotel = {
  name: 'Hotel Bambú Plaza',
  legalName: null,
  rntNumber: null,
  escnnaNotice: null,
  shortDescription: 'Hotel en el centro',
  description: null,
  address: null,
  municipality: null,
  department: null,
  latitude: null,
  longitude: null,
  mapUrl: null,
  directions: null,
  nearbyAttractions: null,
  phone: null,
  whatsappNumber: null,
  email: null,
  openingHours: null,
  checkInTime: null,
  checkOutTime: null,
  updatedAt: '2026-11-01T00:00:00.000Z',
  logo: null,
  hero: null,
};

const site: PublicSite = {
  hotel,
  socialLinks: [],
  whatsappTemplates: [],
  heroSlides: [],
  hotelAmenities: [],
  homeAmenities: [],
  sections: [],
};

const room: PublicRoomDetail = {
  slug: 'pareja-101',
  name: 'Habitación 101',
  type: 'COUPLE',
  shortDescription: 'Cama doble',
  capacity: 2,
  basePrice: null,
  currency: 'COP',
  priceUnit: 'NIGHT',
  taxesIncluded: true,
  cover: media,
  amenities: [{ name: 'Wi-Fi', iconKey: 'wifi' }],
  description: null,
  beds: [{ type: 'DOUBLE', count: 1 }],
  areaM2: null,
  priceNotes: null,
  seoTitle: null,
  seoDescription: null,
  updatedAt: '2026-11-01T00:00:00.000Z',
  images: [media],
  promotions: [],
};

beforeEach(() => {
  process.env.SITE_URL = 'https://hotel.test';
});
afterEach(() => {
  delete process.env.SITE_URL;
});

describe('hotelJsonLd', () => {
  it('emits only fields the hotel configured (no invented data)', () => {
    const data = hotelJsonLd(site, []);
    expect(data).toMatchObject({ '@type': 'Hotel', name: hotel.name, url: 'https://hotel.test/' });
    for (const key of ['address', 'geo', 'telephone', 'checkinTime', 'priceRange', 'sameAs']) {
      expect(data).not.toHaveProperty(key);
    }
  });

  it('adds address, geo, times, amenities, socials and a price range when known', () => {
    const data = hotelJsonLd(
      {
        ...site,
        hotel: {
          ...hotel,
          address: 'Calle 8 # 7-10',
          municipality: 'Mocoa',
          department: 'Putumayo',
          latitude: '1.15',
          longitude: -76.64,
          phone: '+57 310 000 0000',
          checkInTime: '15:00',
          checkOutTime: '12:00',
        },
        hotelAmenities: [
          {
            id: 'h',
            name: 'Wi-Fi en todo el hotel',
            description: null,
            iconKey: 'wifi',
            showOnHome: false,
          },
        ],
        homeAmenities: [{ id: 'a', name: 'Baño privado', description: null, iconKey: 'bath' }],
        socialLinks: [{ id: 's', platform: 'INSTAGRAM', url: 'https://instagram.com/x' }],
      },
      [
        { ...room, basePrice: 90000 },
        { ...room, basePrice: 150000 },
      ],
    );
    expect(data.address).toMatchObject({
      '@type': 'PostalAddress',
      streetAddress: 'Calle 8 # 7-10',
      addressLocality: 'Mocoa',
      addressRegion: 'Putumayo',
      addressCountry: 'CO',
    });
    expect(data.geo).toMatchObject({ latitude: 1.15, longitude: -76.64 });
    expect(data.checkinTime).toBe('15:00');
    expect(data.sameAs).toEqual(['https://instagram.com/x']);
    expect(data.priceRange).toBe('COP 90.000 – 150.000');
    expect(data.amenityFeature).toEqual([
      { '@type': 'LocationFeatureSpecification', name: 'Wi-Fi en todo el hotel', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Baño privado', value: true },
    ]);
  });
});

describe('roomJsonLd', () => {
  it('is a HotelRoom without an Offer when there is no price', () => {
    const data = roomJsonLd(room, hotel);
    expect(data['@type']).toBe('HotelRoom');
    expect(data).toMatchObject({
      occupancy: { '@type': 'QuantitativeValue', maxValue: 2 },
      url: 'https://hotel.test/habitaciones/pareja-101',
    });
  });

  it('wraps the room in an Offer when a price exists', () => {
    const data = roomJsonLd({ ...room, basePrice: 120000 }, hotel);
    expect(data['@type']).toBe('Offer');
    expect(data).toMatchObject({ price: 120000, priceCurrency: 'COP' });
    expect((data.itemOffered as { '@type': string })['@type']).toBe('HotelRoom');
  });
});

describe('breadcrumbs, FAQ and serialisation', () => {
  it('builds positioned absolute breadcrumbs', () => {
    const data = breadcrumbJsonLd([
      { name: 'Inicio', path: '/' },
      { name: 'Habitaciones', path: '/habitaciones' },
    ]);
    expect(data.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://hotel.test/' },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Habitaciones',
        item: 'https://hotel.test/habitaciones',
      },
    ]);
  });

  it('builds a FAQPage', () => {
    const data = faqJsonLd([{ id: '1', question: '¿Wi-Fi?', answer: 'Sí.', showOnHome: false }]);
    expect(data.mainEntity).toEqual([
      { '@type': 'Question', name: '¿Wi-Fi?', acceptedAnswer: { '@type': 'Answer', text: 'Sí.' } },
    ]);
  });

  it('escapes markup so content cannot close the script element', () => {
    const json = serializeJsonLd({ name: '</script><script>alert(1)</script>' });
    expect(json).not.toContain('</script>');
    expect(JSON.parse(json)).toEqual({ name: '</script><script>alert(1)</script>' });
  });
});
