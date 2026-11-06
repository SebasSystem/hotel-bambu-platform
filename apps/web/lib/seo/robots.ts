import type { MetadataRoute } from 'next';

/**
 * robots.txt rules (requirement 19.1). Staging and local copies (`SITE_INDEXABLE` unset) disallow
 * everything and list no sitemap. Production allows the public site, keeps the admin and the API
 * out (the admin also answers `noindex` and `X-Robots-Tag`) and points to the sitemap. Next.js
 * assets under `/_next/` stay crawlable so Google can render the pages.
 */
export function buildRobots({
  indexable,
  origin,
}: {
  indexable: boolean;
  origin: string;
}): MetadataRoute.Robots {
  if (!indexable) return { rules: [{ userAgent: '*', disallow: '/' }] };
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] }],
    sitemap: new URL('/sitemap.xml', origin).toString(),
  };
}
