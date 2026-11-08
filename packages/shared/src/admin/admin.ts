import { z } from 'zod';
import { iconKeySchema } from '../icons/icons.js';
import { slugSchema } from '../slug/slug.js';
import { whatsAppPhoneSchema } from '../whatsapp/whatsapp.js';

/**
 * Admin input schemas (requirements 9, 12.8, 16.4). Used by the API validation pipe and by the
 * admin forms. Objects are strict: unexpected properties are rejected. Optional text fields
 * accept `''` or `null` to clear the value (both stored as null).
 */

// ─── Building blocks ────────────────────────────────────────────────────────

export const idSchema = z.uuid();

/** Required, trimmed, single-line-ish text. */
export const requiredText = (max: number) => z.string().trim().min(1).max(max);

/** Optional text: `''`/`null` become `null`. */
export const nullableText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .transform((value) => (value === '' ? null : value));

export const httpsUrlSchema = z.url({ protocol: /^https$/, hostname: z.regexes.domain }).max(500);

const nullableHttpsUrl = z
  .union([z.literal(''), httpsUrlSchema])
  .nullable()
  .transform((value) => (value === '' ? null : value));

const nullableId = z
  .union([z.literal(''), idSchema])
  .nullable()
  .transform((value) => (value === '' ? null : value));

const sortOrderSchema = z.int().min(0).max(100_000);

export const PUBLICATION_STATUSES = ['DRAFT', 'PUBLISHED', 'INACTIVE'] as const;
export const publicationStatusSchema = z.enum(PUBLICATION_STATUSES);
export type PublicationStatus = z.infer<typeof publicationStatusSchema>;

/** Ordered list of ids (drag-and-drop ordering). Position in the array = new sortOrder. */
export const reorderSchema = z.strictObject({
  ids: z
    .array(idSchema)
    .min(1)
    .max(500)
    .refine((ids) => new Set(ids).size === ids.length, 'Ids must be unique'),
});
export type ReorderInput = z.infer<typeof reorderSchema>;

// ─── Hotel profile (9.3) ────────────────────────────────────────────────────

const timeOfDaySchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM (24h)');

export const openingHoursSchema = z
  .array(z.strictObject({ days: requiredText(60), hours: requiredText(60) }))
  .max(14);

export const hotelProfileUpdateSchema = z
  .strictObject({
    name: requiredText(120),
    legalName: nullableText(200),
    rntNumber: nullableText(30),
    escnnaNotice: nullableText(2000),
    tagline: nullableText(160),
    /** Meta description of the hotel (home page). */
    shortDescription: nullableText(300),
    /** "Sobre nosotros": the single description source (ADR 0016). */
    description: nullableText(5000),
    address: nullableText(200),
    municipality: nullableText(100),
    department: nullableText(100),
    country: nullableText(100),
    latitude: z.number().min(-90).max(90).nullable(),
    longitude: z.number().min(-180).max(180).nullable(),
    mapUrl: nullableHttpsUrl,
    directions: nullableText(3000),
    nearbyAttractions: nullableText(3000),
    phone: nullableText(30),
    whatsappNumber: z
      .union([z.literal(''), z.string().transform((v) => v.replace(/[\s+\-.()]/g, ''))])
      .nullable()
      .transform((value) => (value === '' ? null : value))
      .pipe(whatsAppPhoneSchema.nullable()),
    /** Opening of every WhatsApp message (messages are code defaults, see whatsapp/messages). */
    whatsappGreeting: nullableText(80),
    email: z
      .union([z.literal(''), z.email().max(254)])
      .nullable()
      .transform((value) => (value === '' ? null : value)),
    openingHours: openingHoursSchema.nullable(),
    checkInTime: timeOfDaySchema.nullable(),
    checkOutTime: timeOfDaySchema.nullable(),
    logoMediaId: nullableId,
  })
  .partial();
export type HotelProfileUpdateInput = z.infer<typeof hotelProfileUpdateSchema>;

// ─── Social links (9.10) ────────────────────────────────────────────────────

export const SOCIAL_PLATFORMS = [
  'FACEBOOK',
  'INSTAGRAM',
  'TIKTOK',
  'YOUTUBE',
  'X',
  'TRIPADVISOR',
  'GOOGLE_BUSINESS',
  'OTHER',
] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

/** Expected hosts per platform (16.4). `OTHER` accepts any https URL. */
export const SOCIAL_PLATFORM_HOSTS: Record<Exclude<SocialPlatform, 'OTHER'>, readonly string[]> = {
  FACEBOOK: ['facebook.com', 'fb.com', 'fb.me'],
  INSTAGRAM: ['instagram.com'],
  TIKTOK: ['tiktok.com'],
  YOUTUBE: ['youtube.com', 'youtu.be'],
  X: ['x.com', 'twitter.com'],
  TRIPADVISOR: ['tripadvisor.com', 'tripadvisor.co', 'tripadvisor.com.co'],
  GOOGLE_BUSINESS: ['google.com', 'g.page', 'maps.app.goo.gl', 'goo.gl', 'business.site'],
};

export function isAllowedSocialUrl(platform: SocialPlatform, url: string): boolean {
  if (platform === 'OTHER') return true;
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return false;
  }
  return SOCIAL_PLATFORM_HOSTS[platform].some(
    (allowed) => host === allowed || host.endsWith(`.${allowed}`),
  );
}

const socialLinkFields = {
  platform: z.enum(SOCIAL_PLATFORMS),
  url: httpsUrlSchema,
  active: z.boolean(),
  sortOrder: sortOrderSchema,
};

export const socialLinkCreateSchema = z
  .strictObject({
    ...socialLinkFields,
    active: socialLinkFields.active.default(true),
    sortOrder: socialLinkFields.sortOrder.optional(),
  })
  .refine((v) => isAllowedSocialUrl(v.platform, v.url), {
    message: 'URL host does not match the platform',
    path: ['url'],
  });
export const socialLinkUpdateSchema = z.strictObject(socialLinkFields).partial();
export type SocialLinkCreateInput = z.infer<typeof socialLinkCreateSchema>;
export type SocialLinkUpdateInput = z.infer<typeof socialLinkUpdateSchema>;

// ─── Amenities ("Comodidades", ADR 0015) ────────────────────────────────────

/** HOTEL: applies to the whole hotel (Wi-Fi, solar panels). ROOM: assigned per room. */
export const AMENITY_SCOPES = ['HOTEL', 'ROOM'] as const;
export const amenityScopeSchema = z.enum(AMENITY_SCOPES);
export type AmenityScope = z.infer<typeof amenityScopeSchema>;

const amenityFields = {
  name: requiredText(80),
  description: nullableText(300),
  iconKey: iconKeySchema,
  scope: amenityScopeSchema,
  active: z.boolean(),
  showOnHome: z.boolean(),
  sortOrder: sortOrderSchema,
};
export const amenityCreateSchema = z.strictObject({
  ...amenityFields,
  description: amenityFields.description.optional(),
  scope: amenityFields.scope.default('ROOM'),
  active: amenityFields.active.default(true),
  showOnHome: amenityFields.showOnHome.default(false),
  sortOrder: amenityFields.sortOrder.optional(),
});
export const amenityUpdateSchema = z.strictObject(amenityFields).partial();
export type AmenityCreateInput = z.infer<typeof amenityCreateSchema>;
export type AmenityUpdateInput = z.infer<typeof amenityUpdateSchema>;

// ─── Room types and rooms (9.4, ADR 0016) ───────────────────────────────────

export const ROOM_TYPES = ['INDIVIDUAL', 'COUPLE', 'TWIN', 'FAMILY'] as const;
export type RoomKind = (typeof ROOM_TYPES)[number];
export const PRICE_UNITS = ['PER_NIGHT', 'PER_PERSON_PER_NIGHT', 'OTHER'] as const;
export const BED_TYPES = ['SINGLE', 'DOUBLE', 'QUEEN', 'KING', 'BUNK', 'SOFA_BED'] as const;

export const bedsSchema = z
  .array(z.strictObject({ type: z.enum(BED_TYPES), count: z.int().min(1).max(10) }))
  .max(10);

/** What the site shows: description, rate, beds, photos and ROOM amenities. */
const roomTypeFields = {
  name: requiredText(120),
  slug: slugSchema,
  type: z.enum(ROOM_TYPES),
  description: nullableText(5000),
  capacity: z.int().min(1).max(50),
  beds: bedsSchema.nullable(),
  areaM2: z.number().positive().max(9999).nullable(),
  /** Whole Colombian pesos (ADR 0006). */
  basePrice: z.int().min(0).max(100_000_000).nullable(),
  priceUnit: z.enum(PRICE_UNITS),
  taxesIncluded: z.boolean(),
  priceNotes: nullableText(500),
  amenityIds: z.array(idSchema).max(100),
};
/** Ordered images of a room type (first = gallery order start). At most one cover, no repeats. */
export const roomTypeImageListSchema = z
  .array(z.strictObject({ mediaAssetId: idSchema, isCover: z.boolean().default(false) }))
  .max(60)
  .refine((items) => items.filter((i) => i.isCover).length <= 1, 'Only one cover image')
  .refine(
    (items) => new Set(items.map((i) => i.mediaAssetId)).size === items.length,
    'Images must be unique',
  );

export const roomTypeCreateSchema = z.strictObject({
  ...roomTypeFields,
  slug: roomTypeFields.slug.optional(),
  description: roomTypeFields.description.optional(),
  beds: roomTypeFields.beds.optional(),
  areaM2: roomTypeFields.areaM2.optional(),
  basePrice: roomTypeFields.basePrice.optional(),
  priceUnit: roomTypeFields.priceUnit.default('PER_NIGHT'),
  taxesIncluded: roomTypeFields.taxesIncluded.default(true),
  priceNotes: roomTypeFields.priceNotes.optional(),
  amenityIds: roomTypeFields.amenityIds.default([]),
  /** Images chosen while creating; stored with the type in the same write (drafts accept any image). */
  images: roomTypeImageListSchema.default([]),
});
export const roomTypeUpdateSchema = z.strictObject(roomTypeFields).partial();
export type RoomTypeCreateInput = z.infer<typeof roomTypeCreateSchema>;
export type RoomTypeUpdateInput = z.infer<typeof roomTypeUpdateSchema>;

export const roomTypeStatusSchema = z.strictObject({ status: publicationStatusSchema });

/** Full ordered image set of a room type; replaces the previous one. */
export const roomTypeImagesSchema = z.strictObject({ images: roomTypeImageListSchema });
export type RoomTypeImagesInput = z.infer<typeof roomTypeImagesSchema>;

/**
 * A physical room: number or name, its type and its status. PUBLISHED rooms of a PUBLISHED type
 * are counted on the site; INACTIVE also covers "out of service".
 */
const roomFields = {
  name: requiredText(60),
  roomTypeId: idSchema,
  status: publicationStatusSchema,
  sortOrder: sortOrderSchema,
  /**
   * Differences from the type's amenities (ROOM scope only): add one the type lacks or mark a type
   * amenity as missing in this room. The full list replaces the previous one when sent.
   */
  amenityOverrides: z
    .array(z.strictObject({ amenityId: idSchema, available: z.boolean() }))
    .max(60)
    .refine(
      (items) => new Set(items.map((i) => i.amenityId)).size === items.length,
      'Amenities must be unique',
    ),
};
export const roomCreateSchema = z.strictObject({
  name: roomFields.name,
  roomTypeId: roomFields.roomTypeId,
  status: roomFields.status.default('DRAFT'),
  sortOrder: roomFields.sortOrder.optional(),
  amenityOverrides: roomFields.amenityOverrides.optional(),
});
export const roomUpdateSchema = z.strictObject(roomFields).partial();
export type RoomCreateInput = z.infer<typeof roomCreateSchema>;
export type RoomUpdateInput = z.infer<typeof roomUpdateSchema>;

// ─── Nearby places (ADR 0016) ───────────────────────────────────────────────

/** Distances and travel times are free texts the hotel measured ("1,2 km", "5 min en carro"). */
const nearbyPlaceFields = {
  name: requiredText(120),
  category: nullableText(60),
  distanceText: nullableText(80),
  travelTimeText: nullableText(80),
  active: z.boolean(),
  sortOrder: sortOrderSchema,
};
export const nearbyPlaceCreateSchema = z.strictObject({
  name: nearbyPlaceFields.name,
  category: nearbyPlaceFields.category.optional(),
  distanceText: nearbyPlaceFields.distanceText.optional(),
  travelTimeText: nearbyPlaceFields.travelTimeText.optional(),
  active: nearbyPlaceFields.active.default(true),
  sortOrder: nearbyPlaceFields.sortOrder.optional(),
});
export const nearbyPlaceUpdateSchema = z.strictObject(nearbyPlaceFields).partial();
export type NearbyPlaceCreateInput = z.infer<typeof nearbyPlaceCreateSchema>;
export type NearbyPlaceUpdateInput = z.infer<typeof nearbyPlaceUpdateSchema>;

// ─── Media & gallery (9.7) ──────────────────────────────────────────────────

export const GALLERY_CATEGORIES = [
  'ROOMS',
  'COMMON_AREAS',
  'EXTERIOR',
  'FOOD',
  'SURROUNDINGS',
  'DETAILS',
] as const;
export const galleryCategorySchema = z.enum(GALLERY_CATEGORIES);

export const altTextSchema = requiredText(250);

/** Text fields sent with the multipart upload (the file part is named `file`). */
export const mediaUploadFieldsSchema = z.strictObject({
  altText: altTextSchema,
  caption: nullableText(300).optional(),
  /** When set, the upload is also added to the gallery (unpublished) in that category. */
  galleryCategory: galleryCategorySchema.optional(),
});
export type MediaUploadFields = z.infer<typeof mediaUploadFieldsSchema>;

export const mediaUpdateSchema = z
  .strictObject({ altText: altTextSchema, caption: nullableText(300) })
  .partial();
export type MediaUpdateInput = z.infer<typeof mediaUpdateSchema>;

const galleryFields = {
  mediaAssetId: idSchema,
  category: galleryCategorySchema,
  published: z.boolean(),
  featured: z.boolean(),
  sortOrder: sortOrderSchema,
};
export const galleryItemCreateSchema = z.strictObject({
  ...galleryFields,
  published: galleryFields.published.default(false),
  featured: galleryFields.featured.default(false),
  sortOrder: galleryFields.sortOrder.optional(),
});
export const galleryItemUpdateSchema = z
  .strictObject({
    category: galleryFields.category,
    published: galleryFields.published,
    featured: galleryFields.featured,
    sortOrder: galleryFields.sortOrder,
  })
  .partial();
export type GalleryItemCreateInput = z.infer<typeof galleryItemCreateSchema>;
export type GalleryItemUpdateInput = z.infer<typeof galleryItemUpdateSchema>;

// ─── Home hero slides ───────────────────────────────────────────────────────

const heroSlideFields = {
  mediaAssetId: idSchema,
  /** Overrides the media alt text for this slide. */
  altText: nullableText(250),
  caption: nullableText(160),
  active: z.boolean(),
  sortOrder: sortOrderSchema,
};
export const heroSlideCreateSchema = z.strictObject({
  ...heroSlideFields,
  altText: heroSlideFields.altText.optional(),
  caption: heroSlideFields.caption.optional(),
  active: heroSlideFields.active.default(true),
  sortOrder: heroSlideFields.sortOrder.optional(),
});
export const heroSlideUpdateSchema = z.strictObject(heroSlideFields).partial();
export type HeroSlideCreateInput = z.infer<typeof heroSlideCreateSchema>;
export type HeroSlideUpdateInput = z.infer<typeof heroSlideUpdateSchema>;

// ─── Landing sections (9.8) ─────────────────────────────────────────────────

export const LANDING_SECTION_KEYS = [
  'HERO',
  'ABOUT',
  'ROOMS',
  'SERVICES',
  'GALLERY',
  'LOCATION',
  'FAQ',
  'CONTACT',
] as const;
export const landingSectionKeySchema = z.enum(LANDING_SECTION_KEYS);

/**
 * A section is a switch and a position (ADR 0016): copy lives in the hotel profile and headings in
 * the web code.
 */
export const landingSectionUpdateSchema = z
  .strictObject({ enabled: z.boolean(), sortOrder: sortOrderSchema })
  .partial();
export type LandingSectionUpdateInput = z.infer<typeof landingSectionUpdateSchema>;

// ─── FAQ & policies (9.9) ───────────────────────────────────────────────────

const faqFields = {
  question: requiredText(300),
  answer: requiredText(4000),
  published: z.boolean(),
  showOnHome: z.boolean(),
  sortOrder: sortOrderSchema,
};
export const faqCreateSchema = z.strictObject({
  ...faqFields,
  published: faqFields.published.default(false),
  showOnHome: faqFields.showOnHome.default(false),
  sortOrder: faqFields.sortOrder.optional(),
});
export const faqUpdateSchema = z.strictObject(faqFields).partial();
export type FaqCreateInput = z.infer<typeof faqCreateSchema>;
export type FaqUpdateInput = z.infer<typeof faqUpdateSchema>;

const policyFields = {
  title: requiredText(160),
  content: requiredText(8000),
  published: z.boolean(),
  sortOrder: sortOrderSchema,
};
export const policyCreateSchema = z.strictObject({
  ...policyFields,
  published: policyFields.published.default(false),
  sortOrder: policyFields.sortOrder.optional(),
});
export const policyUpdateSchema = z.strictObject(policyFields).partial();
export type PolicyCreateInput = z.infer<typeof policyCreateSchema>;
export type PolicyUpdateInput = z.infer<typeof policyUpdateSchema>;
