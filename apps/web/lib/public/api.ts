import { CACHE_TAGS, roomCacheTag } from '@hotel-bambu/shared';
import { unstable_rethrow } from 'next/navigation';
import { connection } from 'next/server';
import { cache } from 'react';
import { heroImages } from './site';
import type {
  PublicFaq,
  PublicGalleryItem,
  PublicMedia,
  PublicNearbyPlace,
  PublicPolicy,
  PublicRoomTypeDetail,
  PublicRoomTypeRedirect,
  PublicRoomTypeSummary,
  PublicSite,
} from './types';

/**
 * Public data layer (requirements 12.3, 21). Server Components only.
 *
 * - Every response is stored in the Next.js Data Cache, tagged with the shared `CACHE_TAGS`, and
 *   invalidated on demand by `POST /api/revalidate` (sent by the API after admin mutations).
 *   `revalidate` is only a staleness bound in case a revalidation call is lost.
 * - `connection()` renders public pages per request (data still comes from the tagged cache):
 *   builds do not need a running API, and old room slugs answer a real HTTP permanent redirect.
 *   See ADR 0011.
 */

const DEFAULT_TTL = 3600;

function apiBase(): string {
  return `${(process.env.API_INTERNAL_URL ?? 'http://localhost:4000').replace(/\/$/, '')}/api/v1`;
}

async function publicGet<T>(path: string, tags: string[], ttl = DEFAULT_TTL): Promise<T | null> {
  await connection();
  const response = await fetch(`${apiBase()}/public${path}`, {
    headers: { accept: 'application/json' },
    next: { tags, revalidate: ttl },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Public API GET ${path} failed with ${response.status}`);
  return (await response.json()) as T;
}

/** Optional blocks must not take the page down: log and render without them (requirement 4.4). */
async function optional<T>(load: Promise<T | null>, fallback: T): Promise<T> {
  try {
    return (await load) ?? fallback;
  } catch (error) {
    // Let Next.js control-flow errors (dynamic usage, redirects) through.
    unstable_rethrow(error);
    console.error('[public] optional content unavailable:', error);
    return fallback;
  }
}

export const getSite = cache(async (): Promise<PublicSite> => {
  const site = await publicGet<PublicSite>('/site', [CACHE_TAGS.site]);
  if (!site) throw new Error('Public site profile not found');
  // A payload cached before ADR 0015/0016 may still be served until the `site` tag is
  // revalidated: default the newer fields instead of failing the page.
  return {
    ...site,
    hotel: {
      ...site.hotel,
      tagline: site.hotel.tagline ?? null,
      country: site.hotel.country ?? null,
      whatsappGreeting: site.hotel.whatsappGreeting ?? null,
    },
    heroSlides: site.heroSlides ?? [],
    hotelAmenities: site.hotelAmenities ?? [],
    homeAmenities: site.homeAmenities ?? [],
    sections: (site.sections ?? []).map(({ key, sortOrder }) => ({ key, sortOrder })),
  };
});

/**
 * Published room types with their published room counts (ADR 0016) and bed setup (D6). A list
 * cached before D6 has no `beds`/`areaM2` until the `rooms` tag is revalidated: default them.
 */
export const getRoomTypes = cache(async (): Promise<PublicRoomTypeSummary[]> => {
  const types = await optional(
    publicGet<PublicRoomTypeSummary[]>('/room-types', [CACHE_TAGS.rooms]),
    [],
  );
  return types.map((type) => ({ ...type, beds: type.beds ?? null, areaM2: type.areaM2 ?? null }));
});

export type RoomResult =
  | { kind: 'room'; room: PublicRoomTypeDetail }
  | { kind: 'redirect'; slug: string }
  | { kind: 'not-found' };

/**
 * Room type page data. An old slug (a renamed type, or a former per-room URL mapped by the
 * migration) answers `{ redirectTo }`, which the page turns into a permanent redirect.
 */
export const getRoomType = cache(async (slug: string): Promise<RoomResult> => {
  const data = await publicGet<PublicRoomTypeDetail | PublicRoomTypeRedirect>(
    `/room-types/${encodeURIComponent(slug)}`,
    [CACHE_TAGS.rooms, roomCacheTag(slug), CACHE_TAGS.amenities],
  );
  if (!data) return { kind: 'not-found' };
  if ('redirectTo' in data) return { kind: 'redirect', slug: data.redirectTo };
  return { kind: 'room', room: data };
});

export const getNearbyPlaces = cache(() =>
  optional(publicGet<PublicNearbyPlace[]>('/nearby-places', [CACHE_TAGS.nearby]), []),
);

export const getGallery = cache(() =>
  optional(publicGet<PublicGalleryItem[]>('/gallery', [CACHE_TAGS.gallery]), []),
);

export const getFaqs = cache(() => optional(publicGet<PublicFaq[]>('/faq', [CACHE_TAGS.faq]), []));

export const getPolicies = cache(() =>
  optional(publicGet<PublicPolicy[]>('/policies', [CACHE_TAGS.policies]), []),
);

/**
 * Real hotel photos for share images and the Hotel JSON-LD: the hero slides, else the hero
 * fallback (featured gallery, gallery, room covers). Never the logo (research §7).
 */
export const getSiteImages = cache(async (): Promise<PublicMedia[]> => {
  const [site, gallery, types] = await Promise.all([getSite(), getGallery(), getRoomTypes()]);
  return heroImages(site, gallery, types);
});
