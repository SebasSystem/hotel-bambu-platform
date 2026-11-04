import type { Metadata } from 'next';
import { AmenityChips, ServiceList } from '@/components/site/blocks';
import { PageHeader } from '@/components/site/page-header';
import { container } from '@/components/site/styles';
import { ui } from '@/lib/i18n/es';
import { pageMetadata } from '@/lib/seo/metadata';
import { routes } from '@/lib/public/navigation';
import { getAmenities, getServices, getSite } from '@/lib/public/api';
import { sectionOf } from '@/lib/public/site';

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  const section = sectionOf(site, 'SERVICES');
  return pageMetadata({
    path: routes.services,
    siteName: site.hotel.name,
    title: section?.title ?? ui.nav.services,
    description:
      section?.subtitle ??
      `Servicios y comodidades confirmados de ${site.hotel.name} y lo que incluyen todas las habitaciones.`,
  });
}

export default async function ServicesPage() {
  const [site, services, amenities] = await Promise.all([getSite(), getServices(), getAmenities()]);
  const section = sectionOf(site, 'SERVICES');

  return (
    <>
      <PageHeader
        path={routes.services}
        title={section?.title ?? ui.nav.services}
        kicker={section?.subtitle}
        intro={section?.body}
      />
      <div className={`${container} grid gap-20 py-16`}>
        {services.length > 0 ? (
          <section aria-label={ui.nav.services}>
            <ServiceList services={services} />
          </section>
        ) : (
          <p className="text-lg text-muted-foreground">{ui.empty.generic}</p>
        )}
        {amenities.length > 0 ? (
          <section aria-labelledby="comodidades" className="border-t border-sand-200 pt-14">
            <h2 id="comodidades" className="mb-6 text-3xl font-medium text-bamboo-900">
              {ui.home.amenitiesTitle}
            </h2>
            <AmenityChips amenities={amenities} />
          </section>
        ) : null}
      </div>
    </>
  );
}
