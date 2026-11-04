import type { PublicMedia } from '@hotel-bambu/shared';
import type { CSSProperties } from 'react';
import { mediaFallback, mediaSize, mediaSrcSet } from '@/lib/public/media';

interface PictureProps {
  media: PublicMedia;
  /** Rendered width hints for the browser, e.g. "(min-width: 64rem) 33vw, 100vw". */
  sizes: string;
  /** LCP image only (requirement 20.3): eager + high fetch priority. */
  priority?: boolean;
  className?: string;
  imgClassName?: string;
  /** Crop focus for portrait photos in landscape frames. */
  objectPosition?: string;
  /** Decorative duplicate of an image already described nearby. */
  decorative?: boolean;
}

/**
 * Responsive image from the API's pre-generated AVIF/WebP variants (ADR 0011): explicit `srcset`
 * per format in `<picture>`, intrinsic size against CLS, blur + dominant colour placeholder.
 * No runtime optimizer: the variants already are the optimized files.
 */
export function Picture({
  media,
  sizes,
  priority = false,
  className,
  imgClassName,
  objectPosition,
  decorative = false,
}: PictureProps) {
  const fallback = mediaFallback(media);
  if (!fallback) return null;
  const { width, height } = mediaSize(media);
  const avif = mediaSrcSet(media, 'avif');
  const webp = mediaSrcSet(media, 'webp');
  const style: CSSProperties = {
    objectPosition,
    backgroundColor: media.dominantColor ?? undefined,
    backgroundImage: media.blurDataUrl ? `url("${media.blurDataUrl}")` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: objectPosition ?? 'center',
  };
  return (
    <picture className={className}>
      {avif ? <source type="image/avif" srcSet={avif} sizes={sizes} /> : null}
      {webp ? <source type="image/webp" srcSet={webp} sizes={sizes} /> : null}
      <img
        src={fallback.url}
        alt={decorative ? '' : media.altText}
        width={width}
        height={height}
        sizes={sizes}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding={priority ? 'sync' : 'async'}
        className={imgClassName}
        style={style}
      />
    </picture>
  );
}
