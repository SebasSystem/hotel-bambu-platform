import Link from 'next/link';
import type { ReactNode } from 'react';
import { buttonClass } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Eyebrow } from '@/components/ui/eyebrow';
import { SectionHeading } from '@/components/ui/section-heading';
import { ui } from '@/lib/i18n/es';
import type { HomeFact } from '@/lib/public/facts';
import { formatRoomPrice } from '@/lib/public/format';
import { galleryLabel } from '@/lib/public/gallery';
import { routes } from '@/lib/public/navigation';
import { roomTypeLabel } from '@/lib/public/rooms';
import type {
  PublicAmenity,
  PublicGalleryItem,
  PublicMedia,
  PublicRoomSummary,
  PublicService,
} from '@/lib/public/types';
import { FeatureGrid, IconBadge, TextBlock } from './blocks';
import { PhotoGallery } from './photo-gallery';
import { Picture } from './picture';
import { SiteIcon } from './icon';
import { container } from './styles';
import { WhatsAppLink } from './whatsapp-link';

/** Home sections in the mockup order (spec §4). Each renders only with real content. */

const section = 'py-[clamp(78px,10vw,150px)]';

export function HomeIntro({
  eyebrow,
  title,
  text,
  facts,
  link,
}: {
  eyebrow: string | null;
  title: string;
  text: string | null;
  facts: HomeFact[];
  link: { href: string; label: string } | null;
}) {
  return (
    <section aria-labelledby="intro-title" className={section}>
      <div
        className={`${container} grid items-start gap-[clamp(40px,8vw,120px)] desk:grid-cols-[0.9fr_1.1fr]`}
      >
        <div data-reveal>
          <SectionHeading id="intro-title" eyebrow={eyebrow} title={title}>
            <TextBlock
              text={text}
              className="mt-[18px] max-w-[650px] text-lead text-muted-foreground"
            />
          </SectionHeading>
          {link ? (
            <Link href={link.href} className={`${buttonClass('ghost')} mt-7`}>
              {link.label}
            </Link>
          ) : null}
        </div>
        {facts.length > 0 ? (
          <ul data-reveal className="border-t border-line">
            {facts.map((fact) => (
              <li key={fact.id} className="fact">
                {fact.value ? (
                  <span className="font-display text-fact leading-none text-green">
                    {fact.value}
                  </span>
                ) : (
                  <IconBadge iconKey={fact.iconKey} className="self-center" />
                )}
                <span>
                  <span
                    className={`block ${fact.value ? 'text-muted-foreground' : 'font-bold text-charcoal'}`}
                  >
                    {fact.label}
                  </span>
                  {fact.note ? (
                    <span className="mt-1 block text-sm text-muted-foreground">{fact.note}</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

export function RoomsShowcase({
  title,
  intro,
  rooms,
  ctaLabel,
  whatsappUrl,
}: {
  title: string;
  intro: string | null;
  rooms: PublicRoomSummary[];
  ctaLabel: string | null;
  whatsappUrl: string | null;
}) {
  const room = rooms[0];
  if (!room) return null;
  const price = formatRoomPrice(room);
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
            eyebrow={ui.rooms.countLabel(rooms.length)}
            title={title}
            intro={intro}
          />
          <Link
            href={routes.rooms}
            className={`${buttonClass('light')} shrink-0 self-start tab:self-auto`}
          >
            {ctaLabel ?? ui.home.roomsAll(rooms.length)}
          </Link>
        </div>

        <article
          data-reveal
          className="grid overflow-hidden rounded-[22px] bg-paper text-charcoal tab:rounded-xl desk:min-h-[560px] desk:grid-cols-[1.25fr_0.75fr]"
        >
          <div className="relative min-h-[420px] bg-sand">
            {room.cover ? (
              <Picture
                media={room.cover}
                sizes="(min-width: 62.5rem) 60vw, 100vw"
                className="absolute inset-0 block size-full"
                imgClassName="size-full object-cover"
                objectPosition="50% 55%"
              />
            ) : null}
          </div>
          <div className="flex flex-col justify-center p-[clamp(30px,5vw,64px)]">
            <p className="mb-3 text-[0.78rem] font-bold tracking-[0.15em] text-green uppercase">
              {ui.rooms.featured} · {roomTypeLabel(room.type)}
            </p>
            <h3 className="text-feature text-balance text-charcoal">{room.name}</h3>
            {room.shortDescription ? (
              <p className="mt-4 text-muted-foreground">{room.shortDescription}</p>
            ) : null}
            <ul className="mt-6 flex flex-wrap gap-2">
              <li>
                <Chip>{ui.rooms.upTo(room.capacity)}</Chip>
              </li>
              {room.amenities.slice(0, 4).map((amenity) => (
                <li key={amenity.name}>
                  <Chip>
                    <SiteIcon iconKey={amenity.iconKey} className="text-green" />
                    {amenity.name}
                  </Chip>
                </li>
              ))}
            </ul>
            {price ? (
              <p className="mt-6 rounded-sm bg-ivory p-4 text-sm text-muted-foreground">
                <span className="sr-only">{price.summary}</span>
                <span aria-hidden="true">
                  {ui.rooms.from}{' '}
                  <span className="font-display text-2xl text-charcoal">{price.amount}</span>{' '}
                  {price.unit} · {price.taxes}
                </span>
              </p>
            ) : null}
            <div className="mt-7 flex flex-wrap gap-2.5">
              <Link href={routes.room(room.slug)} className={buttonClass('ghost')}>
                {ui.rooms.seeDetail}
                <span className="sr-only"> {room.name}</span>
              </Link>
              {whatsappUrl ? (
                <WhatsAppLink
                  href={whatsappUrl}
                  source="room_card"
                  entityId={room.slug}
                  className={buttonClass('primary')}
                >
                  {ui.whatsapp.room}
                </WhatsAppLink>
              ) : null}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

export function AmenitiesSection({ amenities }: { amenities: PublicAmenity[] }) {
  if (amenities.length === 0) return null;
  return (
    <section aria-labelledby="comodidades-title" className={section}>
      <div className={container}>
        <div data-reveal className="mb-12">
          <SectionHeading
            id="comodidades-title"
            eyebrow={ui.home.amenitiesKicker}
            title={ui.home.amenitiesTitle}
          />
        </div>
        <FeatureGrid items={amenities} />
      </div>
    </section>
  );
}

/** Mockup sustainability panel: sand, 32 px radius, heading on the left, service points right. */
export function ServicesPanel({
  eyebrow,
  title,
  body,
  services,
}: {
  eyebrow: string | null;
  title: string;
  body: string | null;
  services: PublicService[];
}) {
  if (services.length === 0) return null;
  return (
    <section
      aria-labelledby="servicios-title"
      className="px-(--gutter) pb-[clamp(78px,10vw,150px)]"
    >
      <div
        data-reveal
        className="mx-auto grid max-w-[calc(var(--container-site)-2*var(--gutter))] items-center gap-10 rounded-[22px] bg-sand p-[clamp(32px,7vw,92px)] tab:rounded-xl desk:grid-cols-[1.1fr_0.9fr] desk:gap-[70px]"
      >
        <div>
          <SectionHeading id="servicios-title" surface="sand" eyebrow={eyebrow} title={title} />
          <TextBlock text={body} className="mt-[18px] max-w-[560px] text-ink-muted-strong" />
          <Link href={routes.services} className={`${buttonClass('ghost')} mt-7`}>
            {ui.home.servicesLink}
          </Link>
        </div>
        <ul className="grid gap-3">
          {services.map((service) => (
            <li
              key={service.id}
              className="flex items-start gap-3.5 rounded-sm bg-white/52 p-[19px]"
            >
              <SiteIcon
                iconKey={service.iconKey}
                className="mt-0.5 size-[1.3rem] shrink-0 text-green"
              />
              <span>
                <strong className="block font-bold text-charcoal">{service.name}</strong>
                {service.description ? (
                  <span className="mt-0.5 block text-sm text-ink-muted-strong">
                    {service.description}
                  </span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function GalleryStripSection({
  eyebrow,
  title,
  intro,
  ctaLabel,
  items,
}: {
  eyebrow: string | null;
  title: string;
  intro: string | null;
  ctaLabel: string | null;
  items: PublicGalleryItem[];
}) {
  if (items.length === 0) return null;
  const tiles = [...items].sort((a, b) => Number(b.featured) - Number(a.featured)).slice(0, 4);
  return (
    <section aria-labelledby="galeria-title" className={section}>
      <div className={container}>
        <div className="mb-12 flex flex-col gap-6 tab:flex-row tab:items-end tab:justify-between">
          <div data-reveal>
            <SectionHeading id="galeria-title" eyebrow={eyebrow} title={title} intro={intro} />
          </div>
          <Link
            href={routes.gallery}
            className={`${buttonClass('ghost')} shrink-0 self-start tab:self-auto`}
          >
            {ctaLabel ?? ui.gallery.seeAll}
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
            sizes="(min-width: 90rem) 1256px, 94vw"
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
