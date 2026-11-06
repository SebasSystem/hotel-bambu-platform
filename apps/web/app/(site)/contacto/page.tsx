import { Phone } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ContactList, hasContact } from '@/components/site/blocks';
import { MapEmbed } from '@/components/site/map-embed';
import { PageHeader } from '@/components/site/page-header';
import { container } from '@/components/site/styles';
import { WhatsAppLink } from '@/components/site/whatsapp-link';
import { buttonClass } from '@/components/ui/button';
import { cardClass } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { ui } from '@/lib/i18n/es';
import { pageMetadata } from '@/lib/seo/metadata';
import { routes } from '@/lib/public/navigation';
import { getSite } from '@/lib/public/api';
import { fullAddress, mapLinks, telHref } from '@/lib/public/site';
import { whatsAppLink } from '@/lib/public/whatsapp';

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return pageMetadata({
    path: routes.contact,
    siteName: site.hotel.name,
    title: ui.nav.contact,
    description: `Contacta a ${site.hotel.name}: WhatsApp, teléfono, correo y horarios.`,
  });
}

/**
 * Contact (mockup `#contacto`): contact card (rows + "Abrir WhatsApp" and "Llamar") and the map
 * card, `.85fr 1.15fr`. Rows, actions and the map appear only for configured data.
 */
export default async function ContactPage() {
  const site = await getSite();
  const { hotel } = site;
  const whatsappUrl = whatsAppLink(site, { kind: 'general' });
  const links = mapLinks(hotel);

  return (
    <>
      <PageHeader path={routes.contact} title={ui.nav.contact} kicker={null} intro={null} />
      <div className={`${container} grid gap-7 pt-12 pb-[110px] desk:grid-cols-[0.85fr_1.15fr]`}>
        <div className={cardClass('panel')}>
          <Eyebrow className="mb-4">{ui.contact.direct}</Eyebrow>
          <h2 className="mb-7 text-[clamp(2rem,3.4vw,3rem)] text-charcoal">{hotel.name}</h2>
          {hasContact(hotel, whatsappUrl) ? (
            <ContactList hotel={hotel} whatsappUrl={whatsappUrl} />
          ) : (
            <p className="text-muted-foreground">{ui.empty.contact}</p>
          )}
          {whatsappUrl || hotel.phone ? (
            <div className="mt-8 flex flex-wrap gap-3">
              {whatsappUrl ? (
                <WhatsAppLink
                  href={whatsappUrl}
                  source="contact"
                  className={buttonClass('primary')}
                >
                  {ui.whatsapp.open}
                </WhatsAppLink>
              ) : null}
              {hotel.phone ? (
                <a href={telHref(hotel.phone)} className={buttonClass('ghost')}>
                  <Phone aria-hidden="true" strokeWidth={1.5} />
                  {ui.contact.call}
                </a>
              ) : null}
            </div>
          ) : null}
          {whatsappUrl ? (
            <p className="mt-4 text-xs leading-normal text-muted-foreground">
              {ui.whatsapp.external}
            </p>
          ) : null}
        </div>
        {links ? (
          <MapEmbed
            hotelName={hotel.name}
            embedUrl={links.embedUrl}
            directionsUrl={links.directionsUrl}
            address={fullAddress(hotel)}
          />
        ) : (
          <div className={`${cardClass('panel')} flex flex-col justify-end bg-sand`}>
            <p className="text-ink-muted-strong">{ui.empty.location}</p>
            <Link href={routes.rooms} className={`${buttonClass('ghost')} mt-6 self-start`}>
              {ui.rooms.seeAll}
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
