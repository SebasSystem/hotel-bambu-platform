import Link from 'next/link';
import { button, container } from '@/components/site/styles';
import { ui } from '@/lib/i18n/es';
import { routes } from '@/lib/public/navigation';

/** Basic 404 inside the site shell (T7 adds WhatsApp and suggested rooms, requirement 19.1). */
export default function NotFound() {
  return (
    <section className={`${container} py-(--section-y)`}>
      <p className="text-xs font-semibold tracking-kicker text-cane-700 uppercase">Error 404</p>
      <h1 className="mt-4 text-4xl font-medium text-bamboo-900">No encontramos esta página</h1>
      <p className="mt-5 max-w-xl text-lg leading-normal text-muted-foreground">
        Es posible que el enlace haya cambiado o que la página ya no esté disponible.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={routes.rooms} className={button.primary}>
          {ui.rooms.seeAll}
        </Link>
        <Link href={routes.home} className={button.outline}>
          {ui.nav.home}
        </Link>
      </div>
    </section>
  );
}
