import Link from 'next/link';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { buttonClass } from '@/components/ui/button';
import { routes } from '@/lib/public/navigation';
import type { PublicMedia } from '@/lib/public/types';
import type { ContactCta } from '@/lib/public/cta';
import { ContactCtaLink } from './contact-cta';
import { Picture } from './picture';

interface HeroProps {
  title: string;
  kicker: string | null;
  subtitle: string | null;
  rate: string | null;
  images: PublicMedia[];
  cta: ContactCta | null;
}

/** A still photograph introduces the real hotel; tours start only on request. */
export function Hero({ title, kicker, subtitle, rate, images, cta }: HeroProps) {
  const photo = images[0];
  return (
    <section id="inicio" data-fab-sentinel aria-labelledby="hero-title" className="hotel-intro">
      {photo ? (
        <figure className="hotel-intro-photo">
          <Picture
            media={photo}
            priority
            sizes="(min-width: 1800px) 1800px, 100vw"
            className="block size-full"
            imgClassName="size-full object-cover"
          />
          <div className="hotel-intro-copy">
            {kicker ? <p className="hotel-intro-kicker">{kicker}</p> : null}
            <h1 id="hero-title">{title}</h1>
            <p className="hotel-intro-subtitle">
              {subtitle || 'Conoce nuestros espacios y encuentra tu próxima estancia en Mocoa.'}
            </p>
            {rate ? (
              <p data-testid="hero-rate" className="hotel-intro-rate">
                {rate}
              </p>
            ) : null}
            <div className="hotel-intro-actions">
              <Link href={routes.rooms} className={buttonClass('light')}>
                Ver habitaciones <ArrowUpRight aria-hidden="true" className="size-4" />
              </Link>
              {cta ? (
                <ContactCtaLink
                  cta={cta}
                  source="hero"
                  className={buttonClass('ghostOnDark')}
                  whatsappLabel="Consultar disponibilidad"
                  phoneLabel="Llamar al hotel"
                />
              ) : null}
            </div>
            <a href="#recorridos" className="hotel-intro-discover" aria-label="Conoce el hotel">
              <ArrowDown aria-hidden="true" className="size-4" />
            </a>
          </div>
          <figcaption>
            <span>Así es Bambú Plaza</span>
            <Link href={routes.gallery}>
              Ver todas las fotos <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
          </figcaption>
        </figure>
      ) : null}
      {!photo ? (
        <div className="hotel-intro-copy hotel-intro-fallback">
          {kicker ? <p className="hotel-intro-kicker">{kicker}</p> : null}
          <h1 id="hero-title">{title}</h1>
          <p className="hotel-intro-subtitle">
            {subtitle || 'Conoce nuestros espacios y encuentra tu próxima estancia en Mocoa.'}
          </p>
          <div className="hotel-intro-actions">
            <Link href={routes.rooms} className={buttonClass('primary')}>
              Ver habitaciones <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
            {cta ? (
              <ContactCtaLink
                cta={cta}
                source="hero"
                className={buttonClass('ghost')}
                whatsappLabel="Consultar disponibilidad"
                phoneLabel="Llamar al hotel"
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
