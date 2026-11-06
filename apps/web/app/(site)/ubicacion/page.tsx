import type { Metadata } from 'next';
import { ContactList, hasContact, hasLocation, LocationBlock } from '@/components/site/blocks';
import { ContactCtaLink } from '@/components/site/contact-cta';
import { PageHeader } from '@/components/site/page-header';
import { Picture } from '@/components/site/picture';
import { container } from '@/components/site/styles';
import { JsonLd } from '@/components/seo/json-ld';
import { buttonClass } from '@/components/ui/button';
import { cardClass } from '@/components/ui/card';
import { SectionHeading } from '@/components/ui/section-heading';
import { ui } from '@/lib/i18n/es';
import { hotelJsonLd } from '@/lib/seo/json-ld';
import { pageMetadata } from '@/lib/seo/metadata';
import { locationSeo } from '@/lib/seo/page-seo';
import { getNearbyPlaces, getRoomTypes, getSite, getSiteImages } from '@/lib/public/api';
import { contactCta } from '@/lib/public/cta';
import { routes } from '@/lib/public/navigation';
import { telHref } from '@/lib/public/site';

export async function generateMetadata(): Promise<Metadata> {
  const [site, nearby, images] = await Promise.all([getSite(), getNearbyPlaces(), getSiteImages()]);
  const cta = contactCta(site, { kind: 'general' });
  const seo = locationSeo(site.hotel, nearby.length, cta?.kind ?? null);
  const meta = pageMetadata({
    path: routes.location,
    siteName: site.hotel.name,
    title: seo.title,
    description: seo.description,
    image: images[0] ?? null,
  });
  return { ...meta, title: { absolute: seo.title } };
}

/**
 * "Ubicación y cómo llegar" (research §4, C3: `/contacto` merged here with a 301): "Estamos en
 * Mocoa." with the address, nearby places, directions, contact rows and the consent-gated map,
 * then the contact panel ("Cuéntanos cuándo vienes a Mocoa.") with WhatsApp or the phone call.
 */
export default async function LocationPage() {
  const [site, rooms, nearby, images] = await Promise.all([
    getSite(),
    getRoomTypes(),
    getNearbyPlaces(),
    getSiteImages(),
  ]);
  const { hotel } = site;
  const cta = contactCta(site, { kind: 'general' });
  const whatsappUrl = cta?.kind === 'whatsapp' ? cta.href : null;
  const city = hotel.municipality;
  const region = [hotel.municipality, hotel.department].filter(Boolean).join(' · ');
  const photo = images[1] ?? images[0] ?? null;

  return (
    <>
      <JsonLd data={hotelJsonLd(site, rooms, images)} />
      <PageHeader
        path={routes.location}
        title={ui.pages.location}
        kicker={region || null}
        intro={null}
      />

      <section aria-labelledby="donde-title" className={`${container} pt-[clamp(48px,6vw,80px)]`}>
        <SectionHeading
          id="donde-title"
          eyebrow={ui.location.kicker}
          title={city ? ui.location.title(city) : ui.location.titleFallback}
          className="mb-10"
        />
        {hasLocation(hotel) || nearby.length > 0 ? (
          <LocationBlock hotel={hotel} nearby={nearby}>
            {hasContact(hotel, whatsappUrl) ? (
              <ContactList hotel={hotel} whatsappUrl={whatsappUrl} showAddress={false} />
            ) : null}
          </LocationBlock>
        ) : (
          <p className={`${cardClass('panel')} max-w-2xl text-lg text-muted-foreground`}>
            {ui.empty.location}
          </p>
        )}
      </section>

      <section
        aria-labelledby="contacto-title"
        className={`${container} pt-[clamp(56px,7vw,96px)] pb-[110px]`}
      >
        <div className="grid items-stretch gap-10 rounded-[22px] bg-sand p-[clamp(28px,5vw,64px)] tab:rounded-xl desk:grid-cols-[1fr_1fr] desk:gap-16">
          <div className="self-center">
            <SectionHeading
              id="contacto-title"
              surface="sand"
              eyebrow={ui.closing.kicker}
              title={city ? ui.location.contactTitle(city) : ui.location.contactTitleFallback}
              intro={ui.closing.title}
            />
            {cta ? (
              <div className="mt-8 flex flex-wrap gap-3">
                <ContactCtaLink
                  cta={cta}
                  source="location"
                  className={buttonClass('primary')}
                  whatsappLabel={ui.whatsapp.open}
                />
                {cta.kind === 'whatsapp' && hotel.phone ? (
                  <a href={telHref(hotel.phone)} className={buttonClass('ghost')}>
                    {ui.contact.call}
                  </a>
                ) : null}
              </div>
            ) : null}
            <p className="mt-4 max-w-[480px] text-xs leading-normal text-ink-muted-strong">
              {cta?.kind === 'whatsapp' ? ui.whatsapp.external : ui.rooms.confirm}
            </p>
          </div>
          {photo ? (
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-paper desk:aspect-auto desk:h-full desk:min-h-[360px]">
              <Picture
                media={photo}
                sizes="(min-width: 62.5rem) 45vw, 92vw"
                className="absolute inset-0 block size-full"
                imgClassName="size-full object-cover"
              />
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
