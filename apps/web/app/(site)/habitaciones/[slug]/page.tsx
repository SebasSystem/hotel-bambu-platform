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
import { WhatsAppLink } from '@/components/site/whatsapp-link';
import { JsonLd } from '@/components/seo/json-ld';
import { buttonClass } from '@/components/ui/button';
import { Eyebrow } from '@/components/ui/eyebrow';
import { SectionHeading } from '@/components/ui/section-heading';
import { BED_TYPE_LABELS } from '@/lib/labels';
import { ui } from '@/lib/i18n/es';
import { breadcrumbJsonLd, roomJsonLd } from '@/lib/seo/json-ld';
import { pageMetadata } from '@/lib/seo/metadata';
import { getRoom, getRooms, getSite } from '@/lib/public/api';
import { routes } from '@/lib/public/navigation';
import { otherRooms, roomTypeLabel } from '@/lib/public/rooms';
import { whatsAppLink } from '@/lib/public/whatsapp';

const dateFormat = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'long',
  timeZone: 'America/Bogota',
});

export async function generateMetadata({
  params,
}: PageProps<'/habitaciones/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const result = await getRoom(slug);
  if (result.kind !== 'room') return {};
  const { room } = result;
  const { hotel } = await getSite();
  return pageMetadata({
    path: routes.room(room.slug),
    siteName: hotel.name,
    title: room.seoTitle ?? room.name,
    description:
      room.seoDescription ??
      room.shortDescription ??
      `${room.name}: ${ui.rooms.capacity(room.capacity)}. ${ui.rooms.confirm}`,
    image: room.cover ?? room.images[0] ?? null,
  });
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
 * Room detail (mockup `#habitacion`, requirement 4.3): sticky photo column with thumbnails and the
 * lightbox, content column with a breadcrumb on its own line (defect 2), kicker, title, lead and
 * detail blocks (description, capacity, equipment, rate, schedule). No availability block (owner
 * decision); the CTA opens WhatsApp with the ROOM template. An old slug answers a 308 redirect.
 */
export default async function RoomPage({ params }: PageProps<'/habitaciones/[slug]'>) {
  const { slug } = await params;
  const result = await getRoom(slug);
  if (result.kind === 'redirect') permanentRedirect(routes.room(result.slug));
  if (result.kind === 'not-found') notFound();
  const { room } = result;

  const [site, rooms] = await Promise.all([getSite(), getRooms()]);
  const { hotel } = site;
  const whatsappUrl = whatsAppLink(site, { kind: 'room', name: room.name });
  const images = room.images.length > 0 ? room.images : room.cover ? [room.cover] : [];
  const beds = (room.beds ?? []).filter((bed) => bed.count > 0);
  const suggestions = otherRooms(rooms, room);
  const capacity: [string, string][] = [
    [ui.rooms.capacityLabel, ui.rooms.capacity(room.capacity)],
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
          <nav aria-label="Ruta de navegación" className="mb-8 text-sm text-muted-foreground">
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
          {room.shortDescription ? (
            <p className="mt-5 text-[1.05rem] text-muted-foreground">{room.shortDescription}</p>
          ) : null}

          <div className="mt-9">
            {room.description ? (
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
                <RoomPrice
                  room={room}
                  hasWhatsApp={Boolean(whatsappUrl)}
                  size="lg"
                  showConfirmNote
                />
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
                <Link
                  href={routes.policies}
                  className="mt-4 inline-flex text-sm font-bold text-green underline underline-offset-4"
                >
                  {ui.nav.policies}
                </Link>
              </Block>
            ) : null}

            {room.promotions.map((promotion) => {
              const promoUrl = whatsAppLink(site, { kind: 'promotion', name: promotion.title });
              return (
                <Block key={promotion.id} label={ui.rooms.promotion}>
                  <h3 className="text-h3 text-charcoal">{promotion.title}</h3>
                  <TextBlock
                    text={promotion.description}
                    className="mt-2 text-sm text-charcoal/90"
                  />
                  {promotion.conditions ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                      <strong className="font-bold">{ui.rooms.conditions}:</strong>{' '}
                      {promotion.conditions}
                    </p>
                  ) : null}
                  <p className="mt-2 text-sm text-muted-foreground">
                    {ui.rooms.validUntil} {dateFormat.format(new Date(promotion.endsAt))}
                  </p>
                  {promoUrl ? (
                    <WhatsAppLink
                      href={promoUrl}
                      source="promotion"
                      entityId={room.slug}
                      className={`${buttonClass('ghost')} mt-4`}
                    >
                      {ui.whatsapp.cta}
                    </WhatsAppLink>
                  ) : null}
                </Block>
              );
            })}

            {whatsappUrl ? (
              <div className="border-t border-line pt-7">
                <WhatsAppLink
                  href={whatsappUrl}
                  source="room_detail"
                  entityId={room.slug}
                  className={`${buttonClass('primary')} w-full`}
                >
                  {ui.whatsapp.room}
                </WhatsAppLink>
                <p className="mt-3 text-xs leading-normal text-muted-foreground">
                  {ui.whatsapp.external}
                </p>
              </div>
            ) : null}
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
            <ul className="grid gap-6 tab:grid-cols-2 desk:grid-cols-3">
              {suggestions.map((other, index) => (
                <li key={other.slug} className="flex">
                  <RoomCard
                    room={other}
                    index={index}
                    whatsappUrl={whatsAppLink(site, { kind: 'room', name: other.name })}
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
