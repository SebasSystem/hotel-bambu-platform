import { BED_TYPE_LABELS } from '@/lib/labels';
import { napOf } from '@/lib/public/nap';
import { routes } from '@/lib/public/navigation';
import { publishedRoomTotal } from '@/lib/public/rooms';
import type {
  PublicHotel,
  PublicMedia,
  PublicRoomTypeDetail,
  PublicRoomTypeSummary,
  PublicSite,
} from '@/lib/public/types';
import { shareImage } from '@/lib/seo/metadata';
import { absoluteUrl } from './config';

/**
 * schema.org JSON-LD builders (requirement 19.2, research §5). Only real, configured hotel data:
 * every optional property is omitted when the hotel has not filled it in. No `aggregateRating`
 * or `review` (self-serving reviews are ineligible) and no `FAQPage` (retired in May 2026).
 */

type Json = Record<string, unknown>;

/** A room type as listed on the home (summary) or on its own page (detail). */
type RoomInput = PublicRoomTypeSummary &
  Partial<Pick<PublicRoomTypeDetail, 'beds' | 'areaM2' | 'images'>>;

const thousands = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });
const HOTEL_ID = () => absoluteUrl('/#hotel');

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

function imageUrls(media: (PublicMedia | null | undefined)[], limit = 6): string[] {
  const urls = media
    .map((item) => shareImage(item)?.url)
    .filter((url): url is string => Boolean(url));
  return [...new Set(urls)].slice(0, limit);
}

function priceRange(rooms: Pick<PublicRoomTypeSummary, 'basePrice' | 'currency'>[]): string | null {
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
  const nap = napOf(hotel);
  if (!nap.addressLine) return null;
  return compact({
    '@type': 'PostalAddress',
    streetAddress: nap.streetAddress,
    addressLocality: nap.locality,
    addressRegion: nap.region,
    addressCountry: 'CO',
  });
}

function features(names: string[]): Json[] {
  return names.map((name) => ({ '@type': 'LocationFeatureSpecification', name, value: true }));
}

/** `Offer` for a priced room type: nightly lease in COP, as visible on the page. */
function offer(room: RoomInput, url: string): Json | null {
  if (room.basePrice === null) return null;
  return {
    '@type': 'Offer',
    url,
    price: room.basePrice,
    priceCurrency: room.currency,
    businessFunction: 'http://purl.org/goodrelations/v1#LeaseOut',
    priceSpecification: compact({
      '@type': 'UnitPriceSpecification',
      price: room.basePrice,
      priceCurrency: room.currency,
      unitCode: room.priceUnit === 'OTHER' ? null : 'DAY',
      unitText:
        room.priceUnit === 'PER_PERSON_PER_NIGHT'
          ? 'persona por noche'
          : room.priceUnit === 'PER_NIGHT'
            ? 'noche'
            : null,
      valueAddedTaxIncluded: room.taxesIncluded,
    }),
  };
}

/** `["HotelRoom","Product"]` node (schema.org hotels guide), with its Offer when priced. */
function roomNode(room: RoomInput): Json {
  const url = absoluteUrl(routes.room(room.slug));
  const beds = (room.beds ?? []).filter((bed) => bed.count > 0);
  return compact({
    '@type': ['HotelRoom', 'Product'],
    '@id': `${url}#habitacion`,
    name: room.name,
    description: room.description,
    url,
    image: imageUrls([room.cover, ...(room.images ?? [])]),
    occupancy: { '@type': 'QuantitativeValue', maxValue: room.capacity, unitCode: 'C62' },
    bed: beds.map((bed) => ({
      '@type': 'BedDetails',
      numberOfBeds: bed.count,
      typeOfBed: BED_TYPE_LABELS[bed.type as keyof typeof BED_TYPE_LABELS] ?? bed.type,
    })),
    floorSize: room.areaM2
      ? { '@type': 'QuantitativeValue', value: room.areaM2, unitCode: 'MTK' }
      : null,
    amenityFeature: features(room.amenities.map((amenity) => amenity.name)),
    offers: offer(room, url),
  });
}

/**
 * The single `Hotel` node (`@id` `/#hotel`): name, PostalAddress, geo, telephone, url, photos,
 * amenities, schedule, the room types it contains (`containsPlace`, each with its COP Offer when
 * priced) and a `priceRange` only when rates exist. `images` are real hotel photos (hero, gallery,
 * room covers); the room covers are always added.
 */
export function hotelJsonLd(
  site: PublicSite,
  rooms: PublicRoomTypeSummary[],
  images: PublicMedia[],
): Json {
  const { hotel } = site;
  const nap = napOf(hotel);
  const lat = num(hotel.latitude);
  const lng = num(hotel.longitude);
  const roomCount = publishedRoomTotal(rooms);
  return compact({
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    '@id': HOTEL_ID(),
    name: nap.name,
    legalName: hotel.legalName,
    description: hotel.shortDescription ?? hotel.description,
    url: absoluteUrl('/'),
    image: imageUrls([...images, ...rooms.map((room) => room.cover)]),
    logo: shareImage(hotel.logo)?.url ?? null,
    address: postalAddress(hotel),
    geo:
      lat !== null && lng !== null
        ? { '@type': 'GeoCoordinates', latitude: lat, longitude: lng }
        : null,
    hasMap: hotel.mapUrl,
    telephone: nap.telephone,
    email: hotel.email,
    checkinTime: hotel.checkInTime,
    checkoutTime: hotel.checkOutTime,
    // Hotel-wide amenities, then the room equipment shown on the home (ADR 0015).
    amenityFeature: features(
      [...site.hotelAmenities, ...site.homeAmenities].map((amenity) => amenity.name),
    ),
    numberOfRooms: roomCount > 0 ? roomCount : null,
    priceRange: priceRange(rooms),
    containsPlace: rooms.map(roomNode),
    sameAs: site.socialLinks.map((social) => social.url),
  });
}

/** Room type page: the room node, linked to the hotel node of the home page. */
export function roomJsonLd(room: PublicRoomTypeDetail, hotel: PublicHotel): Json {
  return {
    '@context': 'https://schema.org',
    ...roomNode(room),
    containedInPlace: { '@type': 'Hotel', '@id': HOTEL_ID(), name: hotel.name },
  };
}

export function websiteJsonLd(name: string): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': absoluteUrl('/#website'),
    name,
    url: absoluteUrl('/'),
    inLanguage: 'es-CO',
    publisher: { '@id': HOTEL_ID() },
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

/** JSON for a `<script type="application/ld+json">`: `<` is escaped so text cannot end the tag. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
