import type { AuthSessionResponse, PublicMedia, PublicationStatus } from '@hotel-bambu/shared';

/** Admin response shapes (Prisma rows serialised by the API; see apps/api/src/modules). */

export type SessionInfo = AuthSessionResponse;

export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

/** `PUBLIC_MEDIA_SELECT` + status (embedded media in rooms, gallery, sections, hotel). */
export interface EmbeddedMedia {
  id: string;
  altText: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
  blurDataUrl: string | null;
  dominantColor: string | null;
  variants: unknown;
  status: MediaStatus;
}

export type MediaStatus = 'UPLOADING' | 'PROCESSING' | 'READY' | 'FAILED';

export interface MediaVariant {
  key: string;
  width: number;
  height: number;
  format: 'avif' | 'webp';
  url: string;
}

export interface MediaAsset extends Timestamps {
  id: string;
  kind: 'IMAGE' | 'VIDEO';
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  variants: MediaVariant[];
  blurDataUrl: string | null;
  dominantColor: string | null;
  altText: string | null;
  caption: string | null;
  status: MediaStatus;
  galleryItems?: { id: string; category: string; published: boolean }[];
  _count?: { roomImages: number; services: number; sections: number };
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DashboardSummary {
  rooms: Partial<Record<PublicationStatus, number>>;
  activeServices: number;
  activePromotions: number;
  lastChange: { createdAt: string; action: string; entity: string } | null;
  incomplete: {
    mediaMissingAlt: number;
    publishedRoomsWithoutPrice: number;
    roomsWithoutCover: number;
  };
  analytics: {
    since: string;
    days: number;
    totals: { type: string; source: string; count: number }[];
  };
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  createdAt: string;
  adminUser: { email: string; name: string | null } | null;
}

export interface HotelProfile extends Timestamps {
  id: number;
  name: string;
  legalName: string | null;
  rntNumber: string | null;
  escnnaNotice: string | null;
  shortDescription: string | null;
  description: string | null;
  address: string | null;
  municipality: string | null;
  department: string | null;
  latitude: number | null;
  longitude: number | null;
  mapUrl: string | null;
  directions: string | null;
  nearbyAttractions: string | null;
  phone: string | null;
  whatsappNumber: string | null;
  email: string | null;
  openingHours: { days: string; hours: string }[] | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  logoMediaId: string | null;
  heroMediaId: string | null;
  logoMedia: EmbeddedMedia | null;
  heroMedia: EmbeddedMedia | null;
}

export interface WhatsAppTemplate extends Timestamps {
  id: string;
  key: 'GENERAL' | 'ROOM' | 'PROMOTION';
  label: string;
  body: string;
  allowedVariables: string[];
}

export interface RoomImage {
  mediaAssetId: string;
  isCover: boolean;
  sortOrder: number;
  media: EmbeddedMedia & { preview: PublicMedia | null };
}

export interface Room extends Timestamps {
  id: string;
  slug: string;
  name: string;
  type: 'INDIVIDUAL' | 'COUPLE' | 'TWIN' | 'FAMILY';
  status: PublicationStatus;
  shortDescription: string | null;
  description: string | null;
  capacity: number;
  beds: { type: string; count: number }[] | null;
  areaM2: number | null;
  basePrice: number | null;
  currency: string;
  priceUnit: 'PER_NIGHT' | 'PER_PERSON_PER_NIGHT' | 'OTHER';
  taxesIncluded: boolean;
  priceNotes: string | null;
  sortOrder: number;
  seoTitle: string | null;
  seoDescription: string | null;
  amenityIds: string[];
  images: RoomImage[];
  slugRedirects: { oldSlug: string; createdAt: string }[];
  publicationIssues: string[];
}

export interface Amenity extends Timestamps {
  id: string;
  name: string;
  description: string | null;
  iconKey: string;
  active: boolean;
  showOnHome: boolean;
  sortOrder: number;
}

export interface Service extends Timestamps {
  id: string;
  name: string;
  description: string | null;
  iconKey: string | null;
  mediaAssetId: string | null;
  active: boolean;
  highlighted: boolean;
  sortOrder: number;
}

export interface Promotion extends Timestamps {
  id: string;
  title: string;
  description: string | null;
  conditions: string | null;
  startsAt: string;
  endsAt: string;
  roomId: string | null;
  room: { id: string; name: string; slug: string; status: PublicationStatus } | null;
  status: PublicationStatus;
  sortOrder: number;
}

export interface GalleryItem extends Timestamps {
  id: string;
  mediaAssetId: string;
  category: string;
  sortOrder: number;
  published: boolean;
  featured: boolean;
  mediaAsset: EmbeddedMedia;
}

export interface LandingSection extends Timestamps {
  id: string;
  key: string;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  ctaLabel: string | null;
  mediaAssetId: string | null;
  enabled: boolean;
  sortOrder: number;
  mediaAsset: EmbeddedMedia | null;
}

export interface Faq extends Timestamps {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  published: boolean;
  showOnHome: boolean;
}

export interface Policy extends Timestamps {
  id: string;
  title: string;
  content: string;
  sortOrder: number;
  published: boolean;
}

export interface SocialLink extends Timestamps {
  id: string;
  platform: string;
  url: string;
  sortOrder: number;
  active: boolean;
}
