import Link from 'next/link';
import { container } from '@/components/site/styles';
import { buttonClass } from '@/components/ui/button';
import { Eyebrow } from '@/components/ui/eyebrow';
import { ContactCtaLink } from '@/components/site/contact-cta';
import { ui } from '@/lib/i18n/es';
import { getRoomTypes, getSite } from '@/lib/public/api';
import { contactCta } from '@/lib/public/cta';
import { routes } from '@/lib/public/navigation';

export const metadata = { title: 'Página no encontrada', robots: { index: false, follow: true } };

/**
 * Useful 404 (requirement 19.1), `noindex`, inside the site shell: the rooms, the contact CTA
 * (WhatsApp, else the phone call), the main pages and every room type, with descriptive links.
 */
export default async function NotFound() {
  const [site, rooms] = await Promise.all([getSite(), getRoomTypes()]);
  const cta = contactCta(site, { kind: 'general' });
  const suggestions = rooms.slice(0, 4);

  return (
    <section className={`${container} py-(--section-y)`}>
      <Eyebrow>Error 404</Eyebrow>
      <h1 className="mt-4 text-display-page text-balance text-charcoal">
        No encontramos esta página
      </h1>
      <p className="mt-5 max-w-xl text-lg leading-normal text-muted-foreground">
        Es posible que el enlace haya cambiado o que la página ya no esté disponible. Estas opciones
        pueden ayudarte.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={routes.rooms} className={buttonClass('primary')}>
          {ui.rooms.seeAll}
        </Link>
        {cta ? <ContactCtaLink cta={cta} source="other" className={buttonClass('ghost')} /> : null}
      </div>
      <nav aria-labelledby="secciones" className="mt-14">
        <h2 id="secciones" className="text-h3 text-charcoal">
          Secciones del sitio
        </h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {[
            { href: routes.home, label: `${ui.nav.home}: ${site.hotel.name}` },
            { href: routes.location, label: ui.pages.location },
            { href: routes.gallery, label: ui.pages.gallery },
            { href: routes.policies, label: ui.pages.policies },
          ].map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="font-bold text-green underline decoration-sage decoration-2 underline-offset-4 hover:decoration-green"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {suggestions.length > 0 ? (
        <nav aria-labelledby="sugeridas" className="mt-14">
          <h2 id="sugeridas" className="text-h3 text-charcoal">
            {ui.nav.rooms}
          </h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {suggestions.map((room) => (
              <li key={room.slug}>
                <Link
                  href={routes.room(room.slug)}
                  className="font-bold text-green underline decoration-sage decoration-2 underline-offset-4 hover:decoration-green"
                >
                  {room.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </section>
  );
}
