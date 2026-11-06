'use client';

import type { PublicMedia } from '@hotel-bambu/shared';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { iconButtonClass } from '@/components/ui/button';
import { trapTab } from '@/lib/a11y/focus-trap';
import { ui } from '@/lib/i18n/es';
import { Picture } from './picture';

interface LightboxProps {
  images: PublicMedia[];
  index: number;
  onIndexChange: (index: number) => void;
  /** User dismissal (button, Escape, backdrop): the caller returns focus to the trigger. */
  onClose: () => void;
}

/**
 * Photo lightbox (mockup `.lightbox`, spec defect 6 fixed): a modal dialog portalled to `<body>`,
 * mounted only while open, so nothing is left over the page to intercept clicks after closing.
 * Focus starts on "Cerrar" and is trapped; Escape and the backdrop close it; arrows navigate; the
 * page behind (`[data-menu-inert]`) is inert and does not scroll. The caller closes it on route change.
 */
export function Lightbox({ images, index, onIndexChange, onClose }: LightboxProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const current = images[index];
  const count = images.length;

  useEffect(() => {
    closeRef.current?.focus();
    const background = [...document.querySelectorAll<HTMLElement>('[data-menu-inert]')];
    background.forEach((element) => element.setAttribute('inert', ''));
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      background.forEach((element) => element.removeAttribute('inert'));
      root.style.overflow = overflow;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      } else if (event.key === 'ArrowRight' && count > 1) {
        onIndexChange((index + 1) % count);
      } else if (event.key === 'ArrowLeft' && count > 1) {
        onIndexChange((index - 1 + count) % count);
      } else if (dialogRef.current) {
        trapTab(event, dialogRef.current);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [index, count, onIndexChange, onClose]);

  if (!current) return null;

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={current.altText}
      data-lightbox=""
      data-surface="dark"
      className="lightbox"
    >
      <div data-testid="lightbox-backdrop" className="lightbox-backdrop" onClick={onClose} />
      <button
        ref={closeRef}
        type="button"
        className={`${iconButtonClass(true)} lightbox-close`}
        aria-label={ui.gallery.close}
        onClick={onClose}
      >
        <X aria-hidden="true" strokeWidth={1.5} />
      </button>
      <figure className="lightbox-figure">
        <Picture
          key={current.id}
          media={current}
          sizes="(min-width: 65rem) 1040px, 94vw"
          className="block min-h-0"
          imgClassName="lightbox-img"
        />
        <figcaption className="text-sm text-white/85">
          {current.caption ?? current.altText}
          <span className="ml-3 text-white/70">{ui.gallery.position(index + 1, count)}</span>
        </figcaption>
      </figure>
      {count > 1 ? (
        <>
          <button
            type="button"
            className={`${iconButtonClass(true)} lightbox-nav left-3 tab:left-6`}
            aria-label={ui.gallery.previous}
            onClick={() => onIndexChange((index - 1 + count) % count)}
          >
            <ChevronLeft aria-hidden="true" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            className={`${iconButtonClass(true)} lightbox-nav right-3 tab:right-6`}
            aria-label={ui.gallery.next}
            onClick={() => onIndexChange((index + 1) % count)}
          >
            <ChevronRight aria-hidden="true" strokeWidth={1.5} />
          </button>
        </>
      ) : null}
    </div>,
    document.body,
  );
}
