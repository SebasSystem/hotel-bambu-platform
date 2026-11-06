'use client';

import type { PublicMedia } from '@hotel-bambu/shared';
import { Images } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ui } from '@/lib/i18n/es';
import { Lightbox } from './lightbox';
import { Picture } from './picture';

export type PhotoGalleryVariant = 'masonry' | 'strip' | 'room';

interface PhotoGalleryProps {
  images: PublicMedia[];
  /**
   * `masonry`: gallery page, 3 columns with fixed tile ratios so photos always fill their tile.
   * `strip`: home bento of 4 tiles. `room`: room detail media, first photo fills the frame (LCP)
   * with thumbnails over it.
   */
  variant: PhotoGalleryVariant;
  /** Glass label per tile (category), same order as `images`. */
  captions?: (string | null)[];
}

/**
 * Tiles are ratios chosen for the hotel's 3:4 portrait photos: 3/4 shows the whole frame, 4/5 and
 * 1/1 crop gently around the centre. Explicit ratios fix the mockup's letterboxed tiles (defect 3).
 */
const MASONRY_RATIOS = ['aspect-[3/4]', 'aspect-[4/5]', 'aspect-square'];
const MASONRY_SIZES = '(min-width: 47.5rem) 30vw, 92vw';
const STRIP_SIZES = ['(min-width: 47.5rem) 45vw, 100vw', '(min-width: 47.5rem) 22vw, 50vw'];
const ROOM_THUMBS = 4;

/** Photo tiles that open the shared lightbox (gallery page, home strip, room detail). */
export function PhotoGallery({ images, variant, captions = [] }: PhotoGalleryProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState<number | null>(null);
  const triggers = useRef<(HTMLButtonElement | null)[]>([]);
  const opener = useRef<number>(0);

  // Overlays never survive navigation (spec defect 6).
  const lastPath = useRef(pathname);
  useEffect(() => {
    if (lastPath.current !== pathname) {
      lastPath.current = pathname;
      setOpen(null);
    }
  }, [pathname]);

  const show = (index: number) => {
    opener.current = index;
    setOpen(index);
  };
  const returnFocus = useRef(false);
  const close = () => {
    returnFocus.current = true;
    setOpen(null);
  };
  // After the lightbox unmounted: its cleanup has removed `inert`, so the trigger can take focus.
  useEffect(() => {
    if (open !== null || !returnFocus.current) return;
    returnFocus.current = false;
    triggers.current[opener.current]?.focus();
  }, [open]);

  const tile = (media: PublicMedia, index: number, className: string, sizes: string) => (
    <button
      key={media.id}
      ref={(node) => {
        triggers.current[index] = node;
      }}
      type="button"
      onClick={() => show(index)}
      className={`photo-tile group ${className}`}
    >
      <Picture
        media={media}
        priority={variant === 'room' && index === 0}
        sizes={sizes}
        decorative
        className="block size-full"
        imgClassName="photo-tile-img size-full object-cover"
      />
      {captions[index] ? <span className="photo-tile-label">{captions[index]}</span> : null}
      <span className="sr-only">{ui.gallery.open(media.altText)}</span>
    </button>
  );

  let tiles;
  if (variant === 'room') {
    const [first, ...rest] = images;
    tiles = first ? (
      <div className="relative size-full">
        {tile(first, 0, 'size-full rounded-none', '(min-width: 62.5rem) 62vw, 100vw')}
        {rest.length > 0 ? (
          <div className="absolute inset-x-4 bottom-4 flex items-end gap-2 tab:inset-x-6 tab:bottom-6">
            {rest
              .slice(0, ROOM_THUMBS)
              .map((media, i) =>
                tile(
                  media,
                  i + 1,
                  'size-16 rounded-sm border-2 border-white/80 tab:size-20',
                  '80px',
                ),
              )}
            {images.length > ROOM_THUMBS + 1 ? (
              <button
                type="button"
                onClick={() => show(0)}
                className="ml-auto inline-flex min-h-10 items-center gap-2 rounded-pill bg-[rgb(17_31_24/0.68)] px-4 text-chip font-bold text-white backdrop-blur-[8px]"
              >
                <Images aria-hidden="true" strokeWidth={1.5} className="size-4" />
                {ui.gallery.seeAllPhotos(images.length)}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    ) : null;
  } else if (variant === 'strip') {
    tiles = (
      <div className="gallery-strip">
        {images
          .slice(0, 4)
          .map((media, i) => tile(media, i, 'rounded-md', STRIP_SIZES[i === 0 ? 0 : 1]!))}
      </div>
    );
  } else {
    tiles = (
      <ul className="gallery-masonry">
        {images.map((media, i) => (
          <li key={media.id} className="mb-3.5 break-inside-avoid">
            {tile(media, i, `w-full rounded-md ${MASONRY_RATIOS[i % 3]}`, MASONRY_SIZES)}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <>
      {tiles}
      {open !== null ? (
        <Lightbox images={images} index={open} onIndexChange={setOpen} onClose={close} />
      ) : null}
    </>
  );
}
