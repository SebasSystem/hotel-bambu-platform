import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { FaqList, hasLocation, LocationBlock } from '@/components/site/blocks';
import { Hero } from '@/components/site/hero';
import {
  AmenitiesSection,
  CtaPanel,
  GalleryStripSection,
  HomeIntro,
  RoomsShowcase,
  ServicesPanel,
} from '@/components/site/home-sections';
import { container } from '@/components/site/styles';
import { WhatsAppLink } from '@/components/site/whatsapp-link';
import { JsonLd } from '@/components/seo/json-ld';
import { buttonClass } from '@/components/ui/button';
import { SectionHeading } from '@/components/ui/section-heading';
import { ui } from '@/lib/i18n/es';
import { hotelJsonLd } from '@/lib/seo/json-ld';
import { pageMetadata } from '@/lib/seo/metadata';
import { getFaqs, getGallery, getRooms, getSite } from '@/lib/public/api';
import { homeFacts } from '@/lib/public/facts';
import { routes } from '@/lib/public/navigation';
import { heroImages, sectionOf } from '@/lib/public/site';
import type { PublicSection, SectionKey } from '@/lib/public/types';
import { whatsAppLink } from '@/lib/public/whatsapp';

export async function generateMetadata(): Promise<Metadata> {
  const { hotel } = await getSite();
  const title = hotel.municipality ? `${hotel.name} · ${hotel.municipality}` : hotel.name;
  const meta = pageMetadata({
    path: routes.home,
    siteName: hotel.name,
    title,
    // Generic fallback until the hotel writes its short description (no invented facts).
    description:
      hotel.shortDescription ??
      `${hotel.name}: habitaciones, servicios, ubicación y contacto directo por WhatsApp.`,
    image: hotel.hero,
  });
  return { ...meta, title: { absolute: title } };
}

/**
 * Home in the mockup order (spec §4): hero carousel, intro + fact stack, deep-green rooms band,
 * amenities, services panel, gallery strip, CTA panel. Sections follow the order and enabled
 * flags of the landing content (admin › Contenido) and are skipped without real content (4.4).
 * No quick date search and no booking drawer (owner decision): every CTA goes to WhatsApp.
 */
export default async function HomePage() {
  const [site, rooms, gallery, faqs] = await Promise.all([
    getSite(),
    getRooms(),
    getGallery(),
    getFaqs(),
  ]);
  const { hotel } = site;
  const whatsappUrl = whatsAppLink(site, { kind: 'general' });
  const hero = sectionOf(site, 'HERO');
  const contact = sectionOf(site, 'CONTACT');
  const region = [hotel.municipality, hotel.department].filter(Boolean).join(' · ') || null;
  const slides = heroImages(site, gallery, rooms);

  const renderers: Partial<Record<SectionKey, (section: PublicSection) => ReactNode>> = {
    ABOUT: (section) => {
      const text = section.body ?? hotel.description;
      const facts = homeFacts(rooms.length, site.highlightedServices);
      if (!text && facts.length === 0) return null;
      return (
        <HomeIntro
          key="ABOUT"
          eyebrow={section.subtitle ?? region}
          title={section.title ?? hotel.name}
          text={text}
          facts={facts}
          link={null}
        />
      );
    },
    ROOMS: (section) => (
      <RoomsShowcase
        key="ROOMS"
        title={section.title ?? ui.nav.rooms}
        intro={section.subtitle ?? section.body}
        ctaLabel={section.ctaLabel}
        rooms={rooms}
        whatsappUrl={rooms[0] ? whatsAppLink(site, { kind: 'room', name: rooms[0].name }) : null}
      />
    ),
    SERVICES: (section) => (
      <div key="SERVICES">
        <AmenitiesSection amenities={site.homeAmenities} />
        <ServicesPanel
          eyebrow={section.subtitle}
          title={section.title ?? ui.nav.services}
          body={section.body}
          services={site.highlightedServices}
        />
      </div>
    ),
    GALLERY: (section) => (
      <GalleryStripSection
        key="GALLERY"
        eyebrow={section.subtitle ?? ui.home.galleryKicker}
        title={section.title ?? ui.nav.gallery}
        intro={section.body}
        ctaLabel={section.ctaLabel}
        items={gallery}
      />
    ),
    LOCATION: (section) => {
      if (!hasLocation(hotel)) return null;
      return (
        <section
          key="LOCATION"
          aria-labelledby="ubicacion-title"
          className="bg-sand py-(--section-y)"
        >
          <div className={container}>
            <div className="mb-12 flex flex-col gap-6 tab:flex-row tab:items-end tab:justify-between">
              <SectionHeading
                id="ubicacion-title"
                surface="sand"
                eyebrow={section.subtitle ?? region}
                title={section.title ?? ui.nav.location}
                intro={section.body}
              />
              <Link href={routes.location} className={`${buttonClass('ghost')} shrink-0`}>
                {section.ctaLabel ?? ui.map.directions}
              </Link>
            </div>
            <LocationBlock hotel={hotel} showDetails={false} />
          </div>
        </section>
      );
    },
    FAQ: (section) => {
      const selected = faqs.filter((faq) => faq.showOnHome).slice(0, 5);
      if (selected.length === 0) return null;
      return (
        <section key="FAQ" aria-labelledby="preguntas-title" className="py-(--section-y)">
          <div className={`${container} grid gap-12 desk:grid-cols-[0.9fr_1.1fr]`}>
            <div>
              <SectionHeading
                id="preguntas-title"
                eyebrow={section.subtitle}
                title={section.title ?? ui.nav.faq}
                intro={section.body}
              />
              <Link href={routes.faq} className={`${buttonClass('ghost')} mt-8`}>
                {section.ctaLabel ?? ui.home.faqAll}
              </Link>
            </div>
            <FaqList faqs={selected} />
          </div>
        </section>
      );
    },
  };

  const ctaMedia =
    contact?.media ?? hotel.hero ?? gallery.at(-1)?.media ?? rooms.at(-1)?.cover ?? null;

  return (
    <>
      <JsonLd data={hotelJsonLd(site, rooms)} />
      <Hero
        title={hero?.title ?? hotel.name}
        kicker={region}
        subtitle={hero?.subtitle ?? hotel.shortDescription}
        ctaLabel={hero?.ctaLabel ?? null}
        images={slides}
        whatsappUrl={whatsappUrl}
      />
      {site.sections.map((section) => renderers[section.key]?.(section) ?? null)}
      <CtaPanel
        eyebrow={contact?.subtitle ?? ui.nav.contact}
        title={
          contact?.title && contact.title !== ui.nav.contact
            ? contact.title
            : ui.closing.title(hotel.name)
        }
        text={contact?.body ?? (whatsappUrl ? ui.closing.withWhatsApp : ui.closing.withoutWhatsApp)}
        media={ctaMedia}
        action={
          whatsappUrl ? (
            <WhatsAppLink href={whatsappUrl} source="contact" className={buttonClass('light')}>
              {contact?.ctaLabel ?? ui.whatsapp.cta}
            </WhatsAppLink>
          ) : (
            <Link href={routes.rooms} className={buttonClass('light')}>
              {ui.rooms.seeAll}
            </Link>
          )
        }
      />
    </>
  );
}
