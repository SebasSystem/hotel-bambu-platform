'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * CSS-first reveals (motion spec): adds `.js-motion` to <html> only after hydration, so without
 * JS (or if this fails) everything stays visible. Elements already on screen are marked visible
 * before the class is added, so nothing above the fold flashes or hides. Reduced motion: CSS
 * keeps the final state (rules live under `prefers-reduced-motion: no-preference`).
 */
export function MotionBoot() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    const inView = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    };
    for (const element of elements) {
      if (inView(element)) element.classList.add('is-visible');
    }
    root.classList.add('js-motion');

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -5% 0px' },
    );
    for (const element of elements) {
      if (!element.classList.contains('is-visible')) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
