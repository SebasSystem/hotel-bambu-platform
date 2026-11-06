import type { PublicMedia, PublicRoomSummary } from '@hotel-bambu/shared';

/** Public API response shapes (`docs/api.md`, "Public"). */

export type { PublicMedia, PublicRoomSummary };

export interface PublicHotel {
  name: string;
  legalName: string | null;
  rntNumber: string | null;
  escnnaNotice: string | null;
  shortDescription: string | null;
  description: string | null;
  address: string | null;
  municipality: string | null;
  department: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  mapUrl: string | null;
  directions: string | null;
  nearbyAttractions: string | null;
  phone: string | null;
  whatsappNumber: string | null;
  email: string | null;
  openingHours: { days: string; hours: string }[] | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  updatedAt: string;
  logo: PublicMedia | null;
  hero: PublicMedia | null;
}

export interface PublicSocialLink {
  id: string;
  platform: string;
  url: string;
}

export interface PublicWhatsAppTemplate {
  key: 'GENERAL' | 'ROOM' | 'PROMOTION';
  body: string;
  allowedVariables: string[];
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

export interface PublicSection {
  key: SectionKey;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  ctaLabel: string | null;
  sortOrder: number;
  media: PublicMedia | null;
}

export interface PublicSite {
  hotel: PublicHotel;
  socialLinks: PublicSocialLink[];
  whatsappTemplates: PublicWhatsAppTemplate[];
  heroSlides: PublicHeroSlide[];
  /** Every active hotel-wide amenity (home panel, room detail "En todo el hotel", JSON-LD). */
  hotelAmenities: PublicHotelAmenity[];
  /** Room equipment flagged for the home grid. */
  homeAmenities: PublicAmenity[];
  sections: PublicSection[];
}

export interface PublicPromotion {
  id: string;
  title: string;
  description: string | null;
  conditions: string | null;
  startsAt: string;
  endsAt: string;
  room?: { slug: string; name: string } | null;
}

export interface PublicRoomDetail extends PublicRoomSummary {
  description: string | null;
  beds: { type: string; count: number }[] | null;
  areaM2: number | null;
  priceNotes: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  images: PublicMedia[];
  promotions: PublicPromotion[];
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
