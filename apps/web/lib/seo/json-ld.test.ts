import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { PublicHotel, PublicRoomTypeDetail, PublicSite } from '@/lib/public/types';
import { napOf } from '@/lib/public/nap';
import {
  breadcrumbJsonLd,
  hotelJsonLd,
  roomJsonLd,
  serializeJsonLd,
  websiteJsonLd,
} from './json-ld';

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
  tagline: null,
  shortDescription: 'Hotel en el centro',
  description: null,
  address: null,
  municipality: null,
  department: null,
  country: null,
  latitude: null,
  longitude: null,
  mapUrl: null,
  directions: null,
  nearbyAttractions: null,
  phone: null,
  whatsappNumber: null,
  whatsappGreeting: null,
  email: null,
  openingHours: null,
  checkInTime: null,
  checkOutTime: null,
  updatedAt: '2026-11-01T00:00:00.000Z',
  logo: null,
};

const site: PublicSite = {
  hotel,
  socialLinks: [],
  heroSlides: [],
  hotelAmenities: [],
  homeAmenities: [],
  sections: [],
};

const room: PublicRoomTypeDetail = {
  slug: 'habitacion-pareja',
  name: 'Habitación de pareja',
  type: 'COUPLE',
  description: 'Cama doble y luz natural.',
  capacity: 2,
  basePrice: null,
  currency: 'COP',
  priceUnit: 'PER_NIGHT',
  taxesIncluded: true,
  cover: media,
  amenities: [{ name: 'Baño privado', iconKey: 'bath' }],
  publishedRoomCount: 8,
  beds: [{ type: 'DOUBLE', count: 1 }],
  areaM2: null,
  priceNotes: null,
  updatedAt: '2026-11-01T00:00:00.000Z',
  images: [media],
};

beforeEach(() => {
  process.env.SITE_URL = 'https://hotel.test';
});
afterEach(() => {
  delete process.env.SITE_URL;
});

const realHotel: PublicHotel = {
  ...hotel,
  address: 'Calle 8 # 7-10',
  municipality: 'Mocoa',
  department: 'Putumayo',
  country: 'Colombia',
  latitude: '1.146883',
  longitude: -76.64794,
  phone: '+57 310 679 8260',
};

type Node = Record<string, unknown>;

describe('hotelJsonLd', () => {
  it('emits only fields the hotel configured (no invented data)', () => {
    const data = hotelJsonLd(site, [], []);
    expect(data).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'Hotel',
      '@id': 'https://hotel.test/#hotel',
      name: hotel.name,
      url: 'https://hotel.test/',
    });
    for (const key of [
      'address',
      'geo',
      'telephone',
      'checkinTime',
      'checkoutTime',
      'priceRange',
      'sameAs',
      'image',
      'containsPlace',
      'aggregateRating',
      'review',
    ]) {
      expect(data).not.toHaveProperty(key);
    }
  });

  it('carries the required and recommended fields of a real hotel', () => {
    const data = hotelJsonLd(
      {
        ...site,
        hotel: { ...realHotel, checkInTime: '15:00', checkOutTime: '12:00' },
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
      [room, { ...room, slug: 'habitacion-individual', publishedRoomCount: 7 }],
      [media],
    );
    // Published rooms of every type, not the number of types (ADR 0016).
    expect(data.numberOfRooms).toBe(15);
    expect(data.address).toEqual({
      '@type': 'PostalAddress',
      streetAddress: 'Calle 8 # 7-10',
      addressLocality: 'Mocoa',
      addressRegion: 'Putumayo',
      addressCountry: 'CO',
    });
    expect(data.geo).toEqual({
      '@type': 'GeoCoordinates',
      latitude: 1.146883,
      longitude: -76.64794,
    });
    expect(data.telephone).toBe('+57 310 679 8260');
    expect(data.image).toEqual(['https://cdn.test/a.webp']);
    expect(data.checkinTime).toBe('15:00');
    expect(data.checkoutTime).toBe('12:00');
    expect(data.sameAs).toEqual(['https://instagram.com/x']);
    expect(data.amenityFeature).toEqual([
      { '@type': 'LocationFeatureSpecification', name: 'Wi-Fi en todo el hotel', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Baño privado', value: true },
    ]);
    // No rates yet: rooms are listed, without price range or offers.
    expect(data).not.toHaveProperty('priceRange');
    const places = data.containsPlace as Node[];
    expect(places).toHaveLength(2);
    expect(places[0]).toMatchObject({
      '@type': ['HotelRoom', 'Product'],
      '@id': 'https://hotel.test/habitaciones/habitacion-pareja#habitacion',
      name: 'Habitación de pareja',
    });
    expect(places[0]).not.toHaveProperty('offers');
  });

  it('adds the price range and one COP Offer per priced room type', () => {
    const data = hotelJsonLd(
      { ...site, hotel: realHotel },
      [
        { ...room, basePrice: 90000 },
        { ...room, slug: 'habitacion-individual', basePrice: 150000 },
        { ...room, slug: 'habitacion-doble', basePrice: null },
      ],
      [],
    );
    expect(data.priceRange).toBe('COP 90.000 – 150.000');
    const places = data.containsPlace as Node[];
    expect(places[0]?.offers).toEqual({
      '@type': 'Offer',
      url: 'https://hotel.test/habitaciones/habitacion-pareja',
      price: 90000,
      priceCurrency: 'COP',
      businessFunction: 'http://purl.org/goodrelations/v1#LeaseOut',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: 90000,
        priceCurrency: 'COP',
        unitCode: 'DAY',
        unitText: 'noche',
        valueAddedTaxIncluded: true,
      },
    });
    expect(places[2]).not.toHaveProperty('offers');
  });

  it('keeps the NAP identical to the one the footer shows', () => {
    const data = hotelJsonLd({ ...site, hotel: realHotel }, [], []);
    const nap = napOf(realHotel);
    const address = data.address as Record<string, string>;
    expect(data.name).toBe(nap.name);
    expect(data.telephone).toBe(nap.telephone);
    expect([address.streetAddress, address.addressLocality, address.addressRegion].join(', ')).toBe(
      nap.addressLine,
    );
  });
});

describe('roomJsonLd', () => {
  it('is a HotelRoom contained in the hotel, without an Offer when there is no price', () => {
    const data = roomJsonLd(room, hotel);
    expect(data).toMatchObject({
      '@context': 'https://schema.org',
      '@type': ['HotelRoom', 'Product'],
      occupancy: { '@type': 'QuantitativeValue', maxValue: 2, unitCode: 'C62' },
      url: 'https://hotel.test/habitaciones/habitacion-pareja',
      description: 'Cama doble y luz natural.',
      bed: [{ '@type': 'BedDetails', numberOfBeds: 1, typeOfBed: 'Doble' }],
      containedInPlace: { '@type': 'Hotel', '@id': 'https://hotel.test/#hotel', name: hotel.name },
    });
    expect(data).not.toHaveProperty('offers');
  });

  it('adds a COP Offer when a price exists', () => {
    const data = roomJsonLd({ ...room, basePrice: 120000 }, hotel);
    expect(data.offers).toMatchObject({ '@type': 'Offer', price: 120000, priceCurrency: 'COP' });
  });
});

describe('website, breadcrumbs and serialisation', () => {
  it('describes the website in Colombian Spanish', () => {
    expect(websiteJsonLd('Hotel Bambú Plaza')).toEqual({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': 'https://hotel.test/#website',
      name: 'Hotel Bambú Plaza',
      url: 'https://hotel.test/',
      inLanguage: 'es-CO',
      publisher: { '@id': 'https://hotel.test/#hotel' },
    });
  });

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

  it('escapes markup so content cannot close the script element', () => {
    const json = serializeJsonLd({ name: '</script><script>alert(1)</script>' });
    expect(json).not.toContain('</script>');
    expect(JSON.parse(json)).toEqual({ name: '</script><script>alert(1)</script>' });
  });
});
