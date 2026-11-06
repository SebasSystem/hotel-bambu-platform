import type {
  AmenityScope,
  AuthSessionResponse,
  PublicMedia,
  PublicationStatus,
} from '@hotel-bambu/shared';

/** Admin response shapes (Prisma rows serialised by the API; see apps/api/src/modules). */

export type SessionInfo = AuthSessionResponse;

export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

/** `PUBLIC_MEDIA_SELECT` + status (embedded media in room types, gallery, hero slides, hotel). */
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
  _count?: { roomTypeImages: number; heroSlides: number; hotelLogos: number };
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DashboardSummary {
  rooms: Partial<Record<PublicationStatus, number>>;
  roomTypes: Partial<Record<PublicationStatus, number>>;
  /** Active hotel-wide amenities (scope HOTEL). */
  activeHotelAmenities: number;
  activeNearbyPlaces: number;
  lastChange: { createdAt: string; action: string; entity: string } | null;
  incomplete: {
    mediaMissingAlt: number;
    publishedRoomTypesWithoutPrice: number;
    roomTypesWithoutCover: number;
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
  tagline: string | null;
  shortDescription: string | null;
  description: string | null;
  address: string | null;
  municipality: string | null;
  department: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  mapUrl: string | null;
  directions: string | null;
  nearbyAttractions: string | null;
  phone: string | null;
  whatsappNumber: string | null;
  whatsappGreeting: string | null;
  email: string | null;
  openingHours: { days: string; hours: string }[] | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  logoMediaId: string | null;
  logoMedia: EmbeddedMedia | null;
}

export type RoomKind = 'INDIVIDUAL' | 'COUPLE' | 'TWIN' | 'FAMILY';

export interface RoomTypeImage {
  mediaAssetId: string;
  isCover: boolean;
  sortOrder: number;
  media: EmbeddedMedia & { preview: PublicMedia | null };
}

/** What the site shows (ADR 0016); physical rooms reference it. */
export interface RoomType extends Timestamps {
  id: string;
  slug: string;
  name: string;
  type: RoomKind;
  status: PublicationStatus;
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
  amenityIds: string[];
  images: RoomTypeImage[];
  slugRedirects: { oldSlug: string; createdAt: string }[];
  publicationIssues: string[];
  roomCount: number;
  publishedRoomCount: number;
}

/** A physical room: number or name, type and status only. */
export interface Room extends Timestamps {
  id: string;
  name: string;
  status: PublicationStatus;
  sortOrder: number;
  roomTypeId: string;
  roomType: { id: string; name: string; type: RoomKind; status: PublicationStatus };
}

export interface NearbyPlace extends Timestamps {
  id: string;
  name: string;
  category: string | null;
  distanceText: string | null;
  travelTimeText: string | null;
  sortOrder: number;
  active: boolean;
}

export interface Amenity extends Timestamps {
  id: string;
  name: string;
  description: string | null;
  iconKey: string;
  scope: AmenityScope;
  active: boolean;
  showOnHome: boolean;
  sortOrder: number;
  /** Room types using it (admin list only). */
  _count?: { roomTypes: number };
}

export interface HeroSlide extends Timestamps {
  id: string;
  mediaAssetId: string;
  altText: string | null;
  caption: string | null;
  active: boolean;
  sortOrder: number;
  mediaAsset: EmbeddedMedia;
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

/** A home section switch and position (ADR 0016). */
export interface LandingSection extends Timestamps {
  id: string;
  key: string;
  enabled: boolean;
  sortOrder: number;
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
