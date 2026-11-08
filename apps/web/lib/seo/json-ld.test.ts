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
  amenities: [
    { name: 'Baño privado', iconKey: 'bath', availability: 'ALL' },
    // Only in some rooms: left out of the structured data (it would not be true for every room).
    { name: 'Aire acondicionado', iconKey: 'snowflake', availability: 'SOME' },
  ],
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
      '@type': 'HotelRoom',
      '@id': 'https://hotel.test/habitaciones/habitacion-pareja#habitacion',
      name: 'Habitación de pareja',
    });
    expect(places[0]).not.toHaveProperty('offers');
    expect(data).not.toHaveProperty('makesOffer');
  });

  it('types rooms as HotelRoom only, never Product (no merchant-listing evaluation)', () => {
    const data = hotelJsonLd({ ...site, hotel: realHotel }, [{ ...room, basePrice: 90000 }], []);
    const json = JSON.stringify(data);
    expect(json).not.toContain('"Product"');
    expect((data.containsPlace as Node[])[0]?.['@type']).toBe('HotelRoom');
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
    expect(places.every((place) => !('offers' in place))).toBe(true);
    // schema.org hotels guide: Hotel --makesOffer--> Offer --itemOffered--> HotelRoom.
    const offers = data.makesOffer as Node[];
    expect(offers).toHaveLength(2);
    expect(offers[0]).toEqual({
      '@type': 'Offer',
      itemOffered: { '@id': 'https://hotel.test/habitaciones/habitacion-pareja#habitacion' },
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
    expect(offers.map((offer) => (offer.itemOffered as Node)['@id'])).not.toContain(
      'https://hotel.test/habitaciones/habitacion-doble#habitacion',
    );
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
  const graph = (data: Node) => data['@graph'] as Node[];

  it('is a HotelRoom contained in the hotel, without an Offer when there is no price', () => {
    const data = roomJsonLd(room, hotel);
    expect(data['@context']).toBe('https://schema.org');
    expect(graph(data)).toHaveLength(1);
    expect(graph(data)[0]).toMatchObject({
      '@type': 'HotelRoom',
      '@id': 'https://hotel.test/habitaciones/habitacion-pareja#habitacion',
      occupancy: { '@type': 'QuantitativeValue', maxValue: 2, unitCode: 'IE' },
      url: 'https://hotel.test/habitaciones/habitacion-pareja',
      description: 'Cama doble y luz natural.',
      bed: [{ '@type': 'BedDetails', numberOfBeds: 1, typeOfBed: 'Doble' }],
      containedInPlace: { '@type': 'Hotel', '@id': 'https://hotel.test/#hotel', name: hotel.name },
      amenityFeature: [
        { '@type': 'LocationFeatureSpecification', name: 'Baño privado', value: true },
      ],
    });
    expect(JSON.stringify(data)).not.toContain('Offer');
  });

  it('adds a COP Offer for the room, offered by the hotel, when a price exists', () => {
    const data = roomJsonLd({ ...room, basePrice: 120000 }, hotel);
    expect(graph(data)[1]).toMatchObject({
      '@type': 'Offer',
      price: 120000,
      priceCurrency: 'COP',
      itemOffered: { '@id': 'https://hotel.test/habitaciones/habitacion-pareja#habitacion' },
      offeredBy: { '@id': 'https://hotel.test/#hotel' },
    });
    expect(JSON.stringify(data)).not.toContain('"Product"');
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
