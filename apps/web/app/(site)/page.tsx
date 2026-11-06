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
  HotelAmenitiesPanel,
  RoomsShowcase,
} from '@/components/site/home-sections';
import { container } from '@/components/site/styles';
import { WhatsAppLink } from '@/components/site/whatsapp-link';
import { JsonLd } from '@/components/seo/json-ld';
import { buttonClass } from '@/components/ui/button';
import { SectionHeading } from '@/components/ui/section-heading';
import { ui } from '@/lib/i18n/es';
import { hotelJsonLd } from '@/lib/seo/json-ld';
import { pageMetadata } from '@/lib/seo/metadata';
import { getFaqs, getGallery, getRoomTypes, getSite } from '@/lib/public/api';
import { homeFacts } from '@/lib/public/facts';
import { routes } from '@/lib/public/navigation';
import { publishedRoomTotal } from '@/lib/public/rooms';
import { heroImages, homeHotelAmenities, introText } from '@/lib/public/site';
import type { SectionKey } from '@/lib/public/types';
import { whatsAppLink } from '@/lib/public/whatsapp';

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  const { hotel } = site;
  const title = hotel.municipality ? `${hotel.name} · ${hotel.municipality}` : hotel.name;
  const meta = pageMetadata({
    path: routes.home,
    siteName: hotel.name,
    title,
    // Generic fallback until the hotel writes its short description (no invented facts).
    description:
      hotel.shortDescription ??
      `${hotel.name}: habitaciones, comodidades, ubicación y contacto directo.`,
    image: site.heroSlides[0]?.media ?? null,
  });
  return { ...meta, title: { absolute: title } };
}

/**
 * Home in the mockup order (spec §4): hero carousel, intro + fact stack, deep-green rooms band,
 * amenities, services panel, gallery strip, CTA panel. Sections follow the order and enabled
 * flags of the landing content (admin › Contenido) and are skipped without real content (4.4).
 * Headings are code (ADR 0016); the copy comes from the hotel profile. No quick date search and no
 * booking drawer (owner decision): every CTA goes to WhatsApp.
 */
export default async function HomePage() {
  const [site, rooms, gallery, faqs] = await Promise.all([
    getSite(),
    getRoomTypes(),
    getGallery(),
    getFaqs(),
  ]);
  const { hotel } = site;
  const whatsappUrl = whatsAppLink(site, { kind: 'general' });
  const roomCount = publishedRoomTotal(rooms);
  const region = [hotel.municipality, hotel.department].filter(Boolean).join(' · ') || null;
  const slides = heroImages(site, gallery, rooms);

  const renderers: Partial<Record<SectionKey, () => ReactNode>> = {
    ABOUT: () => {
      // Owner feedback: no about text, no intro (the facts alone read as filler).
      const text = introText(hotel.description);
      if (!text) return null;
      const facts = homeFacts(roomCount, homeHotelAmenities(site));
      return (
        <HomeIntro
          key="ABOUT"
          eyebrow={region}
          title={hotel.name}
          text={text}
          facts={facts}
          link={null}
        />
      );
    },
    ROOMS: () => (
      <RoomsShowcase
        key="ROOMS"
        title={ui.nav.rooms}
        rooms={rooms}
        roomCount={roomCount}
        whatsappUrl={
          rooms[0] ? whatsAppLink(site, { kind: 'roomType', name: rooms[0].name }) : null
        }
      />
    ),
    SERVICES: () => (
      <div key="SERVICES">
        <AmenitiesSection amenities={site.homeAmenities} />
        <HotelAmenitiesPanel
          eyebrow={null}
          title={ui.home.hotelAmenitiesTitle}
          body={null}
          amenities={homeHotelAmenities(site)}
        />
      </div>
    ),
    GALLERY: () => (
      <GalleryStripSection
        key="GALLERY"
        eyebrow={ui.home.galleryKicker}
        title={ui.nav.gallery}
        intro={null}
        ctaLabel={null}
        items={gallery}
      />
    ),
    LOCATION: () => {
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
                eyebrow={region}
                title={ui.nav.location}
              />
              <Link href={routes.location} className={`${buttonClass('ghost')} shrink-0`}>
                {ui.map.directions}
              </Link>
            </div>
            <LocationBlock hotel={hotel} showDetails={false} />
          </div>
        </section>
      );
    },
    FAQ: () => {
      const selected = faqs.filter((faq) => faq.showOnHome).slice(0, 5);
      if (selected.length === 0) return null;
      return (
        <section key="FAQ" aria-labelledby="preguntas-title" className="py-(--section-y)">
          <div className={`${container} grid gap-12 desk:grid-cols-[0.9fr_1.1fr]`}>
            <div>
              <SectionHeading id="preguntas-title" title={ui.nav.faq} />
              <Link href={routes.faq} className={`${buttonClass('ghost')} mt-8`}>
                {ui.home.faqAll}
              </Link>
            </div>
            <FaqList faqs={selected} />
          </div>
        </section>
      );
    },
  };

  const ctaMedia = gallery.at(-1)?.media ?? rooms.at(-1)?.cover ?? null;

  return (
    <>
      <JsonLd data={hotelJsonLd(site, rooms)} />
      <Hero
        title={hotel.name}
        kicker={region}
        subtitle={hotel.tagline ?? hotel.shortDescription}
        ctaLabel={null}
        images={slides}
        whatsappUrl={whatsappUrl}
      />
      {site.sections.map((section) => renderers[section.key]?.() ?? null)}
      <CtaPanel
        eyebrow={ui.nav.contact}
        title={ui.closing.title(hotel.name)}
        text={whatsappUrl ? ui.closing.withWhatsApp : ui.closing.withoutWhatsApp}
        media={ctaMedia}
        action={
          whatsappUrl ? (
            <WhatsAppLink href={whatsappUrl} source="contact" className={buttonClass('light')}>
              {ui.whatsapp.cta}
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
