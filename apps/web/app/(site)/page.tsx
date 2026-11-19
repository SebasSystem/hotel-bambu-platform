import type { Metadata } from 'next';
import Link from 'next/link';
import { ContactCtaLink } from '@/components/site/contact-cta';
import { hasLocation } from '@/components/site/blocks';
import { Hero } from '@/components/site/hero';
import { HotelTours } from '@/components/site/hotel-tours';
import {
  AboutSection,
  CtaPanel,
  GalleryStripSection,
  LocationSection,
  PoliciesSummary,
  ReviewsSection,
  RoomTypesSection,
  TrustStrip,
} from '@/components/site/home-sections';
import { JsonLd } from '@/components/seo/json-ld';
import { buttonClass } from '@/components/ui/button';
import { ui } from '@/lib/i18n/es';
import { hotelJsonLd, websiteJsonLd } from '@/lib/seo/json-ld';
import { pageMetadata } from '@/lib/seo/metadata';
import { homeSeo } from '@/lib/seo/page-seo';
import {
  getFaqs,
  getGallery,
  getNearbyPlaces,
  getPolicies,
  getRoomTypes,
  getSite,
  getSiteImages,
} from '@/lib/public/api';
import { contactCta } from '@/lib/public/cta';
import { routes } from '@/lib/public/navigation';
import { fromRate } from '@/lib/public/rates';
import { publishedRoomTotal, roomTypeFilters } from '@/lib/public/rooms';
import {
  heroTagline,
  homeHeroSlides,
  homeHotelAmenities,
  introText,
  isSectionEnabled,
} from '@/lib/public/site';
import { trustItems } from '@/lib/public/trust';

export async function generateMetadata(): Promise<Metadata> {
  const [site, rooms, images] = await Promise.all([getSite(), getRoomTypes(), getSiteImages()]);
  const { hotel } = site;
  const seo = homeSeo(hotel, rooms, contactCta(site, { kind: 'general' })?.kind ?? null);
  const meta = pageMetadata({
    path: routes.home,
    siteName: hotel.name,
    title: seo.title,
    description: seo.description,
    image: images[0] ?? null,
  });
  return { ...meta, title: { absolute: seo.title } };
}

/**
 * The home introduces the real hotel photograph and optional tours before the room catalogue,
 * verified hotel facts, gallery, location, about, policies, and final contact panel. The layout
 * adds the NAP footer. Admin › Contenido switches sections on or off; headings are code (ADR 0016)
 * and hotel facts come from the API.
 */
export default async function HomePage() {
  const [site, rooms, gallery, nearby, policies, faqs, images] = await Promise.all([
    getSite(),
    getRoomTypes(),
    getGallery(),
    getNearbyPlaces(),
    getPolicies(),
    getFaqs(),
    getSiteImages(),
  ]);
  const { hotel } = site;
  const cta = contactCta(site, { kind: 'general' });
  const roomCount = publishedRoomTotal(rooms);
  const place = [hotel.municipality, hotel.department].filter(Boolean).join(', ') || null;
  const rate = fromRate(rooms);
  const about = isSectionEnabled(site, 'ABOUT') ? introText(hotel.description) : null;
  const aboutMedia =
    gallery.find((item) => item.category === 'COMMON_AREAS')?.media ??
    gallery[0]?.media ??
    rooms[0]?.cover ??
    null;
  const ctaMedia = gallery.at(-1)?.media ?? rooms.at(-1)?.cover ?? null;
  const trust = trustItems({
    hotel,
    roomCount,
    roomKinds: roomTypeFilters(rooms).map((filter) => filter.label),
    amenities: isSectionEnabled(site, 'SERVICES') ? homeHotelAmenities(site) : [],
  });

  return (
    <>
      <JsonLd data={websiteJsonLd(hotel.name)} />
      <JsonLd data={hotelJsonLd(site, rooms, images)} />
      <Hero
        title={hotel.name}
        kicker={place ? ui.home.heroKicker(place) : null}
        subtitle={heroTagline(hotel.tagline, hotel.name) ?? hotel.shortDescription}
        rate={rate?.label ?? null}
        images={homeHeroSlides(site, images)}
        cta={cta}
      />
      {isSectionEnabled(site, 'GALLERY') ? <HotelTours /> : null}
      {isSectionEnabled(site, 'ROOMS') ? (
        <RoomTypesSection
          rooms={rooms}
          roomCount={roomCount}
          ctaFor={(room) => contactCta(site, { kind: 'roomType', name: room.name })}
        />
      ) : null}
      <TrustStrip items={trust} />
      {isSectionEnabled(site, 'GALLERY') ? <GalleryStripSection items={gallery} /> : null}
      {isSectionEnabled(site, 'LOCATION') && hasLocation(hotel) ? (
        <LocationSection hotel={hotel} nearby={nearby} cta={cta} />
      ) : null}
      {about ? (
        <AboutSection
          title={ui.home.aboutTitle(hotel.municipality)}
          text={about}
          media={aboutMedia}
        />
      ) : null}
      {/* Extension point: real guest reviews (Google Business Profile) are not available yet. */}
      <ReviewsSection reviews={[]} />
      {isSectionEnabled(site, 'FAQ') ? (
        <PoliciesSummary hotel={hotel} policies={policies} faqCount={faqs.length} />
      ) : null}
      {isSectionEnabled(site, 'CONTACT') ? (
        <CtaPanel
          eyebrow={ui.closing.kicker}
          title={ui.closing.title}
          text={
            cta?.kind === 'whatsapp'
              ? ui.closing.withWhatsApp(hotel.municipality)
              : cta
                ? ui.closing.withPhone(hotel.municipality)
                : ui.closing.withoutContact
          }
          media={ctaMedia}
          action={
            cta ? (
              <ContactCtaLink
                cta={cta}
                source="contact"
                className={buttonClass('light')}
                whatsappLabel={ui.whatsapp.cta}
              />
            ) : (
              <Link href={routes.rooms} className={buttonClass('light')}>
                {ui.rooms.seeAll}
              </Link>
            )
          }
        />
      ) : null}
    </>
  );
}
