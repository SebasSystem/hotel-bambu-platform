import type { MetadataRoute } from 'next';
import { absoluteUrl, isIndexable } from '@/lib/seo/config';

// Per request: SITE_INDEXABLE / SITE_URL are deployment flags, not build-time constants.
export const dynamic = 'force-dynamic';

/** robots.txt (requirement 19.1): staging and local copies disallow everything. */
export default function robots(): MetadataRoute.Robots {
  if (!isIndexable()) {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] }],
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
