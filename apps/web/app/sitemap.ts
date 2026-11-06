import type { MetadataRoute } from 'next';
import { getRooms } from '@/lib/public/api';
import { routes } from '@/lib/public/navigation';
import { absoluteUrl, isLegalApproved } from '@/lib/seo/config';

export const dynamic = 'force-dynamic';

/**
 * sitemap.xml (requirement 19.1): public pages plus every published room with its last edit.
 * Legal pages are listed only once the hotel approved them (`LEGAL_APPROVED=true`).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rooms = await getRooms();
  const pages = [
    { path: routes.home, priority: 1 },
    { path: routes.rooms, priority: 0.9 },
    { path: routes.gallery, priority: 0.6 },
    { path: routes.location, priority: 0.8 },
    { path: routes.faq, priority: 0.6 },
    { path: routes.policies, priority: 0.5 },
    { path: routes.contact, priority: 0.7 },
  ];
  const legal = isLegalApproved()
    ? [routes.legalData, routes.legalPrivacy, routes.legalCookies].map((path) => ({
        path,
        priority: 0.2,
      }))
    : [];

  return [
    ...[...pages, ...legal].map(({ path, priority }) => ({
      url: absoluteUrl(path),
      priority,
    })),
    ...rooms.map((room) => ({
      url: absoluteUrl(routes.room(room.slug)),
      lastModified: new Date(room.updatedAt),
      priority: 0.8,
    })),
  ];
}
