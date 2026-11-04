'use client';

import { Pause, Play } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ui } from '@/lib/i18n/es';

const ROTATE_MS = 6000;

/**
 * Desktop hero cross-fade (motion spec): CSS opacity every 6 s with a labelled pause control
 * (WCAG 2.2.2). Mobile and reduced motion: first image only, no rotation, no control.
 */
export function HeroSlides({ slides }: { slides: ReactNode[] }) {
  const [active, setActive] = useState(0);
  const [canRotate, setCanRotate] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (slides.length < 2) return;
    const query = window.matchMedia(
      '(min-width: 64rem) and (prefers-reduced-motion: no-preference)',
    );
    const update = () => {
      setCanRotate(query.matches);
      if (!query.matches) setActive(0);
    };
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, [slides.length]);

  useEffect(() => {
    if (!canRotate || paused) return;
    const timer = window.setInterval(
      () => setActive((index) => (index + 1) % slides.length),
      ROTATE_MS,
    );
    return () => window.clearInterval(timer);
  }, [canRotate, paused, slides.length]);

  return (
    <>
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`hero-slide absolute inset-0 ${index > 0 ? 'hidden lg:block' : ''}`}
          data-active={index === active ? 'true' : 'false'}
          aria-hidden={index === active ? undefined : true}
        >
          {slide}
        </div>
      ))}
      {canRotate ? (
        <button
          type="button"
          onClick={() => setPaused((value) => !value)}
          aria-pressed={paused}
          className="absolute right-4 bottom-4 z-10 inline-flex size-11 items-center justify-center rounded-pill bg-sand-50/90 text-bamboo-900 shadow-sm backdrop-blur transition-colors hover:bg-white"
        >
          {paused ? (
            <Play aria-hidden="true" strokeWidth={1.75} className="size-5" />
          ) : (
            <Pause aria-hidden="true" strokeWidth={1.75} className="size-5" />
          )}
          <span className="sr-only">{paused ? ui.hero.play : ui.hero.pause}</span>
        </button>
      ) : null}
    </>
  );
}

/**
 * Hero title revealed line by line (GSAP SplitText, masks). Runs only with
 * `prefers-reduced-motion: no-preference`; the server HTML always contains the full text.
 * GSAP is imported dynamically (requirement 20.2: animation libraries only where used, outside
 * the initial JavaScript budget).
 */
export function HeroTitle({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || !window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return;
    let cancelled = false;
    let revert: (() => void) | undefined;
    const fontsReady = Promise.race([
      document.fonts.ready,
      new Promise((resolve) => window.setTimeout(resolve, 300)),
    ]);
    void Promise.all([import('gsap'), import('gsap/SplitText'), fontsReady]).then(
      ([{ gsap }, { SplitText }]) => {
        if (cancelled) return;
        gsap.registerPlugin(SplitText);
        const desktop = window.matchMedia('(min-width: 64rem)').matches;
        const split = SplitText.create(node, {
          type: 'lines',
          mask: 'lines',
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.lines, {
              yPercent: 105,
              duration: desktop ? 1.1 : 0.8,
              ease: 'power3.out',
              stagger: 0.08,
            }),
        });
        revert = () => split.revert();
      },
    );
    return () => {
      cancelled = true;
      revert?.();
    };
  }, []);

  return (
    <h1 ref={ref} id={id} className={className}>
      {children}
    </h1>
  );
}
