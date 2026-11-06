import type { MetadataRoute } from 'next';
import { isIndexable, siteUrl } from '@/lib/seo/config';
import { buildRobots } from '@/lib/seo/robots';

// Per request: SITE_INDEXABLE / SITE_URL are deployment flags, not build-time constants.
export const dynamic = 'force-dynamic';

/** robots.txt (requirement 19.1); the rules live in `lib/seo/robots.ts` (unit tested). */
export default function robots(): MetadataRoute.Robots {
  return buildRobots({ indexable: isIndexable(), origin: siteUrl().toString() });
}
