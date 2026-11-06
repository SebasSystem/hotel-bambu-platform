import { CACHE_TAGS, roomCacheTag } from '@hotel-bambu/shared';
import { unstable_rethrow } from 'next/navigation';
import { connection } from 'next/server';
import { cache } from 'react';
import type {
  PublicFaq,
  PublicGalleryItem,
  PublicPolicy,
  PublicPromotion,
  PublicRoomDetail,
  PublicRoomSummary,
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
/** Promotions end by date: keep their cache short so expired ones disappear (requirement 21). */
const PROMOTIONS_TTL = 60;

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
  // A payload cached before ADR 0015 (hero slides, hotel amenities) may still be served until
  // the `site` tag is revalidated: default the newer lists instead of failing the page.
  return {
    ...site,
    heroSlides: site.heroSlides ?? [],
    hotelAmenities: site.hotelAmenities ?? [],
    homeAmenities: site.homeAmenities ?? [],
  };
});

export const getRooms = cache(() =>
  optional(publicGet<PublicRoomSummary[]>('/rooms', [CACHE_TAGS.rooms]), []),
);

export type RoomResult =
  | { kind: 'room'; room: PublicRoomDetail }
  | { kind: 'redirect'; slug: string }
  | { kind: 'not-found' };

export const getRoom = cache(async (slug: string): Promise<RoomResult> => {
  const data = await publicGet<PublicRoomDetail | { redirectTo: string }>(
    `/rooms/${encodeURIComponent(slug)}`,
    [CACHE_TAGS.rooms, roomCacheTag(slug), CACHE_TAGS.promotions, CACHE_TAGS.amenities],
    PROMOTIONS_TTL * 5,
  );
  if (!data) return { kind: 'not-found' };
  if ('redirectTo' in data) return { kind: 'redirect', slug: data.redirectTo };
  return { kind: 'room', room: data };
});

export const getGallery = cache(() =>
  optional(publicGet<PublicGalleryItem[]>('/gallery', [CACHE_TAGS.gallery]), []),
);

export const getFaqs = cache(() => optional(publicGet<PublicFaq[]>('/faq', [CACHE_TAGS.faq]), []));

export const getPolicies = cache(() =>
  optional(publicGet<PublicPolicy[]>('/policies', [CACHE_TAGS.policies]), []),
);

export const getPromotions = cache(() =>
  optional(
    publicGet<PublicPromotion[]>('/promotions', [CACHE_TAGS.promotions], PROMOTIONS_TTL),
    [],
  ),
);
