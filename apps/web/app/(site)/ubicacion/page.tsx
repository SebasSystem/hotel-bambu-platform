import type { Metadata } from 'next';
import { hasLocation, LocationBlock } from '@/components/site/blocks';
import { PageHeader } from '@/components/site/page-header';
import { button, container } from '@/components/site/styles';
import { WhatsAppLink } from '@/components/site/whatsapp-link';
import { ui } from '@/lib/i18n/es';
import { pageMetadata } from '@/lib/seo/metadata';
import { hotelJsonLd } from '@/lib/seo/json-ld';
import { JsonLd } from '@/components/seo/json-ld';
import { routes } from '@/lib/public/navigation';
import { getRooms, getSite } from '@/lib/public/api';
import { fullAddress, sectionOf } from '@/lib/public/site';
import { whatsAppLink } from '@/lib/public/whatsapp';

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  const address = fullAddress(site.hotel);
  return pageMetadata({
    path: routes.location,
    siteName: site.hotel.name,
    title: 'Ubicación y cómo llegar',
    description: address
      ? `${site.hotel.name}: ${address}. Mapa, indicaciones para llegar y alrededores.`
      : `Ubicación de ${site.hotel.name} e indicaciones para llegar.`,
  });
}

/** Location page (requirements 4.1, 19.3): address, on-demand map, directions, surroundings. */
export default async function LocationPage() {
  const [site, rooms] = await Promise.all([getSite(), getRooms()]);
  const section = sectionOf(site, 'LOCATION');
  const whatsappUrl = whatsAppLink(site, { kind: 'general' });
  const region = [site.hotel.municipality, site.hotel.department].filter(Boolean).join(', ');

  return (
    <>
      <JsonLd data={hotelJsonLd(site, rooms)} />
      <PageHeader
        path={routes.location}
        title={section?.title ?? ui.nav.location}
        kicker={section?.subtitle ?? (region || null)}
        intro={section?.body}
      />
      <div className={`${container} py-16`}>
        {hasLocation(site.hotel) ? (
          <LocationBlock hotel={site.hotel} />
        ) : (
          <div className="max-w-xl">
            <p className="text-lg leading-normal text-muted-foreground">{ui.empty.location}</p>
            {whatsappUrl ? (
              <WhatsAppLink
                href={whatsappUrl}
                source="location"
                className={`${button.whatsapp} mt-6`}
              />
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}
