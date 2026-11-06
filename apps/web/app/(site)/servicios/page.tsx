import type { Metadata } from 'next';
import { FeatureGrid } from '@/components/site/blocks';
import { PageHeader } from '@/components/site/page-header';
import { container } from '@/components/site/styles';
import { SectionHeading } from '@/components/ui/section-heading';
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

/** Services (no mockup page): page hero, then service and amenity cards in the mockup style. */
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
      <div className={`${container} grid gap-[clamp(64px,8vw,110px)] pt-12 pb-[110px]`}>
        {services.length > 0 ? (
          <section aria-label={ui.nav.services}>
            <FeatureGrid items={services} columns={3} />
          </section>
        ) : (
          <p className="text-lg text-muted-foreground">{ui.empty.generic}</p>
        )}
        {amenities.length > 0 ? (
          <section aria-labelledby="comodidades">
            <SectionHeading
              id="comodidades"
              eyebrow={ui.home.amenitiesKicker}
              title={ui.home.amenitiesTitle}
              className="mb-10"
            />
            <FeatureGrid items={amenities} />
          </section>
        ) : null}
      </div>
    </>
  );
}
