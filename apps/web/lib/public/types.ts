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

export interface PublicService {
  id: string;
  name: string;
  description: string | null;
  iconKey: string | null;
  highlighted?: boolean;
  media: PublicMedia | null;
}

export interface PublicAmenity {
  id: string;
  name: string;
  description: string | null;
  iconKey: string;
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
  highlightedServices: PublicService[];
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
  updatedAt: string;
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
