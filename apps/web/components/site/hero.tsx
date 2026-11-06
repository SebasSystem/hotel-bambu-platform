import Link from 'next/link';
import { buttonClass } from '@/components/ui/button';
import { Eyebrow } from '@/components/ui/eyebrow';
import { ui } from '@/lib/i18n/es';
import { routes } from '@/lib/public/navigation';
import type { PublicMedia } from '@/lib/public/types';
import { HeroCarousel } from './hero-carousel';
import { HeroTitle } from './hero-client';
import { Picture } from './picture';
import { WhatsAppLink } from './whatsapp-link';

interface HeroProps {
  title: string;
  kicker: string | null;
  subtitle: string | null;
  ctaLabel: string | null;
  /** Ordered slides; the first one is the LCP image. Up to D3 this is the single hero + fallbacks. */
  images: PublicMedia[];
  whatsappUrl: string | null;
}

/**
 * Home hero (mockup `.hero-carousel`): full-bleed photos on deep green with the mockup gradients,
 * eyebrow, serif display title, copy and two CTAs (WhatsApp light + rooms ghost). No quick date
 * search (owner decision), so the bottom padding drops from 190 to 120 px. Without photos it is
 * a plain deep-green band.
 */
export function Hero({ title, kicker, subtitle, ctaLabel, images, whatsappUrl }: HeroProps) {
  const slides = images.map((media, index) => (
    <Picture
      key={media.id}
      media={media}
      priority={index === 0}
      sizes="100vw"
      className="block size-full"
      imgClassName="size-full object-cover"
      objectPosition="50% 45%"
    />
  ));

  return (
    <section
      id="inicio"
      data-fab-sentinel
      data-surface="dark"
      aria-labelledby="hero-title"
      className="home-hero"
    >
      {slides.length > 0 ? <HeroCarousel slides={slides} label={ui.hero.label} /> : null}
      <div className="home-hero-content">
        {kicker ? (
          <Eyebrow tone="onPhoto" className="mb-4">
            {kicker}
          </Eyebrow>
        ) : null}
        <HeroTitle
          id="hero-title"
          className="max-w-[780px] text-[clamp(3.5rem,16vw,5.6rem)] text-balance text-white tab:text-display"
        >
          {title}
        </HeroTitle>
        {subtitle ? (
          <p className="mt-[22px] max-w-[560px] text-[clamp(1rem,1.5vw,1.22rem)] text-pretty text-white/86">
            {subtitle}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          {whatsappUrl ? (
            <WhatsAppLink href={whatsappUrl} source="hero" className={buttonClass('light')}>
              {ctaLabel ?? ui.whatsapp.room}
            </WhatsAppLink>
          ) : null}
          <Link href={routes.rooms} className={buttonClass(whatsappUrl ? 'ghostOnDark' : 'light')}>
            {ui.rooms.seeAll}
          </Link>
        </div>
      </div>
    </section>
  );
}
