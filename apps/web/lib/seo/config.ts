/**
 * Deployment flags read at request time (server only). See docs/configuration.md.
 *
 * - `SITE_URL`: public origin used for canonical URLs, Open Graph, sitemap and JSON-LD.
 * - `SITE_INDEXABLE=true`: allow search engines. Anything else (default) answers `noindex` and a
 *   `Disallow: /` robots.txt, so staging and local copies never get indexed (requirement 19.1).
 * - `LEGAL_APPROVED=true`: the hotel (and its adviser) approved the legal texts. Until then the
 *   legal pages show a draft banner, stay `noindex` and are left out of the sitemap (17.3).
 */
export function siteUrl(): URL {
  const raw = process.env.SITE_URL?.trim() || 'http://localhost:3000';
  try {
    return new URL(raw.replace(/\/+$/, ''));
  } catch {
    return new URL('http://localhost:3000');
  }
}

export function absoluteUrl(path: string): string {
  return new URL(path, siteUrl()).toString();
}

export function isIndexable(): boolean {
  return process.env.SITE_INDEXABLE === 'true';
}

export function isLegalApproved(): boolean {
  return process.env.LEGAL_APPROVED === 'true';
}
