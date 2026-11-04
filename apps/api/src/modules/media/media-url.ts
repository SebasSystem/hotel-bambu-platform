import type { PublicMedia, PublicMediaVariant } from '@hotel-bambu/shared';
import type { StoredVariant } from './media-storage.js';

/** Fields of MediaAsset needed to render it publicly. */
export interface MediaRow {
  id: string;
  altText: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
  blurDataUrl: string | null;
  dominantColor: string | null;
  variants: unknown;
  status: string;
}

export const PUBLIC_MEDIA_SELECT = {
  id: true,
  altText: true,
  caption: true,
  width: true,
  height: true,
  blurDataUrl: true,
  dominantColor: true,
  variants: true,
  status: true,
} as const;

function isStoredVariant(value: unknown): value is StoredVariant {
  const v = value as Partial<StoredVariant> | null;
  return (
    !!v &&
    typeof v.key === 'string' &&
    typeof v.width === 'number' &&
    typeof v.height === 'number' &&
    (v.format === 'avif' || v.format === 'webp')
  );
}

export function storedVariants(value: unknown): StoredVariant[] {
  return Array.isArray(value) ? value.filter(isStoredVariant) : [];
}

export function variantUrl(publicBaseUrl: string, key: string): string {
  return `${publicBaseUrl}/${key.split('/').map(encodeURIComponent).join('/')}`;
}

/** Publishable = processed (READY) and described (alt text). Requirement 9.7 / 10. */
export function isPublishableMedia(media: Pick<MediaRow, 'status' | 'altText'> | null): boolean {
  return !!media && media.status === 'READY' && !!media.altText?.trim();
}

/** Public representation; null when the asset is not publishable (never leak drafts). */
export function toPublicMedia(
  media: MediaRow | null | undefined,
  publicBaseUrl: string,
): PublicMedia | null {
  if (!media || !isPublishableMedia(media)) return null;
  const variants: PublicMediaVariant[] = storedVariants(media.variants)
    .map((v) => ({
      width: v.width,
      height: v.height,
      format: v.format,
      url: variantUrl(publicBaseUrl, v.key),
    }))
    .sort((a, b) => a.width - b.width || a.format.localeCompare(b.format));
  return {
    id: media.id,
    altText: media.altText ?? '',
    caption: media.caption,
    width: media.width,
    height: media.height,
    blurDataUrl: media.blurDataUrl,
    dominantColor: media.dominantColor,
    variants,
  };
}
