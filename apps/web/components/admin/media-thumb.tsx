'use client';

import { ImageOff } from 'lucide-react';
import { useThumbnail } from './admin-context';
import { cx } from './ui';

/** Admin preview of a stored image (variants carry `key` or `url`). */
export function MediaThumb({
  variants,
  alt,
  className,
  minWidth,
}: {
  variants: unknown;
  alt: string;
  className?: string;
  minWidth?: number;
}) {
  const src = useThumbnail(variants, minWidth);
  if (!src) {
    return (
      <div
        className={cx('flex items-center justify-center bg-muted text-muted-foreground', className)}
      >
        <ImageOff aria-hidden="true" className="size-6" />
        <span className="sr-only">Sin vista previa</span>
      </div>
    );
  }
  // Plain <img>: variants are already optimised AVIF/WebP files (ADR 0002); the admin does not
  // need the Next.js image optimizer or remotePatterns for the storage host.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" className={cx('object-cover', className)} />;
}
