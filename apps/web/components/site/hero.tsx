import Link from 'next/link';
import { buttonClass } from '@/components/ui/button';
import { Eyebrow } from '@/components/ui/eyebrow';
import { ui } from '@/lib/i18n/es';
import { routes } from '@/lib/public/navigation';
import type { PublicMedia } from '@/lib/public/types';
import { HeroCarousel } from './hero-carousel';
import { Picture } from './picture';
import type { ContactCta } from '@/lib/public/cta';
import { ContactCtaLink } from './contact-cta';

interface HeroProps {
  title: string;
  kicker: string | null;
  subtitle: string | null;
  /** "Desde $ 120.000 COP/noche", only when a published type has a rate. */
  rate: string | null;
  /** Ordered slides; the first one is the LCP image. */
  images: PublicMedia[];
  /** WhatsApp, else "Llamar al …" (`contactCta`). */
  cta: ContactCta | null;
}

/**
 * Home hero (mockup `.hero-carousel`): full-bleed photos on deep green with the mockup gradients,
 * kicker ("Hotel en Mocoa, Putumayo"), the hotel name as H1, the tagline, the "desde" rate and two
 * CTAs (WhatsApp or the phone call, plus "Ver habitaciones"). No quick date search (owner
 * decision), so the bottom padding drops from 190 to 120 px. Without photos it is a plain band.
 */
export function Hero({ title, kicker, subtitle, rate, images, cta }: HeroProps) {
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
        {/* CSS mask reveal (D6: replaces GSAP SplitText, ~32 KB of JavaScript on the home). */}
        <h1
          id="hero-title"
          className="hero-title max-w-[780px] text-[clamp(3.5rem,16vw,5.6rem)] text-balance text-white tab:text-display"
        >
          <span className="hero-title-inner">{title}</span>
        </h1>
        {subtitle ? (
          <p className="mt-[22px] max-w-[560px] text-[clamp(1rem,1.5vw,1.22rem)] text-pretty text-white/86">
            {subtitle}
          </p>
        ) : null}
        {rate ? (
          <p data-testid="hero-rate" className="mt-5 text-[1.05rem] font-bold text-white">
            {rate}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          {cta ? (
            <ContactCtaLink
              cta={cta}
              source="hero"
              className={buttonClass('light')}
              whatsappLabel={ui.whatsapp.stay}
            />
          ) : null}
          <Link href={routes.rooms} className={buttonClass(cta ? 'ghostOnDark' : 'light')}>
            {ui.rooms.seeAll}
          </Link>
        </div>
      </div>
    </section>
  );
}
