import Link from 'next/link';
import { button, container } from '@/components/site/styles';
import { WhatsAppLink } from '@/components/site/whatsapp-link';
import { ui } from '@/lib/i18n/es';
import { getRooms, getSite } from '@/lib/public/api';
import { routes } from '@/lib/public/navigation';
import { whatsAppLink } from '@/lib/public/whatsapp';

export const metadata = { title: 'Página no encontrada', robots: { index: false, follow: true } };

/** Useful 404 (requirement 19.1): links to the rooms and WhatsApp, inside the site shell. */
export default async function NotFound() {
  const [site, rooms] = await Promise.all([getSite(), getRooms()]);
  const whatsappUrl = whatsAppLink(site, { kind: 'general' });
  const suggestions = rooms.slice(0, 4);

  return (
    <section className={`${container} py-(--section-y)`}>
      <p className="text-xs font-semibold tracking-kicker text-cane-700 uppercase">Error 404</p>
      <h1 className="mt-4 text-4xl font-medium text-bamboo-900">No encontramos esta página</h1>
      <p className="mt-5 max-w-xl text-lg leading-normal text-muted-foreground">
        Es posible que el enlace haya cambiado o que la página ya no esté disponible. Estas opciones
        pueden ayudarte.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={routes.rooms} className={button.primary}>
          {ui.rooms.seeAll}
        </Link>
        {whatsappUrl ? (
          <WhatsAppLink href={whatsappUrl} source="other" className={button.whatsapp} />
        ) : null}
        <Link href={routes.home} className={button.outline}>
          {ui.nav.home}
        </Link>
      </div>
      {suggestions.length > 0 ? (
        <nav aria-labelledby="sugeridas" className="mt-14">
          <h2 id="sugeridas" className="text-2xl font-medium text-bamboo-900">
            {ui.nav.rooms}
          </h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {suggestions.map((room) => (
              <li key={room.slug}>
                <Link
                  href={routes.room(room.slug)}
                  className="font-semibold text-primary underline underline-offset-4"
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
