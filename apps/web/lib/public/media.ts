import type { PublicMedia } from '@hotel-bambu/shared';

type Format = 'avif' | 'webp';

/** `srcset` for one format from the pre-generated API variants (requirement 15.4). */
export function mediaSrcSet(media: PublicMedia, format: Format): string {
  return media.variants
    .filter((variant) => variant.format === format)
    .sort((a, b) => a.width - b.width)
    .map((variant) => `${variant.url} ${variant.width}w`)
    .join(', ');
}

/** Largest WebP variant (universal fallback `src`), else the largest of any format. */
export function mediaFallback(media: PublicMedia) {
  const sorted = [...media.variants].sort((a, b) => b.width - a.width);
  return sorted.find((variant) => variant.format === 'webp') ?? sorted[0] ?? null;
}

/** Intrinsic size for layout (avoids CLS); falls back to the largest variant. */
export function mediaSize(media: PublicMedia): { width: number; height: number } {
  if (media.width && media.height) return { width: media.width, height: media.height };
  const fallback = mediaFallback(media);
  return { width: fallback?.width ?? 960, height: fallback?.height ?? 1280 };
}
