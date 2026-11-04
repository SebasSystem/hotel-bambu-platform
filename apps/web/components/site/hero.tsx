import Link from 'next/link';
import { ui } from '@/lib/i18n/es';
import { routes } from '@/lib/public/navigation';
import type { PublicMedia } from '@/lib/public/types';
import { HeroSlides, HeroTitle } from './hero-client';
import { Picture } from './picture';
import { button } from './styles';
import { WhatsAppLink } from './whatsapp-link';

interface HeroProps {
  title: string;
  kicker: string | null;
  subtitle: string | null;
  body: string | null;
  ctaLabel: string | null;
  images: PublicMedia[];
  whatsappUrl: string | null;
}

/**
 * Photo hero (ADR 0004, direction A). Mobile: full-height portrait photo with scrim, the header
 * floats over it. Desktop: split layout, text on sand (5/12) and a tall framed photo (7/12)
 * with a slow cross-fade. The first photo is the LCP image (priority, never animated in).
 */
export function Hero({ title, kicker, subtitle, body, ctaLabel, images, whatsappUrl }: HeroProps) {
  const slides = images.map((media, index) => (
    <Picture
      key={media.id}
      media={media}
      priority={index === 0}
      sizes="(min-width: 80rem) 700px, (min-width: 64rem) 56vw, 100vw"
      className="block size-full"
      imgClassName="size-full object-cover"
      objectPosition="50% 40%"
    />
  ));

  return (
    <section
      id="inicio"
      data-fab-sentinel
      aria-labelledby="hero-title"
      className="hero relative -mt-(--header-h) lg:mx-auto lg:mt-0 lg:grid lg:max-w-(--container-site) lg:grid-cols-12 lg:items-center lg:gap-12 lg:px-(--gutter) lg:pt-10 lg:pb-20"
    >
      {slides.length > 0 ? (
        <div className="hero-media absolute inset-0 lg:relative lg:order-2 lg:col-span-7 lg:h-[min(80vh,46rem)]">
          <div
            aria-hidden="true"
            className="absolute -top-6 -right-6 hidden h-2/3 w-2/3 rounded-xl bg-bamboo-100 lg:block"
          />
          <div className="absolute inset-0 overflow-hidden bg-bamboo-900 lg:rounded-xl lg:shadow-lg">
            <HeroSlides slides={slides} />
          </div>
          <div aria-hidden="true" className="hero-scrim absolute inset-0 lg:hidden" />
        </div>
      ) : null}

      <div
        className={`relative z-[1] flex min-h-[100svh] flex-col justify-end px-(--gutter) pt-[calc(var(--header-h)+2rem)] pb-14 lg:order-1 lg:col-span-5 lg:min-h-0 lg:justify-center lg:p-0 ${
          slides.length > 0
            ? 'text-sand-50 lg:text-foreground'
            : 'bg-sand-100 text-foreground lg:bg-transparent'
        }`}
      >
        {kicker ? (
          <p className="text-xs font-semibold tracking-kicker uppercase lg:text-cane-700">
            {kicker}
          </p>
        ) : null}
        <HeroTitle
          id="hero-title"
          className={`${kicker ? 'mt-4' : ''} text-5xl font-medium text-balance lg:text-bamboo-900`}
        >
          {title}
        </HeroTitle>
        {subtitle ? (
          <p className="mt-5 max-w-xl text-lg leading-normal text-pretty opacity-90 lg:text-muted-foreground lg:opacity-100">
            {subtitle}
          </p>
        ) : null}
        {body ? (
          <p className="mt-4 max-w-xl leading-normal opacity-85 lg:text-foreground/80 lg:opacity-100">
            {body}
          </p>
        ) : null}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {whatsappUrl ? (
            <WhatsAppLink href={whatsappUrl} source="hero" className={button.whatsapp}>
              {ctaLabel ?? ui.whatsapp.cta}
            </WhatsAppLink>
          ) : null}
          <div className="lg:hidden">
            <Link
              href={routes.rooms}
              className={`${whatsappUrl ? button.outlineOnDark : button.light} w-full sm:w-auto`}
            >
              {ui.rooms.seeAll}
            </Link>
          </div>
          <div className="hidden lg:block">
            <Link href={routes.rooms} className={whatsappUrl ? button.outline : button.primary}>
              {ui.rooms.seeAll}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
