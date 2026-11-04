'use client';

import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useCallback, useRef, useState, type CSSProperties } from 'react';
import { ui } from '@/lib/i18n/es';
import type { PublicMedia } from '@/lib/public/types';
import { Picture } from './picture';

/**
 * Gallery grid with a native `<dialog>` lightbox (motion spec: CSS fade; focus trap and Esc
 * from the platform; arrow keys navigate). Every image is a real button with its alt text.
 */
export function GalleryGrid({
  images,
  layout = 'grid',
}: {
  images: PublicMedia[];
  /** `room`: first photo large (LCP, priority) with the rest as a 3-column strip. */
  layout?: 'grid' | 'room';
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const current = images[index];

  const open = (next: number) => {
    setIndex(next);
    dialogRef.current?.showModal();
  };
  const step = useCallback(
    (delta: number) => setIndex((value) => (value + delta + images.length) % images.length),
    [images.length],
  );

  return (
    <>
      <ul className={layout === 'room' ? 'grid grid-cols-3 gap-3' : 'gallery-grid'}>
        {images.map((media, i) => (
          <li
            key={media.id}
            data-reveal={layout === 'room' && i === 0 ? undefined : true}
            className={
              layout === 'room'
                ? i === 0
                  ? 'col-span-3 aspect-[4/5] sm:aspect-[5/6]'
                  : 'aspect-[3/4]'
                : 'gallery-item'
            }
            style={{ '--i': i % 6 } as CSSProperties}
          >
            <button
              type="button"
              onClick={() => open(i)}
              className="group block size-full overflow-hidden rounded-lg bg-sand-100"
            >
              <Picture
                media={media}
                priority={layout === 'room' && i === 0}
                sizes={
                  layout === 'room'
                    ? i === 0
                      ? '(min-width: 80rem) 700px, (min-width: 64rem) 55vw, 100vw'
                      : '(min-width: 64rem) 230px, 30vw'
                    : '(min-width: 64rem) 30vw, (min-width: 40rem) 45vw, 92vw'
                }
                className="block size-full"
                imgClassName="room-card-img size-full object-cover"
              />
              <span className="sr-only">{ui.gallery.open(media.altText)}</span>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        className="lightbox"
        aria-label={current ? current.altText : ui.gallery.close}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') step(1);
          if (event.key === 'ArrowLeft') step(-1);
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
      >
        {current ? (
          <figure className="flex h-full flex-col items-center justify-center gap-3 p-4 sm:p-8">
            <Picture
              key={current.id}
              media={current}
              sizes="(min-width: 64rem) 60vw, 100vw"
              className="block min-h-0 flex-1"
              imgClassName="h-full w-auto max-w-full rounded-md object-contain"
            />
            <figcaption className="max-w-2xl text-center text-sm text-sand-50/90">
              {current.caption ?? current.altText}
              <span className="ml-2 text-sand-50/60">
                {ui.gallery.position(index + 1, images.length)}
              </span>
            </figcaption>
          </figure>
        ) : null}
        <button
          type="button"
          className="lightbox-btn top-4 right-4"
          onClick={() => dialogRef.current?.close()}
        >
          <X aria-hidden="true" className="size-6" />
          <span className="sr-only">{ui.gallery.close}</span>
        </button>
        {images.length > 1 ? (
          <>
            <button type="button" className="lightbox-btn top-1/2 left-4" onClick={() => step(-1)}>
              <ChevronLeft aria-hidden="true" className="size-6" />
              <span className="sr-only">{ui.gallery.previous}</span>
            </button>
            <button type="button" className="lightbox-btn top-1/2 right-4" onClick={() => step(1)}>
              <ChevronRight aria-hidden="true" className="size-6" />
              <span className="sr-only">{ui.gallery.next}</span>
            </button>
          </>
        ) : null}
      </dialog>
    </>
  );
}
