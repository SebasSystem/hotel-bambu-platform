import type { Metadata } from 'next';
import { hasLocation, LocationBlock } from '@/components/site/blocks';
import { PageHeader } from '@/components/site/page-header';
import { container } from '@/components/site/styles';
import { WhatsAppLink } from '@/components/site/whatsapp-link';
import { JsonLd } from '@/components/seo/json-ld';
import { buttonClass } from '@/components/ui/button';
import { cardClass } from '@/components/ui/card';
import { ui } from '@/lib/i18n/es';
import { pageMetadata } from '@/lib/seo/metadata';
import { hotelJsonLd } from '@/lib/seo/json-ld';
import { routes } from '@/lib/public/navigation';
import { getRoomTypes, getSite } from '@/lib/public/api';
import { fullAddress } from '@/lib/public/site';
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

/** Location (requirements 4.1, 19.3): address and directions card plus the on-demand map card. */
export default async function LocationPage() {
  const [site, rooms] = await Promise.all([getSite(), getRoomTypes()]);
  const whatsappUrl = whatsAppLink(site, { kind: 'general' });
  const region = [site.hotel.municipality, site.hotel.department].filter(Boolean).join(' · ');

  return (
    <>
      <JsonLd data={hotelJsonLd(site, rooms)} />
      <PageHeader
        path={routes.location}
        title={ui.nav.location}
        kicker={region || null}
        intro={null}
      />
      <div className={`${container} pt-12 pb-[110px]`}>
        {hasLocation(site.hotel) ? (
          <LocationBlock hotel={site.hotel} />
        ) : (
          <div className={`${cardClass('panel')} max-w-2xl`}>
            <p className="text-lg text-muted-foreground">{ui.empty.location}</p>
            {whatsappUrl ? (
              <WhatsAppLink
                href={whatsappUrl}
                source="location"
                className={`${buttonClass('primary')} mt-6`}
              />
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}
