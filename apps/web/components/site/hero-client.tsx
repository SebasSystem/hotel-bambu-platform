'use client';

import { useEffect, useRef, type ReactNode } from 'react';

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
