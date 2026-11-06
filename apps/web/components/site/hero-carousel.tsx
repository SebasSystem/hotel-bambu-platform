'use client';

import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useEffect, useReducer, useRef, useState, type ReactNode } from 'react';
import { iconButtonClass } from '@/components/ui/button';
import { ui } from '@/lib/i18n/es';
import { CAROUSEL_INTERVAL_MS, carouselReducer, initialCarousel } from '@/lib/public/carousel';

const SWIPE_THRESHOLD = 45;
const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Home hero carousel (mockup `.hero-carousel`, spec §3 with its defects fixed): stacked slides with
 * a CSS cross-fade, autoplay every 5.5 s, a real pause toggle (`aria-pressed`, WCAG 2.2.2), prev /
 * next, swipe, and an "01 / 03" index. Reduced motion starts paused; focus inside holds the
 * rotation. One slide renders no controls. Inactive slides are `aria-hidden` and `inert`.
 * The controls sit left of the floating WhatsApp safe zone (spec defect 5).
 */
export function HeroCarousel({ slides, label }: { slides: ReactNode[]; label: string }) {
  const [state, dispatch] = useReducer(carouselReducer, slides.length, (count) =>
    initialCarousel(count, false),
  );
  const [held, setHeld] = useState(false);
  const touchX = useRef<number | null>(null);
  const multiple = slides.length > 1;

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) dispatch({ type: 'pause' });
  }, []);

  useEffect(() => {
    if (!multiple || state.paused || held) return;
    // Restarts after every slide change, so a manual move gets a full interval too.
    const timer = window.setTimeout(() => dispatch({ type: 'tick' }), CAROUSEL_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [multiple, state.paused, state.index, held]);

  return (
    <section
      aria-roledescription={ui.hero.carousel}
      aria-label={label}
      className="absolute inset-0"
      onFocus={() => setHeld(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHeld(false);
      }}
      onTouchStart={(event) => {
        touchX.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        const start = touchX.current;
        const end = event.changedTouches[0]?.clientX;
        touchX.current = null;
        if (!multiple || start === null || end === undefined) return;
        const delta = end - start;
        if (Math.abs(delta) >= SWIPE_THRESHOLD) dispatch({ type: delta < 0 ? 'next' : 'prev' });
      }}
    >
      {slides.map((slide, index) => {
        const active = index === state.index;
        return (
          <div
            key={index}
            role="group"
            aria-roledescription={ui.hero.slideRole}
            aria-label={ui.hero.slide(index + 1, slides.length)}
            aria-hidden={active ? undefined : true}
            inert={!active}
            data-active={active ? 'true' : 'false'}
            className="hero-slide absolute inset-0"
          >
            {slide}
          </div>
        );
      })}

      {multiple ? (
        <div className="hero-controls">
          <div className="flex items-center gap-[9px]">
            <button
              type="button"
              className={iconButtonClass(true)}
              aria-label={ui.hero.previous}
              onClick={() => dispatch({ type: 'prev' })}
            >
              <ChevronLeft aria-hidden="true" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className={iconButtonClass(true)}
              aria-pressed={state.paused}
              aria-label={state.paused ? ui.hero.play : ui.hero.pause}
              onClick={() => dispatch({ type: 'toggle' })}
            >
              {state.paused ? (
                <Play aria-hidden="true" strokeWidth={1.5} />
              ) : (
                <Pause aria-hidden="true" strokeWidth={1.5} />
              )}
            </button>
            <button
              type="button"
              className={iconButtonClass(true)}
              aria-label={ui.hero.next}
              onClick={() => dispatch({ type: 'next' })}
            >
              <ChevronRight aria-hidden="true" strokeWidth={1.5} />
            </button>
          </div>
          <p aria-hidden="true" className="hero-index font-display text-[1.05rem] text-white">
            <span>{pad(state.index + 1)}</span>{' '}
            <span className="opacity-55">/ {pad(slides.length)}</span>
          </p>
        </div>
      ) : null}
    </section>
  );
}
