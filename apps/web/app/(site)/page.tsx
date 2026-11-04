import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { AboutStory } from '@/components/site/about-story';
import {
  AmenityChips,
  ClosingCta,
  FaqList,
  GalleryTeaser,
  hasLocation,
  LocationBlock,
  RoomTypeCards,
  ServiceList,
} from '@/components/site/blocks';
import { Hero } from '@/components/site/hero';
import { Picture } from '@/components/site/picture';
import { SectionHeading } from '@/components/site/section';
import { container, link } from '@/components/site/styles';
import { ui } from '@/lib/i18n/es';
import { getFaqs, getGallery, getRooms, getSite } from '@/lib/public/api';
import { paragraphs } from '@/lib/public/format';
import { routes } from '@/lib/public/navigation';
import { summarizeRoomTypes } from '@/lib/public/rooms';
import { heroImages, sectionOf } from '@/lib/public/site';
import type { PublicMedia, PublicSection, SectionKey } from '@/lib/public/types';
import { whatsAppLink } from '@/lib/public/whatsapp';

export async function generateMetadata(): Promise<Metadata> {
  const { hotel } = await getSite();
  return {
    title: { absolute: hotel.municipality ? `${hotel.name} · ${hotel.municipality}` : hotel.name },
    description: hotel.shortDescription ?? undefined,
  };
}

/**
 * Narrative home (requirement 4.2, direction A "Refugio sereno"). Sections follow the order and
 * enabled flags of the landing content (admin › Contenido); a section without real content is
 * skipped instead of rendering an empty block (4.4).
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
  const location = [hotel.municipality, hotel.department].filter(Boolean).join(', ') || null;

  const renderers: Partial<Record<SectionKey, (section: PublicSection) => ReactNode>> = {
    ABOUT: (section) => {
      const text = paragraphs(section.body ?? hotel.description);
      if (text.length === 0) return null;
      const photos = [
        section.media,
        ...gallery.filter((item) => item.category === 'COMMON_AREAS').map((item) => item.media),
      ].filter((media): media is PublicMedia => media !== null);
      const images = photos
        .slice(0, Math.max(1, Math.min(text.length, 3)))
        .map((media) => (
          <Picture
            key={media.id}
            media={media}
            sizes="(min-width: 64rem) 40vw, 92vw"
            className="block size-full"
            imgClassName="size-full object-cover"
          />
        ));
      return (
        <section
          key="ABOUT"
          id="nosotros"
          aria-labelledby="nosotros-title"
          className="py-(--section-y)"
        >
          <div className={container}>
            <SectionHeading
              id="nosotros-title"
              kicker={section.subtitle}
              title={section.title ?? hotel.name}
              className="mb-12"
            />
            <AboutStory paragraphs={text} images={images} />
          </div>
        </section>
      );
    },
    ROOMS: (section) => {
      if (rooms.length === 0) return null;
      return (
        <section
          key="ROOMS"
          id="habitaciones"
          aria-labelledby="habitaciones-title"
          className="bg-sand-100 py-(--section-y)"
        >
          <div className={container}>
            <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <SectionHeading
                id="habitaciones-title"
                kicker={section.subtitle ? null : ui.rooms.countLabel(rooms.length)}
                title={section.title ?? ui.nav.rooms}
                intro={section.subtitle ?? section.body}
              />
              <Link href={routes.rooms} className={`${link} shrink-0`}>
                {section.ctaLabel ?? ui.home.roomsAll(rooms.length)}
              </Link>
            </div>
            <RoomTypeCards types={summarizeRoomTypes(rooms)} hasWhatsApp={Boolean(whatsappUrl)} />
          </div>
        </section>
      );
    },
    SERVICES: (section) => {
      if (site.highlightedServices.length === 0 && site.homeAmenities.length === 0) return null;
      return (
        <section
          key="SERVICES"
          id="servicios"
          aria-labelledby="servicios-title"
          className="bg-surface-dark py-(--section-y) text-on-surface-dark"
        >
          <div className={container}>
            <SectionHeading
              id="servicios-title"
              onDark
              kicker={section.subtitle}
              title={section.title ?? ui.nav.services}
              intro={section.body}
              className="mb-14"
            />
            {site.highlightedServices.length > 0 ? (
              <ServiceList services={site.highlightedServices} onDark />
            ) : null}
            {site.homeAmenities.length > 0 ? (
              <div className="mt-16 border-t border-sand-50/15 pt-10">
                <h3 className="mb-5 text-lg font-medium text-sand-50">{ui.home.amenitiesTitle}</h3>
                <AmenityChips amenities={site.homeAmenities} onDark />
              </div>
            ) : null}
            <Link
              href={routes.services}
              className="mt-12 inline-flex text-sm font-semibold text-bamboo-300 underline underline-offset-4 hover:text-sand-50"
            >
              {section.ctaLabel ?? `${ui.nav.services} del hotel`}
            </Link>
          </div>
        </section>
      );
    },
    GALLERY: (section) => {
      if (gallery.length === 0) return null;
      const featured = [...gallery].sort((a, b) => Number(b.featured) - Number(a.featured));
      return (
        <section
          key="GALLERY"
          id="galeria"
          aria-labelledby="galeria-title"
          className="py-(--section-y)"
        >
          <div className={container}>
            <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <SectionHeading
                id="galeria-title"
                kicker={section.subtitle}
                title={section.title ?? ui.nav.gallery}
                intro={section.body}
              />
              <Link href={routes.gallery} className={`${link} shrink-0`}>
                {section.ctaLabel ?? ui.gallery.seeAll}
              </Link>
            </div>
            <GalleryTeaser images={featured.slice(0, 8).map((item) => item.media)} />
          </div>
        </section>
      );
    },
    LOCATION: (section) => {
      if (!hasLocation(hotel)) return null;
      return (
        <section
          key="LOCATION"
          id="ubicacion"
          aria-labelledby="ubicacion-title"
          className="bg-sand-100 py-(--section-y)"
        >
          <div className={container}>
            <SectionHeading
              id="ubicacion-title"
              kicker={section.subtitle ?? location}
              title={section.title ?? ui.nav.location}
              intro={section.body}
              className="mb-12"
            />
            <LocationBlock hotel={hotel} showDetails={false} />
            <Link href={routes.location} className={`${link} mt-10 inline-flex`}>
              {section.ctaLabel ?? ui.map.directions}
            </Link>
          </div>
        </section>
      );
    },
    FAQ: (section) => {
      const selected = faqs.filter((faq) => faq.showOnHome).slice(0, 5);
      if (selected.length === 0) return null;
      return (
        <section
          key="FAQ"
          id="preguntas"
          aria-labelledby="preguntas-title"
          className="py-(--section-y)"
        >
          <div className={`${container} grid gap-12 lg:grid-cols-12`}>
            <div className="lg:col-span-4">
              <SectionHeading
                id="preguntas-title"
                kicker={section.subtitle}
                title={section.title ?? ui.nav.faq}
                intro={section.body}
              />
              <Link href={routes.faq} className={`${link} mt-8 inline-flex`}>
                {section.ctaLabel ?? ui.home.faqAll}
              </Link>
            </div>
            <div className="lg:col-span-8">
              <FaqList faqs={selected} />
            </div>
          </div>
        </section>
      );
    },
  };

  const contact = sectionOf(site, 'CONTACT');

  return (
    <>
      <Hero
        title={hero?.title ?? hotel.name}
        kicker={location}
        subtitle={hero?.subtitle ?? hotel.shortDescription}
        body={hero?.body ?? null}
        ctaLabel={hero?.ctaLabel ?? null}
        images={heroImages(site, gallery, rooms)}
        whatsappUrl={whatsappUrl}
      />
      {site.sections.map((section) => renderers[section.key]?.(section) ?? null)}
      <ClosingCta
        title={
          contact?.title && contact.title !== ui.nav.contact
            ? contact.title
            : ui.closing.title(hotel.name)
        }
        whatsappUrl={whatsappUrl}
        hotel={hotel}
      />
    </>
  );
}
