import type {
  PublicGalleryItem,
  PublicHotel,
  PublicMedia,
  PublicRoomSummary,
  PublicSection,
  PublicSite,
  SectionKey,
} from './types';

/** Enabled landing section by key (disabled sections are not returned by the API). */
export function sectionOf(site: PublicSite, key: SectionKey): PublicSection | null {
  return site.sections.find((section) => section.key === key) ?? null;
}

/** "Calle 8 # 7-10, Mocoa, Putumayo" from whatever parts the hotel configured. */
export function fullAddress(hotel: Pick<PublicHotel, 'address' | 'municipality' | 'department'>) {
  return [hotel.address, hotel.municipality, hotel.department].filter(Boolean).join(', ') || null;
}

function coordinates(hotel: Pick<PublicHotel, 'latitude' | 'longitude'>): string | null {
  const lat = hotel.latitude === null ? Number.NaN : Number(hotel.latitude);
  const lng = hotel.longitude === null ? Number.NaN : Number(hotel.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) ? `${lat},${lng}` : null;
}

export interface MapLinks {
  /** Google Maps embed (loaded only on demand, requirement 17.5). */
  embedUrl: string;
  /** "Cómo llegar" / "Abrir en Google Maps". */
  directionsUrl: string;
}

/** Null when the hotel has neither coordinates nor an address: the map block is hidden. */
export function mapLinks(
  hotel: Pick<
    PublicHotel,
    'latitude' | 'longitude' | 'address' | 'municipality' | 'department' | 'mapUrl' | 'name'
  >,
): MapLinks | null {
  const coords = coordinates(hotel);
  const address = fullAddress(hotel);
  const query = coords ?? (address ? `${hotel.name}, ${address}` : null);
  if (!query && !hotel.mapUrl) return null;
  const q = encodeURIComponent(query ?? hotel.name);
  return {
    embedUrl: `https://www.google.com/maps?q=${q}&z=16&output=embed`,
    directionsUrl: hotel.mapUrl ?? `https://www.google.com/maps/dir/?api=1&destination=${q}`,
  };
}

/**
 * Hero photos: the configured hero first, then featured gallery photos, then room covers.
 * Only real hotel photos with alt text (the API exposes nothing else). Max 3 (motion spec).
 */
export function heroImages(
  site: PublicSite,
  gallery: PublicGalleryItem[],
  rooms: PublicRoomSummary[],
): PublicMedia[] {
  const heroSection = sectionOf(site, 'HERO');
  const candidates = [
    site.hotel.hero,
    heroSection?.media ?? null,
    ...gallery.filter((item) => item.featured).map((item) => item.media),
    ...gallery.map((item) => item.media),
    ...rooms.map((room) => room.cover),
  ];
  const seen = new Set<string>();
  const images: PublicMedia[] = [];
  for (const media of candidates) {
    if (!media || seen.has(media.id)) continue;
    seen.add(media.id);
    images.push(media);
    if (images.length === 3) break;
  }
  return images;
}

/** Display form of a stored WhatsApp/phone number ("573001234567" → "+57 300 123 4567"). */
export function displayPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.startsWith('57') && digits.length === 12) {
    return `+57 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }
  return value.startsWith('+') || !/^\d+$/.test(value) ? value : `+${value}`;
}

export function telHref(value: string): string {
  return `tel:${value.replace(/[^\d+]/g, '')}`;
}
