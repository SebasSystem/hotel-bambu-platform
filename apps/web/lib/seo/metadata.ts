import type { Metadata } from 'next';
import type { PublicMedia } from '@/lib/public/types';
import { absoluteUrl } from './config';

/** Default share image, generated from the brand (public/brand/og-default.png, 1200×630). */
export const DEFAULT_OG_IMAGE = {
  url: '/brand/og-default.png',
  width: 1200,
  height: 630,
  alt: 'Hotel Bambú Plaza',
} as const;

export interface PageSeo {
  /** Canonical path (no query string), e.g. `/habitaciones`. */
  path: string;
  title: string;
  description?: string | null;
  siteName: string;
  /** Page image (e.g. a room cover); the brand image otherwise. */
  image?: PublicMedia | null;
  /** Keep the page out of the index (draft legal texts) while its links stay followable. */
  noindex?: boolean;
}

/** Self-referential canonical on the production origin (`SITE_URL`), without query or hash. */
export function canonicalUrl(path: string): string {
  const clean = path.split(/[?#]/)[0] || '/';
  return absoluteUrl(clean);
}

/** Largest WebP variant (widely supported by link-preview crawlers), falling back to any. */
export function shareImage(media: PublicMedia | null | undefined) {
  if (!media || media.variants.length === 0) return null;
  const webp = media.variants.filter((variant) => variant.format === 'webp');
  const pool = webp.length > 0 ? webp : media.variants;
  const best = pool.at(-1);
  return best
    ? { url: best.url, width: best.width, height: best.height, alt: media.altText }
    : null;
}

/**
 * Canonical + Open Graph + Twitter card for a public page (requirement 19.1). Each page builds
 * its full set because Next.js replaces `openGraph` objects instead of merging them.
 */
export function pageMetadata({
  path,
  title,
  description,
  siteName,
  image,
  noindex = false,
}: PageSeo): Metadata {
  const images = [shareImage(image) ?? DEFAULT_OG_IMAGE];
  const canonical = canonicalUrl(path);
  return {
    title,
    description: description ?? undefined,
    alternates: { canonical },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: 'website',
      locale: 'es_CO',
      url: canonical,
      siteName,
      title,
      description: description ?? undefined,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: description ?? undefined,
      images: images.map((img) => img.url),
    },
  };
}
