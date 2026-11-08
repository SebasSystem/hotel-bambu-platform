import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { buttonClass } from '@/components/ui/button';
import { Eyebrow } from '@/components/ui/eyebrow';
import { SectionHeading } from '@/components/ui/section-heading';
import { ui } from '@/lib/i18n/es';
import type { ContactCta } from '@/lib/public/cta';
import { galleryLabel } from '@/lib/public/gallery';
import { routes } from '@/lib/public/navigation';
import { napOf } from '@/lib/public/nap';
import { telHref } from '@/lib/public/site';
import type { TrustItem } from '@/lib/public/trust';
import type {
  PublicGalleryItem,
  PublicHotel,
  PublicMedia,
  PublicNearbyPlace,
  PublicPolicy,
  PublicRoomTypeSummary,
} from '@/lib/public/types';
import { IMAGE_SIZES } from '@/lib/public/image-sizes';
import { LocationBlock, TextBlock } from './blocks';
import { ContactCtaLink } from './contact-cta';
import { PhotoGallery } from './photo-gallery';
import { Picture } from './picture';
import { RoomCard } from './room-card';
import { SiteIcon } from './icon';
import { container } from './styles';

/**
 * Home sections in the approved order (owner review 2026-11-08): room types, facts strip,
 * location, about, reviews slot, guest information summary, gallery strip, final CTA. Each one
 * renders only with real content (requirement 4.4); headings are code, facts come from the API.
 */

const section = 'py-[clamp(78px,10vw,150px)]';

/**
 * Verifiable facts after the room types: address, rooms and the hotel amenities. A paper band
 * between the deep-green rooms band and the sand location section, so it needs no borders.
 */
export function TrustStrip({ items }: { items: TrustItem[] }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="datos-title" className="bg-paper">
      <h2 id="datos-title" className="sr-only">
        {ui.home.trustLabel}
      </h2>
      <ul
        className={`${container} grid gap-x-8 py-[clamp(40px,6vw,80px)] tab:grid-cols-2 desk:grid-cols-3`}
      >
        {items.map((item, index) => (
          <li
            key={item.id}
            data-reveal
            style={{ '--i': index } as CSSProperties}
            className="flex items-start gap-4 border-t border-line py-5 first:border-t-0 tab:[&:nth-child(2)]:border-t-0 desk:[&:nth-child(3)]:border-t-0"
          >
            <span className="inline-grid size-11 shrink-0 place-items-center rounded-full bg-green-50 text-green">
              <SiteIcon iconKey={item.iconKey} className="size-5" />
            </span>
            <span>
              <strong className="block leading-snug font-bold text-charcoal">{item.title}</strong>
              {item.text ? (
                <span className="mt-1 block text-sm leading-normal text-ink-muted-strong">
                  {item.text}
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Deep-green band with one card per published room type (replaces the old amenity grid). */
export function RoomTypesSection({
  rooms,
  roomCount,
  ctaFor,
}: {
  rooms: PublicRoomTypeSummary[];
  roomCount: number;
  ctaFor: (room: PublicRoomTypeSummary) => ContactCta | null;
}) {
  if (rooms.length === 0) return null;
  const columns = rooms.length >= 3 ? 'desk:grid-cols-3' : 'desk:grid-cols-2';
  return (
    <section
      aria-labelledby="habitaciones-title"
      data-surface="dark"
      className={`bg-green-900 text-ivory ${section}`}
    >
      <div className={container}>
        <div className="mb-12 flex flex-col gap-6 tab:flex-row tab:items-end tab:justify-between">
          <SectionHeading
            id="habitaciones-title"
            surface="dark"
            eyebrow={roomCount > 0 ? ui.home.roomsKicker(roomCount) : ui.nav.rooms}
            title={ui.home.roomsTitle}
          />
          <Link
            href={routes.rooms}
            className={`${buttonClass('light')} shrink-0 self-start tab:self-auto`}
          >
            {ui.rooms.seeAll}
          </Link>
        </div>
        <ul className={`grid gap-6 tab:grid-cols-2 ${columns}`}>
          {rooms.map((room, index) => (
            <li key={room.slug} className="flex">
              <RoomCard
                room={room}
                index={index}
                cta={ctaFor(room)}
                frame={rooms.length <= 2 ? 'wide' : 'square'}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * "Estamos en Mocoa.": address, phone, nearby places (optional), consent-gated map, the contact
 * CTA and "Cómo llegar" (the location page).
 */
export function LocationSection({
  hotel,
  nearby,
  cta,
}: {
  hotel: PublicHotel;
  nearby: PublicNearbyPlace[];
  cta: ContactCta | null;
}) {
  const phone = napOf(hotel).telephone;
  return (
    <section aria-labelledby="ubicacion-title" className={`bg-sand ${section}`}>
      <div className={container}>
        <SectionHeading
          id="ubicacion-title"
          surface="sand"
          eyebrow={ui.location.kicker}
          title={
            hotel.municipality ? ui.location.title(hotel.municipality) : ui.location.titleFallback
          }
          className="mb-12"
        />
        <LocationBlock hotel={hotel} nearby={nearby} showDetails={false}>
          {phone ? (
            <dl className="mb-7">
              <dt className="detail-label">{ui.contact.phone}</dt>
              <dd>
                <a
                  href={telHref(phone)}
                  className="text-h3 leading-snug font-display text-charcoal underline decoration-sage decoration-2 underline-offset-4 hover:decoration-green"
                >
                  {phone}
                </a>
              </dd>
            </dl>
          ) : null}
          {nearby.length === 0 && cta ? (
            <p className="mb-7 max-w-[36ch] text-muted-foreground">
              {ui.location.askDirections(cta.kind)}
            </p>
          ) : null}
          <div className="mt-auto flex flex-wrap gap-3 pt-2">
            {cta ? (
              <ContactCtaLink
                cta={cta}
                source="location"
                className={buttonClass('primary')}
                whatsappLabel={ui.whatsapp.cta}
                phoneLabel={ui.phone.call}
                ariaLabel={cta.kind === 'phone' ? cta.label : undefined}
              />
            ) : null}
            <Link href={routes.location} className={buttonClass('ghost')}>
              {ui.location.seePage}
              <span className="sr-only"> de {hotel.name}</span>
            </Link>
          </div>
        </LocationBlock>
      </div>
    </section>
  );
}

/** "Sobre nosotros": the hotel's own text (families and business travellers) next to a photo. */
export function AboutSection({
  title,
  text,
  media,
}: {
  title: string;
  text: string;
  media: PublicMedia | null;
}) {
  return (
    <section aria-labelledby="nosotros-title" className={section}>
      <div
        className={`${container} grid items-center gap-[clamp(40px,7vw,110px)] ${media ? 'desk:grid-cols-[1.1fr_0.9fr]' : ''}`}
      >
        <div data-reveal>
          <SectionHeading id="nosotros-title" eyebrow={ui.home.aboutKicker} title={title}>
            <TextBlock
              text={text}
              className="mt-[18px] max-w-[650px] text-lead text-muted-foreground"
            />
          </SectionHeading>
        </div>
        {media ? (
          <div
            data-reveal
            className="relative aspect-[4/5] overflow-hidden rounded-[22px] bg-sand tab:rounded-xl desk:max-h-[640px]"
          >
            <Picture
              media={media}
              sizes={IMAGE_SIZES.aboutPhoto}
              className="absolute inset-0 block size-full"
              imgClassName="size-full object-cover"
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}

/**
 * Guest reviews extension point (research §3 row 6). There is no review source yet (Google
 * Business Profile pending), so the home passes none and nothing renders: no empty UI and no
 * self-serving review markup. Feed real excerpts (with permission) to show the section.
 */
export interface GuestReview {
  id: string;
  quote: string;
  author: string;
  origin: string | null;
  date: string | null;
}

export function ReviewsSection({ reviews }: { reviews: GuestReview[] }) {
  if (reviews.length === 0) return null;
  return (
    <section aria-labelledby="opiniones-title" className={section}>
      <div className={container}>
        <SectionHeading id="opiniones-title" title={ui.home.reviewsKicker} />
        <ul className="mt-12 grid gap-6 tab:grid-cols-2 desk:grid-cols-3">
          {reviews.map((review) => (
            <li key={review.id}>
              <figure className="h-full rounded-lg bg-paper p-7">
                <blockquote className="text-lead text-charcoal">{review.quote}</blockquote>
                <figcaption className="mt-5 text-sm text-muted-foreground">
                  {[review.author, review.origin, review.date].filter(Boolean).join(' · ')}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Policy titles shown on the home card; the page link leads to the rest (owner review 2026-11-08). */
const SUMMARY_POLICIES = 4;

/** Policies at a glance: check-in/out when set, the first policy titles, link to the page. */
export function PoliciesSummary({
  hotel,
  policies,
  faqCount,
}: {
  hotel: Pick<PublicHotel, 'checkInTime' | 'checkOutTime'>;
  policies: PublicPolicy[];
  faqCount: number;
}) {
  const times: [string, string][] = [
    ...(hotel.checkInTime ? [[ui.contact.checkIn, hotel.checkInTime] as [string, string]] : []),
    ...(hotel.checkOutTime ? [[ui.contact.checkOut, hotel.checkOutTime] as [string, string]] : []),
  ];
  if (times.length === 0 && policies.length === 0 && faqCount === 0) return null;
  return (
    // Full section rhythm on both sides: the card must never touch the previous section, whichever
    // home sections are enabled (owner review 2026-11-08).
    <section aria-labelledby="politicas-title" className={`px-(--gutter) ${section}`}>
      <div
        data-reveal
        className="mx-auto grid max-w-[calc(var(--container-site)-2*var(--gutter))] items-center gap-10 rounded-[22px] bg-sand p-[clamp(32px,6vw,80px)] tab:rounded-xl desk:grid-cols-[1fr_1fr] desk:gap-[70px]"
      >
        <div>
          <SectionHeading
            id="politicas-title"
            surface="sand"
            eyebrow={ui.home.policiesKicker}
            title={ui.home.policiesTitle}
          />
          <Link href={routes.policies} className={`${buttonClass('dark')} mt-8`}>
            {ui.home.policiesAll}
          </Link>
        </div>
        <div className="grid gap-6">
          {times.length > 0 ? (
            <dl className="grid grid-cols-2 gap-6">
              {times.map(([label, value]) => (
                <div key={label}>
                  <dt className="detail-label">{label}</dt>
                  <dd className="font-display text-fact leading-none text-green">{value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {policies.length > 0 ? (
            <ul className="grid gap-3">
              {policies.slice(0, SUMMARY_POLICIES).map((policy) => (
                <li
                  key={policy.id}
                  className="flex items-center gap-3.5 rounded-sm bg-white/52 px-[19px] py-4 font-bold text-charcoal"
                >
                  <SiteIcon iconKey="shield-check" className="size-5 shrink-0 text-green" />
                  {policy.title}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function GalleryStripSection({ items }: { items: PublicGalleryItem[] }) {
  if (items.length === 0) return null;
  const tiles = [...items].sort((a, b) => Number(b.featured) - Number(a.featured)).slice(0, 4);
  return (
    <section aria-labelledby="galeria-title" className={section}>
      <div className={container}>
        <div className="mb-12 flex flex-col gap-6 tab:flex-row tab:items-end tab:justify-between">
          <div data-reveal>
            <SectionHeading
              id="galeria-title"
              eyebrow={ui.home.galleryKicker}
              title={ui.home.galleryTitle}
            />
          </div>
          <Link
            href={routes.gallery}
            className={`${buttonClass('ghost')} shrink-0 self-start tab:self-auto`}
          >
            {ui.gallery.seeAll}
          </Link>
        </div>
        <PhotoGallery
          variant="strip"
          images={tiles.map((item) => item.media)}
          captions={tiles.map((item) => galleryLabel(item.category))}
        />
      </div>
    </section>
  );
}

/** Mockup CTA panel: photo behind a green gradient, content bottom-left, one light button. */
export function CtaPanel({
  eyebrow,
  title,
  text,
  media,
  action,
}: {
  eyebrow: string | null;
  title: string;
  text: string;
  media: PublicMedia | null;
  action: ReactNode;
}) {
  return (
    <section
      aria-labelledby="cierre-title"
      className="px-3 pb-[clamp(80px,8vw,120px)] tab:px-(--gutter)"
    >
      <div
        data-surface="dark"
        className="relative mx-auto flex min-h-[440px] max-w-[calc(var(--container-site)-2*var(--gutter))] items-end overflow-hidden rounded-[22px] bg-green-900 p-[clamp(28px,8vw,100px)] text-white tab:rounded-xl"
      >
        {media ? (
          <Picture
            media={media}
            sizes={IMAGE_SIZES.ctaPanel}
            className="absolute inset-0 block size-full"
            imgClassName="size-full object-cover"
            decorative
          />
        ) : null}
        <div aria-hidden="true" className="cta-panel-shade absolute inset-0" />
        <div data-reveal className="relative z-[1] max-w-[620px]">
          {eyebrow ? (
            <Eyebrow tone="onDark" className="mb-4">
              {eyebrow}
            </Eyebrow>
          ) : null}
          <h2 id="cierre-title" className="text-h2 text-balance text-white">
            {title}
          </h2>
          <p className="mt-[18px] text-white/86">{text}</p>
          <div className="mt-7">{action}</div>
        </div>
      </div>
    </section>
  );
}
