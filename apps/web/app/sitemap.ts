import type { MetadataRoute } from 'next';
import { getRoomTypes, getSite } from '@/lib/public/api';
import { isLegalApproved } from '@/lib/seo/config';
import { buildSitemap } from '@/lib/seo/sitemap';

// Per request: SITE_URL / LEGAL_APPROVED are deployment flags, and room types change from the admin.
export const dynamic = 'force-dynamic';

/** sitemap.xml (requirement 19.1); the rules live in `lib/seo/sitemap.ts` (unit tested). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [site, rooms] = await Promise.all([getSite(), getRoomTypes()]);
  return buildSitemap({
    rooms,
    hotelUpdatedAt: site.hotel.updatedAt ?? null,
    legalApproved: isLegalApproved(),
  });
}
