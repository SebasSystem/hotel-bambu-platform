import type {
  PublicMedia,
  PublicNearbyPlace,
  PublicRoomTypeDetail,
  PublicRoomTypeRedirect,
  PublicRoomTypeSummary,
} from '@hotel-bambu/shared';

/** Public API response shapes (`docs/api.md`, "Public"). */

export type {
  PublicMedia,
  PublicNearbyPlace,
  PublicRoomTypeDetail,
  PublicRoomTypeRedirect,
  PublicRoomTypeSummary,
};

export interface PublicHotel {
  name: string;
  legalName: string | null;
  rntNumber: string | null;
  escnnaNotice: string | null;
  tagline: string | null;
  /** Meta description of the hotel (home page). */
  shortDescription: string | null;
  /** "Sobre nosotros": the single description source (paragraphs separated by a blank line). */
  description: string | null;
  address: string | null;
  municipality: string | null;
  department: string | null;
  country: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  mapUrl: string | null;
  directions: string | null;
  nearbyAttractions: string | null;
  phone: string | null;
  whatsappNumber: string | null;
  /** Optional opening of the WhatsApp messages (the messages are shared code defaults). */
  whatsappGreeting: string | null;
  email: string | null;
  openingHours: { days: string; hours: string }[] | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  updatedAt: string;
  logo: PublicMedia | null;
}

export interface PublicSocialLink {
  id: string;
  platform: string;
  url: string;
}

export interface PublicAmenity {
  id: string;
  name: string;
  description: string | null;
  iconKey: string;
}

/** Hotel-wide amenity (scope HOTEL, ADR 0015); `showOnHome` picks the home panel. */
export interface PublicHotelAmenity extends PublicAmenity {
  showOnHome: boolean;
}

/** Home hero slide (admin › Contenido › Carrusel principal); alt override already applied. */
export interface PublicHeroSlide {
  id: string;
  caption: string | null;
  media: PublicMedia;
}

export type SectionKey =
  'HERO' | 'ABOUT' | 'ROOMS' | 'SERVICES' | 'GALLERY' | 'LOCATION' | 'FAQ' | 'CONTACT';

/** An enabled home section: headings live in the web code and copy in the hotel profile. */
export interface PublicSection {
  key: SectionKey;
  sortOrder: number;
}

export interface PublicSite {
  hotel: PublicHotel;
  socialLinks: PublicSocialLink[];
  heroSlides: PublicHeroSlide[];
  /** Every active hotel-wide amenity (home panel, room detail "En todo el hotel", JSON-LD). */
  hotelAmenities: PublicHotelAmenity[];
  /** Room equipment flagged for the home grid. */
  homeAmenities: PublicAmenity[];
  sections: PublicSection[];
}

export interface PublicGalleryItem {
  id: string;
  category: string;
  featured: boolean;
  media: PublicMedia;
}

export interface PublicFaq {
  id: string;
  question: string;
  answer: string;
  showOnHome: boolean;
}

export interface PublicPolicy {
  id: string;
  title: string;
  content: string;
}
