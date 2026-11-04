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
    shortDescription: nullableText(300),
    description: nullableText(5000),
    address: nullableText(200),
    municipality: nullableText(100),
    department: nullableText(100),
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
    email: z
      .union([z.literal(''), z.email().max(254)])
      .nullable()
      .transform((value) => (value === '' ? null : value)),
    openingHours: openingHoursSchema.nullable(),
    checkInTime: timeOfDaySchema.nullable(),
    checkOutTime: timeOfDaySchema.nullable(),
    logoMediaId: nullableId,
    heroMediaId: nullableId,
  })
  .partial();
export type HotelProfileUpdateInput = z.infer<typeof hotelProfileUpdateSchema>;

// ─── WhatsApp templates (5.2, 9.10) ─────────────────────────────────────────

export const WHATSAPP_TEMPLATE_KEYS = ['GENERAL', 'ROOM', 'PROMOTION'] as const;
export const whatsAppTemplateKeySchema = z.enum(WHATSAPP_TEMPLATE_KEYS);

export const whatsAppTemplateUpdateSchema = z
  .strictObject({ label: requiredText(80), body: requiredText(1000) })
  .partial();
export type WhatsAppTemplateUpdateInput = z.infer<typeof whatsAppTemplateUpdateSchema>;

/** Variables used in a template body (`{{name}}`). */
export function templateVariables(body: string): string[] {
  return [...body.matchAll(/\{\{\s*([a-zA-Z_]+)\s*\}\}/g)].map((match) => match[1] ?? '');
}

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

// ─── Amenities (room comforts) ──────────────────────────────────────────────

const amenityFields = {
  name: requiredText(80),
  description: nullableText(300),
  iconKey: iconKeySchema,
  active: z.boolean(),
  showOnHome: z.boolean(),
  sortOrder: sortOrderSchema,
};
export const amenityCreateSchema = z.strictObject({
  ...amenityFields,
  description: amenityFields.description.optional(),
  active: amenityFields.active.default(true),
  showOnHome: amenityFields.showOnHome.default(false),
  sortOrder: amenityFields.sortOrder.optional(),
});
export const amenityUpdateSchema = z.strictObject(amenityFields).partial();
export type AmenityCreateInput = z.infer<typeof amenityCreateSchema>;
export type AmenityUpdateInput = z.infer<typeof amenityUpdateSchema>;

// ─── Services (hotel features, 9.6) ─────────────────────────────────────────

const serviceFields = {
  name: requiredText(80),
  description: nullableText(1000),
  iconKey: iconKeySchema.nullable(),
  mediaAssetId: nullableId,
  active: z.boolean(),
  highlighted: z.boolean(),
  sortOrder: sortOrderSchema,
};
export const serviceCreateSchema = z.strictObject({
  ...serviceFields,
  description: serviceFields.description.optional(),
  iconKey: serviceFields.iconKey.optional(),
  mediaAssetId: serviceFields.mediaAssetId.optional(),
  active: serviceFields.active.default(true),
  highlighted: serviceFields.highlighted.default(false),
  sortOrder: serviceFields.sortOrder.optional(),
});
export const serviceUpdateSchema = z.strictObject(serviceFields).partial();
export type ServiceCreateInput = z.infer<typeof serviceCreateSchema>;
export type ServiceUpdateInput = z.infer<typeof serviceUpdateSchema>;

// ─── Rooms (9.4) ────────────────────────────────────────────────────────────

export const ROOM_TYPES = ['INDIVIDUAL', 'COUPLE', 'TWIN', 'FAMILY'] as const;
export const PRICE_UNITS = ['PER_NIGHT', 'PER_PERSON_PER_NIGHT', 'OTHER'] as const;
export const BED_TYPES = ['SINGLE', 'DOUBLE', 'QUEEN', 'KING', 'BUNK', 'SOFA_BED'] as const;

export const bedsSchema = z
  .array(z.strictObject({ type: z.enum(BED_TYPES), count: z.int().min(1).max(10) }))
  .max(10);

const roomFields = {
  name: requiredText(120),
  slug: slugSchema,
  type: z.enum(ROOM_TYPES),
  shortDescription: nullableText(300),
  description: nullableText(5000),
  capacity: z.int().min(1).max(50),
  beds: bedsSchema.nullable(),
  areaM2: z.number().positive().max(9999).nullable(),
  /** Whole Colombian pesos (ADR 0006). */
  basePrice: z.int().min(0).max(100_000_000).nullable(),
  priceUnit: z.enum(PRICE_UNITS),
  taxesIncluded: z.boolean(),
  priceNotes: nullableText(500),
  seoTitle: nullableText(70),
  seoDescription: nullableText(170),
  amenityIds: z.array(idSchema).max(100),
};
export const roomCreateSchema = z.strictObject({
  ...roomFields,
  slug: roomFields.slug.optional(),
  shortDescription: roomFields.shortDescription.optional(),
  description: roomFields.description.optional(),
  beds: roomFields.beds.optional(),
  areaM2: roomFields.areaM2.optional(),
  basePrice: roomFields.basePrice.optional(),
  priceUnit: roomFields.priceUnit.default('PER_NIGHT'),
  taxesIncluded: roomFields.taxesIncluded.default(true),
  priceNotes: roomFields.priceNotes.optional(),
  seoTitle: roomFields.seoTitle.optional(),
  seoDescription: roomFields.seoDescription.optional(),
  amenityIds: roomFields.amenityIds.default([]),
});
export const roomUpdateSchema = z.strictObject(roomFields).partial();
export type RoomCreateInput = z.infer<typeof roomCreateSchema>;
export type RoomUpdateInput = z.infer<typeof roomUpdateSchema>;

export const roomStatusSchema = z.strictObject({ status: publicationStatusSchema });

/** Full ordered image set of a room; replaces the previous one. At most one cover. */
export const roomImagesSchema = z.strictObject({
  images: z
    .array(z.strictObject({ mediaAssetId: idSchema, isCover: z.boolean().default(false) }))
    .max(60)
    .refine((items) => items.filter((i) => i.isCover).length <= 1, 'Only one cover image')
    .refine(
      (items) => new Set(items.map((i) => i.mediaAssetId)).size === items.length,
      'Images must be unique',
    ),
});
export type RoomImagesInput = z.infer<typeof roomImagesSchema>;

// ─── Promotions (9.5) ───────────────────────────────────────────────────────

const promotionFields = {
  title: requiredText(120),
  description: nullableText(2000),
  conditions: nullableText(2000),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  roomId: nullableId,
  status: publicationStatusSchema,
  sortOrder: sortOrderSchema,
};
export const promotionCreateSchema = z
  .strictObject({
    ...promotionFields,
    description: promotionFields.description.optional(),
    conditions: promotionFields.conditions.optional(),
    roomId: promotionFields.roomId.optional(),
    status: promotionFields.status.default('DRAFT'),
    sortOrder: promotionFields.sortOrder.optional(),
  })
  .refine((v) => v.endsAt > v.startsAt, {
    message: 'endsAt must be after startsAt',
    path: ['endsAt'],
  });
export const promotionUpdateSchema = z.strictObject(promotionFields).partial();
export type PromotionCreateInput = z.infer<typeof promotionCreateSchema>;
export type PromotionUpdateInput = z.infer<typeof promotionUpdateSchema>;

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

/** Plain text only (no HTML); the web renders it as text. */
export const landingSectionUpdateSchema = z
  .strictObject({
    title: nullableText(160),
    subtitle: nullableText(300),
    body: nullableText(4000),
    ctaLabel: nullableText(60),
    mediaAssetId: nullableId,
    enabled: z.boolean(),
    sortOrder: sortOrderSchema,
  })
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
