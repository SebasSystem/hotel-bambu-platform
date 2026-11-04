import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { AmenityChips, TextBlock } from '@/components/site/blocks';
import { GalleryGrid } from '@/components/site/gallery-grid';
import { RoomCard } from '@/components/site/room-card';
import { RoomPrice } from '@/components/site/room-price';
import { Kicker } from '@/components/site/section';
import { button, container } from '@/components/site/styles';
import { WhatsAppLink } from '@/components/site/whatsapp-link';
import { BED_TYPE_LABELS } from '@/lib/labels';
import { ui } from '@/lib/i18n/es';
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
  return {
    title: room.seoTitle ?? room.name,
    description:
      room.seoDescription ??
      room.shortDescription ??
      `${room.name}: ${ui.rooms.capacity(room.capacity)}. ${ui.rooms.confirm}`,
  };
}

/** Room detail (requirement 4.3). An old slug answers a permanent redirect to the current one. */
export default async function RoomPage({ params }: PageProps<'/habitaciones/[slug]'>) {
  const { slug } = await params;
  const result = await getRoom(slug);
  if (result.kind === 'redirect') permanentRedirect(routes.room(result.slug));
  if (result.kind === 'not-found') notFound();
  const { room } = result;

  const [site, rooms] = await Promise.all([getSite(), getRooms()]);
  const whatsappUrl = whatsAppLink(site, { kind: 'room', name: room.name });
  const images = room.images.length > 0 ? room.images : room.cover ? [room.cover] : [];
  const beds = (room.beds ?? []).filter((bed) => bed.count > 0);
  const suggestions = otherRooms(rooms, room);

  return (
    <>
      <div className={`${container} pt-8 sm:pt-10`}>
        <nav aria-label="Ruta de navegación" className="text-sm text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link
                href={routes.home}
                className="underline-offset-4 hover:text-bamboo-700 hover:underline"
              >
                {ui.nav.home}
              </Link>
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden="true">/</span>
              <Link
                href={routes.rooms}
                className="underline-offset-4 hover:text-bamboo-700 hover:underline"
              >
                {ui.nav.rooms}
              </Link>
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden="true">/</span>
              <span aria-current="page" className="text-foreground">
                {room.name}
              </span>
            </li>
          </ol>
        </nav>
      </div>

      <article
        className={`${container} grid gap-12 pt-8 pb-(--section-y) lg:grid-cols-12 lg:gap-16`}
      >
        <div className="lg:col-span-7 lg:row-start-1">
          {images.length > 0 ? <GalleryGrid images={images} layout="room" /> : null}
        </div>
        <div className="lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1">
          <div className="lg:sticky lg:top-[calc(var(--header-h)+2rem)]">
            <Kicker>{`${roomTypeLabel(room.type)} · ${ui.rooms.capacity(room.capacity)}`}</Kicker>
            <h1 className="mt-4 text-4xl font-medium text-balance text-bamboo-900">{room.name}</h1>
            {room.shortDescription ? (
              <p className="mt-5 text-lg leading-normal text-muted-foreground">
                {room.shortDescription}
              </p>
            ) : null}

            <div className="mt-8 rounded-xl border border-sand-200 bg-card p-6 shadow-sm">
              <RoomPrice room={room} hasWhatsApp={Boolean(whatsappUrl)} size="lg" showConfirmNote />
              {room.priceNotes ? (
                <TextBlock text={room.priceNotes} className="mt-4 text-sm text-muted-foreground" />
              ) : null}
              {whatsappUrl ? (
                <>
                  <WhatsAppLink
                    href={whatsappUrl}
                    source="room_detail"
                    entityId={room.slug}
                    className={`${button.whatsapp} mt-6 w-full`}
                  >
                    {ui.whatsapp.room}
                  </WhatsAppLink>
                  <p className="mt-3 text-xs leading-normal text-muted-foreground">
                    {ui.whatsapp.external}
                  </p>
                </>
              ) : null}
            </div>

            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 text-sm">
              <div>
                <dt className="text-muted-foreground">Capacidad</dt>
                <dd className="mt-1 font-semibold text-bamboo-900">
                  {ui.rooms.capacity(room.capacity)}
                </dd>
              </div>
              {beds.length > 0 ? (
                <div>
                  <dt className="text-muted-foreground">{ui.rooms.beds}</dt>
                  <dd className="mt-1 font-semibold text-bamboo-900">
                    {beds
                      .map(
                        (bed) =>
                          `${bed.count} ${(BED_TYPE_LABELS[bed.type as keyof typeof BED_TYPE_LABELS] ?? bed.type).toLowerCase()}`,
                      )
                      .join(', ')}
                  </dd>
                </div>
              ) : null}
              {room.areaM2 ? (
                <div>
                  <dt className="text-muted-foreground">{ui.rooms.area}</dt>
                  <dd className="mt-1 font-semibold text-bamboo-900">{room.areaM2} m²</dd>
                </div>
              ) : null}
            </dl>
          </div>
        </div>

        <div className="grid content-start gap-12 lg:col-span-7 lg:row-start-2">
          {room.description ? (
            <section aria-labelledby="descripcion">
              <h2 id="descripcion" className="text-2xl font-medium text-bamboo-900">
                Descripción
              </h2>
              <TextBlock text={room.description} className="mt-4 text-lg text-foreground/90" />
            </section>
          ) : null}

          {room.amenities.length > 0 ? (
            <section aria-labelledby="incluye">
              <h2 id="incluye" className="text-2xl font-medium text-bamboo-900">
                {ui.rooms.includes}
              </h2>
              <div className="mt-5">
                <AmenityChips
                  amenities={room.amenities.map((amenity) => ({
                    ...amenity,
                    id: amenity.name,
                    description: null,
                  }))}
                />
              </div>
            </section>
          ) : null}

          {room.promotions.length > 0 ? (
            <section aria-labelledby="promociones">
              <h2 id="promociones" className="text-2xl font-medium text-bamboo-900">
                {ui.rooms.promotion}
              </h2>
              <ul className="mt-5 grid gap-4">
                {room.promotions.map((promotion) => {
                  const promoUrl = whatsAppLink(site, { kind: 'promotion', name: promotion.title });
                  return (
                    <li
                      key={promotion.id}
                      className="rounded-xl border border-earth-600/30 bg-card p-6"
                    >
                      <span className="inline-flex rounded-pill bg-promo px-3 py-1 text-xs font-semibold text-promo-foreground">
                        {ui.rooms.promotion}
                      </span>
                      <h3 className="mt-3 text-xl font-medium text-bamboo-900">
                        {promotion.title}
                      </h3>
                      {promotion.description ? (
                        <TextBlock
                          text={promotion.description}
                          className="mt-2 text-foreground/90"
                        />
                      ) : null}
                      {promotion.conditions ? (
                        <p className="mt-3 text-sm text-muted-foreground">
                          <strong className="font-semibold">{ui.rooms.conditions}:</strong>{' '}
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
                          className={`${button.outline} mt-4`}
                        >
                          {ui.whatsapp.cta}
                        </WhatsAppLink>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
        </div>
      </article>

      {suggestions.length > 0 ? (
        <section aria-labelledby="otras" className="bg-sand-100 py-(--section-y)">
          <div className={container}>
            <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <h2 id="otras" className="text-3xl font-medium text-bamboo-900">
                {ui.rooms.others}
              </h2>
              <Link
                href={routes.rooms}
                className="font-semibold text-primary underline underline-offset-4"
              >
                {ui.rooms.back}
              </Link>
            </div>
            <ul className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
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
