'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useRef, useState, type ReactNode } from 'react';

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Sticky "Sobre nosotros" (motion spec): on desktop the photo column stays in place (CSS sticky)
 * while the text advances; ScrollTrigger swaps the photo as each paragraph reaches the centre.
 * Mobile and reduced motion: no ScrollTrigger, text and first photo stacked statically.
 */
export function AboutStory({ paragraphs, images }: { paragraphs: string[]; images: ReactNode[] }) {
  const scope = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useGSAP(
    () => {
      if (images.length < 2) return;
      const mm = gsap.matchMedia();
      mm.add('(min-width: 64rem) and (prefers-reduced-motion: no-preference)', () => {
        const blocks = gsap.utils.toArray<HTMLElement>('[data-story-step]');
        blocks.forEach((block, index) => {
          ScrollTrigger.create({
            trigger: block,
            start: 'top center',
            end: 'bottom center',
            onToggle: (self) => {
              if (self.isActive) setActive(Math.min(index, images.length - 1));
            },
          });
        });
        return () => setActive(0);
      });
      return () => mm.revert();
    },
    { scope, dependencies: [images.length] },
  );

  return (
    <div ref={scope} className="grid gap-10 lg:grid-cols-12 lg:gap-16">
      {images.length > 0 ? (
        <div className="lg:col-span-5">
          <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-sand-100 shadow-md lg:sticky lg:top-[calc(var(--header-h)+2rem)]">
            {images.map((image, index) => (
              <div
                key={index}
                className={`story-image absolute inset-0 ${index > 0 ? 'hidden lg:block' : ''}`}
                data-active={index === active ? 'true' : 'false'}
                aria-hidden={index === active ? undefined : true}
              >
                {image}
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <div
        className={`${images.length > 0 ? 'lg:col-span-7' : 'lg:col-span-8'} flex flex-col gap-8`}
      >
        {paragraphs.map((text, index) => (
          <p
            key={index}
            data-story-step
            data-reveal
            className={`text-lg leading-normal text-pretty text-foreground/90 ${
              images.length > 1 ? 'lg:flex lg:min-h-[45vh] lg:items-center' : ''
            } ${index === 0 ? 'font-display text-2xl leading-snug text-bamboo-900' : ''}`}
          >
            {text}
          </p>
        ))}
      </div>
    </div>
  );
}
