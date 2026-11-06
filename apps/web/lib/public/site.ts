import type {
  PublicGalleryItem,
  PublicHotelAmenity,
  PublicHotel,
  PublicMedia,
  PublicRoomTypeSummary,
  PublicSite,
  SectionKey,
} from './types';

/** Whether a home section is on (disabled sections are not returned by the API). */
export function isSectionEnabled(site: PublicSite, key: SectionKey): boolean {
  return site.sections.some((section) => section.key === key);
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
  /** "Cómo llegar" (Google Maps directions). */
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
 * Home "Sobre nosotros" text: the hotel description, the single description source (ADR 0016).
 * Null without real text: the intro is then hidden (a heading and facts with no story read as
 * filler).
 */
export function introText(description: string | null): string | null {
  return description?.trim() || null;
}

/** Hotel-wide amenities for the home panel (admin › Comodidades, scope "Todo el hotel"). */
export function homeHotelAmenities(site: PublicSite): PublicHotelAmenity[] {
  return site.hotelAmenities.filter((amenity) => amenity.showOnHome);
}

/**
 * Hero photos: the admin hero slides in their order (caption on the media), the single hero source
 * (ADR 0016). Without slides, the D2 fallback: featured gallery photos, then the other gallery
 * photos, then room type covers, max 3. Only real hotel photos with alt text (the API exposes
 * nothing else).
 */
export function heroImages(
  site: PublicSite,
  gallery: PublicGalleryItem[],
  rooms: PublicRoomTypeSummary[],
): PublicMedia[] {
  if (site.heroSlides.length > 0) {
    return site.heroSlides.map((slide) => ({
      ...slide.media,
      caption: slide.caption ?? slide.media.caption,
    }));
  }
  const candidates = [
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

/**
 * Hero subtitle from the hotel tagline. The approved tagline starts with the hotel name
 * ("Hotel Bambú Plaza: descanso…"), which the H1 already shows: drop that prefix, capitalise the
 * rest and close it with a full stop.
 */
export function heroTagline(tagline: string | null, name: string): string | null {
  const text = tagline?.trim();
  if (!text) return null;
  if (!text.toLowerCase().startsWith(name.toLowerCase())) return text;
  const rest = text.slice(name.length).replace(/^\s*[:–-]\s*/, '');
  if (rest === text.slice(name.length)) return text;
  const sentence = `${rest.charAt(0).toUpperCase()}${rest.slice(1)}`;
  return /[.!?]$/.test(sentence) ? sentence : `${sentence}.`;
}
