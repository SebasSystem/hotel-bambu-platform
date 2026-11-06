import { BED_TYPE_LABELS } from '@/lib/labels';
import { routes } from '@/lib/public/navigation';
import { shareImage } from '@/lib/seo/metadata';
import { fullAddress } from '@/lib/public/site';
import type {
  PublicFaq,
  PublicHotel,
  PublicRoomDetail,
  PublicRoomSummary,
  PublicSite,
} from '@/lib/public/types';
import { absoluteUrl } from './config';

/**
 * schema.org JSON-LD builders (requirement 19.2). Only real, configured hotel data: every
 * optional property is omitted when the hotel has not filled it in.
 */

type Json = Record<string, unknown>;

const thousands = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });

function compact(data: Json): Json {
  return Object.fromEntries(
    Object.entries(data).filter(
      ([, value]) =>
        value !== null && value !== undefined && !(Array.isArray(value) && value.length === 0),
    ),
  );
}

function num(value: number | string | null): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function priceRange(rooms: Pick<PublicRoomSummary, 'basePrice' | 'currency'>[]): string | null {
  const prices = rooms.map((room) => room.basePrice).filter((p): p is number => p !== null);
  if (prices.length === 0) return null;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const currency = rooms[0]?.currency ?? 'COP';
  return min === max
    ? `${currency} ${thousands.format(min)}`
    : `${currency} ${thousands.format(min)} – ${thousands.format(max)}`;
}

function postalAddress(hotel: PublicHotel): Json | null {
  if (!fullAddress(hotel)) return null;
  return compact({
    '@type': 'PostalAddress',
    streetAddress: hotel.address,
    addressLocality: hotel.municipality,
    addressRegion: hotel.department,
    addressCountry: 'CO',
  });
}

export function hotelJsonLd(site: PublicSite, rooms: PublicRoomSummary[]): Json {
  const { hotel } = site;
  const lat = num(hotel.latitude);
  const lng = num(hotel.longitude);
  const images = [hotel.hero, ...rooms.map((room) => room.cover)]
    .map((media) => shareImage(media)?.url)
    .filter((url): url is string => Boolean(url))
    .slice(0, 6);
  return compact({
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    '@id': absoluteUrl('/#hotel'),
    name: hotel.name,
    legalName: hotel.legalName,
    description: hotel.shortDescription ?? hotel.description,
    url: absoluteUrl('/'),
    image: images,
    address: postalAddress(hotel),
    geo:
      lat !== null && lng !== null
        ? { '@type': 'GeoCoordinates', latitude: lat, longitude: lng }
        : null,
    hasMap: hotel.mapUrl,
    telephone:
      hotel.phone ?? (hotel.whatsappNumber ? `+${hotel.whatsappNumber.replace(/\D/g, '')}` : null),
    email: hotel.email,
    checkinTime: hotel.checkInTime,
    checkoutTime: hotel.checkOutTime,
    // Hotel-wide amenities, then the room equipment shown on the home (ADR 0015).
    amenityFeature: [...site.hotelAmenities, ...site.homeAmenities].map((amenity) => ({
      '@type': 'LocationFeatureSpecification',
      name: amenity.name,
      value: true,
    })),
    numberOfRooms: rooms.length > 0 ? rooms.length : null,
    priceRange: priceRange(rooms),
    sameAs: site.socialLinks.map((social) => social.url),
  });
}

/** `HotelRoom`, wrapped in an `Offer` only when the room has a published rate. */
export function roomJsonLd(room: PublicRoomDetail, hotel: PublicHotel): Json {
  const url = absoluteUrl(routes.room(room.slug));
  const beds = (room.beds ?? []).filter((bed) => bed.count > 0);
  const hotelRoom = compact({
    '@context': 'https://schema.org',
    '@type': 'HotelRoom',
    name: room.name,
    description: room.shortDescription ?? room.description,
    url,
    image: [...room.images, room.cover]
      .map((media) => shareImage(media)?.url)
      .filter((u, i, all): u is string => Boolean(u) && all.indexOf(u) === i),
    occupancy: { '@type': 'QuantitativeValue', maxValue: room.capacity, unitCode: 'C62' },
    bed: beds.map((bed) => ({
      '@type': 'BedDetails',
      numberOfBeds: bed.count,
      typeOfBed: BED_TYPE_LABELS[bed.type as keyof typeof BED_TYPE_LABELS] ?? bed.type,
    })),
    floorSize: room.areaM2
      ? { '@type': 'QuantitativeValue', value: room.areaM2, unitCode: 'MTK' }
      : null,
    amenityFeature: room.amenities.map((amenity) => ({
      '@type': 'LocationFeatureSpecification',
      name: amenity.name,
      value: true,
    })),
    containedInPlace: { '@type': 'Hotel', '@id': absoluteUrl('/#hotel'), name: hotel.name },
  });
  if (room.basePrice === null) return hotelRoom;
  const { '@context': context, ...item } = hotelRoom;
  return {
    '@context': context,
    '@type': 'Offer',
    url,
    price: room.basePrice,
    priceCurrency: room.currency,
    priceSpecification: compact({
      '@type': 'UnitPriceSpecification',
      price: room.basePrice,
      priceCurrency: room.currency,
      unitText: room.priceUnit === 'PER_PERSON_PER_NIGHT' ? 'persona por noche' : 'noche',
      valueAddedTaxIncluded: room.taxesIncluded,
    }),
    itemOffered: item,
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqJsonLd(faqs: PublicFaq[]): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
}

/** JSON for a `<script type="application/ld+json">`: `<` is escaped so text cannot end the tag. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
