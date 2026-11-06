import type { MetadataRoute } from 'next';
import { routes } from '@/lib/public/navigation';
import { absoluteUrl } from './config';

/**
 * sitemap.xml entries (requirement 19.1): every indexable public page plus each published room
 * type, on the production origin. Redirected URLs (`redirects.ts`, old room slugs) are never
 * listed. `lastModified` comes only from real data: a room type's last edit, the hotel profile's
 * last edit (location), or the newest of both (home, rooms index); pages without a data date
 * (gallery, policies) carry none instead of a made-up one. Legal pages join once approved.
 */
export interface SitemapInput {
  rooms: { slug: string; updatedAt: string }[];
  hotelUpdatedAt: string | null;
  legalApproved: boolean;
}

function date(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function newest(dates: (Date | undefined)[]): Date | undefined {
  const known = dates.filter((value): value is Date => value !== undefined);
  return known.length > 0
    ? new Date(Math.max(...known.map((value) => value.getTime())))
    : undefined;
}

export function buildSitemap({
  rooms,
  hotelUpdatedAt,
  legalApproved,
}: SitemapInput): MetadataRoute.Sitemap {
  const hotel = date(hotelUpdatedAt);
  const roomDates = rooms.map((room) => date(room.updatedAt));
  const latestRoom = newest(roomDates);
  const entry = (path: string, priority: number, lastModified?: Date) => ({
    url: absoluteUrl(path),
    priority,
    ...(lastModified ? { lastModified } : {}),
  });

  return [
    entry(routes.home, 1, newest([hotel, latestRoom])),
    entry(routes.rooms, 0.9, latestRoom),
    ...rooms.map((room, index) => entry(routes.room(room.slug), 0.8, roomDates[index])),
    entry(routes.location, 0.8, hotel),
    entry(routes.gallery, 0.6),
    entry(routes.policies, 0.5),
    ...(legalApproved
      ? [routes.legalData, routes.legalPrivacy, routes.legalCookies].map((path) => entry(path, 0.2))
      : []),
  ];
}
