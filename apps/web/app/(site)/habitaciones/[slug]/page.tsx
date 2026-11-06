import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { TextBlock } from '@/components/site/blocks';
import { SiteIcon } from '@/components/site/icon';
import { PhotoGallery } from '@/components/site/photo-gallery';
import { RoomCard } from '@/components/site/room-card';
import { RoomPrice } from '@/components/site/room-price';
import { container } from '@/components/site/styles';
import { ContactCtaLink } from '@/components/site/contact-cta';
import { JsonLd } from '@/components/seo/json-ld';
import { buttonClass } from '@/components/ui/button';
import { Eyebrow } from '@/components/ui/eyebrow';
import { SectionHeading } from '@/components/ui/section-heading';
import { BED_TYPE_LABELS } from '@/lib/labels';
import { ui } from '@/lib/i18n/es';
import { breadcrumbJsonLd, roomJsonLd } from '@/lib/seo/json-ld';
import { pageMetadata } from '@/lib/seo/metadata';
import { roomTypeSeo } from '@/lib/seo/room-type-seo';
import { getRoomType, getRoomTypes, getSite } from '@/lib/public/api';
import { contactCta } from '@/lib/public/cta';
import { routes } from '@/lib/public/navigation';
import { otherRooms, roomTypeLabel, roomTypeLead } from '@/lib/public/rooms';

export async function generateMetadata({
  params,
}: PageProps<'/habitaciones/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const result = await getRoomType(slug);
  if (result.kind !== 'room') return {};
  const { room } = result;
  const site = await getSite();
  const { hotel } = site;
  // Generated from the type and the city (ADR 0016: no per-room SEO fields).
  const seo = roomTypeSeo(
    room,
    hotel,
    contactCta(site, { kind: 'roomType', name: room.name })?.kind ?? null,
  );
  const meta = pageMetadata({
    path: routes.room(room.slug),
    siteName: hotel.name,
    title: seo.title,
    description: seo.description,
    image: room.cover ?? room.images[0] ?? null,
  });
  // The generated title already ends with the hotel name: skip the layout template.
  return { ...meta, title: { absolute: seo.title } };
}

function Block({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="detail-block">
      <h2 className="detail-label">{label}</h2>
      {children}
    </section>
  );
}

/**
 * Room type page (mockup `#habitacion`, requirement 4.3, ADR 0016): sticky photo column with
 * thumbnails and the lightbox, content column with a breadcrumb on its own line (defect 2), kicker,
 * title and detail blocks (description, capacity, equipment, rate, schedule). No availability
 * block (owner decision); the CTA opens WhatsApp with the room-type message. An old slug (renamed
 * type, or a former per-room URL mapped by the migration) answers a 308 permanent redirect.
 */
export default async function RoomPage({ params }: PageProps<'/habitaciones/[slug]'>) {
  const { slug } = await params;
  const result = await getRoomType(slug);
  if (result.kind === 'redirect') permanentRedirect(routes.room(result.slug));
  if (result.kind === 'not-found') notFound();
  const { room } = result;

  const [site, rooms] = await Promise.all([getSite(), getRoomTypes()]);
  const { hotel } = site;
  const cta = contactCta(site, { kind: 'roomType', name: room.name });
  const lead = roomTypeLead(room, hotel.municipality);
  const images = room.images.length > 0 ? room.images : room.cover ? [room.cover] : [];
  const beds = (room.beds ?? []).filter((bed) => bed.count > 0);
  const suggestions = otherRooms(rooms, room);
  const capacity: [string, string][] = [
    [ui.rooms.guestsLabel, ui.rooms.capacity(room.capacity)],
    ...(beds.length > 0
      ? [
          [
            ui.rooms.beds,
            beds
              .map(
                (bed) =>
                  `${bed.count} ${(BED_TYPE_LABELS[bed.type as keyof typeof BED_TYPE_LABELS] ?? bed.type).toLowerCase()}`,
              )
              .join(', '),
          ] as [string, string],
        ]
      : []),
    ...(room.areaM2 ? [[ui.rooms.area, `${room.areaM2} m²`] as [string, string]] : []),
  ];

  return (
    <>
      <JsonLd data={roomJsonLd(room, hotel)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: ui.nav.home, path: routes.home },
          { name: ui.nav.rooms, path: routes.rooms },
          { name: room.name, path: routes.room(room.slug) },
        ])}
      />
      <article className="room-detail">
        <div className="room-detail-media">
          {images.length > 0 ? <PhotoGallery images={images} variant="room" /> : null}
        </div>

        <div className="bg-paper px-[clamp(20px,6vw,84px)] py-[clamp(40px,7vw,100px)]">
          <nav aria-label="Ruta de navegación" className="mb-8 text-sm text-ink-muted-strong">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link
                  href={routes.home}
                  className="underline-offset-4 hover:text-green hover:underline"
                >
                  {ui.nav.home}
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden="true">/</span>
                <Link
                  href={routes.rooms}
                  className="underline-offset-4 hover:text-green hover:underline"
                >
                  {ui.nav.rooms}
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden="true">/</span>
                <span aria-current="page" className="text-charcoal">
                  {room.name}
                </span>
              </li>
            </ol>
          </nav>

          <Eyebrow className="mb-4">
            {`${roomTypeLabel(room.type)} · ${ui.rooms.upTo(room.capacity)}`}
          </Eyebrow>
          <h1 className="text-[clamp(2.6rem,6vw,5.6rem)] text-balance text-charcoal">
            {room.name}
          </h1>
          <p
            data-testid="room-lead"
            className="mt-5 max-w-[560px] text-lead text-pretty text-muted-foreground"
          >
            {lead}
          </p>

          <div className="mt-9">
            {room.description && room.description.trim() !== lead ? (
              <Block label={ui.rooms.description}>
                <TextBlock text={room.description} className="text-charcoal/90" />
              </Block>
            ) : null}

            <Block label={ui.rooms.capacityLabel}>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                {capacity.map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="mt-1 font-bold text-charcoal">{value}</dd>
                  </div>
                ))}
              </dl>
            </Block>

            {room.amenities.length > 0 || site.hotelAmenities.length > 0 ? (
              <Block label={ui.rooms.includes}>
                {room.amenities.length > 0 ? (
                  <ul className="grid gap-x-6 gap-y-3 text-sm xs:grid-cols-2">
                    {room.amenities.map((amenity) => (
                      <li key={amenity.name} className="flex items-center gap-2.5">
                        <SiteIcon
                          iconKey={amenity.iconKey}
                          className="size-[18px] shrink-0 text-green"
                        />
                        {amenity.name}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {site.hotelAmenities.length > 0 ? (
                  <p
                    data-testid="hotel-wide-amenities"
                    className={`text-sm text-ink-muted-strong ${room.amenities.length > 0 ? 'mt-4' : ''}`}
                  >
                    <strong className="font-bold text-charcoal">{ui.home.hotelWide}:</strong>{' '}
                    {site.hotelAmenities.map((amenity) => amenity.name).join(' · ')}
                  </p>
                ) : null}
              </Block>
            ) : null}

            <Block label={ui.rooms.rate}>
              <div className="rounded-sm bg-ivory p-4">
                <RoomPrice room={room} size="lg" showConfirmNote />
                {room.priceNotes ? (
                  <TextBlock
                    text={room.priceNotes}
                    className="mt-3 text-sm text-muted-foreground"
                  />
                ) : null}
              </div>
            </Block>

            {hotel.checkInTime || hotel.checkOutTime ? (
              <Block label={ui.rooms.schedule}>
                <dl className="grid grid-cols-2 gap-x-6 text-sm">
                  {hotel.checkInTime ? (
                    <div>
                      <dt className="text-muted-foreground">{ui.contact.checkIn}</dt>
                      <dd className="mt-1 font-bold text-charcoal">{hotel.checkInTime}</dd>
                    </div>
                  ) : null}
                  {hotel.checkOutTime ? (
                    <div>
                      <dt className="text-muted-foreground">{ui.contact.checkOut}</dt>
                      <dd className="mt-1 font-bold text-charcoal">{hotel.checkOutTime}</dd>
                    </div>
                  ) : null}
                </dl>
              </Block>
            ) : null}

            {cta ? (
              <div className="border-t border-line pt-7">
                <ContactCtaLink
                  cta={cta}
                  source="room_detail"
                  entityId={room.slug}
                  className={`${buttonClass('primary')} w-full`}
                  whatsappLabel={ui.whatsapp.room}
                />
                <p className="mt-3 text-xs leading-normal text-muted-foreground">
                  {cta.kind === 'whatsapp' ? ui.whatsapp.external : ui.rooms.confirm}
                </p>
              </div>
            ) : null}

            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {[
                { href: routes.location, label: ui.pages.location },
                { href: routes.policies, label: ui.pages.policies },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-bold text-green underline underline-offset-4 hover:text-green-900"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </article>

      {suggestions.length > 0 ? (
        <section aria-labelledby="otras" className="py-(--section-y)">
          <div className={container}>
            <div className="mb-12 flex flex-col gap-6 tab:flex-row tab:items-end tab:justify-between">
              <SectionHeading id="otras" title={ui.rooms.others} />
              <Link href={routes.rooms} className={`${buttonClass('ghost')} shrink-0 self-start`}>
                {ui.rooms.back}
              </Link>
            </div>
            <ul
              className={`grid gap-6 tab:grid-cols-2 ${suggestions.length >= 3 ? 'desk:grid-cols-3' : ''}`}
            >
              {suggestions.map((other, index) => (
                <li key={other.slug} className="flex">
                  <RoomCard
                    room={other}
                    index={index}
                    cta={contactCta(site, { kind: 'roomType', name: other.name })}
                    frame={suggestions.length < 3 ? 'wide' : 'square'}
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  );
}
