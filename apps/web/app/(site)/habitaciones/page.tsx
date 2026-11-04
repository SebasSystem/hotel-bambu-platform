import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/site/page-header';
import { RoomCard } from '@/components/site/room-card';
import { container } from '@/components/site/styles';
import { ui } from '@/lib/i18n/es';
import { pageMetadata } from '@/lib/seo/metadata';
import { getRooms, getSite } from '@/lib/public/api';
import { routes } from '@/lib/public/navigation';
import { ROOM_TYPES_PUBLIC, roomTypeFromParam, type RoomTypeKey } from '@/lib/public/rooms';
import { sectionOf } from '@/lib/public/site';
import { whatsAppLink } from '@/lib/public/whatsapp';

export async function generateMetadata(): Promise<Metadata> {
  const [site, rooms] = await Promise.all([getSite(), getRooms()]);
  const section = sectionOf(site, 'ROOMS');
  return pageMetadata({
    path: routes.rooms,
    siteName: site.hotel.name,
    title: section?.title ?? ui.nav.rooms,
    description:
      section?.subtitle ??
      `${ui.rooms.countLabel(rooms.length)} en ${site.hotel.name}: fotos, capacidad, servicios incluidos y tarifa informativa. Consulta disponibilidad por WhatsApp.`,
  });
}

export default async function RoomsPage({ searchParams }: PageProps<'/habitaciones'>) {
  const [site, rooms, query] = await Promise.all([getSite(), getRooms(), searchParams]);
  const section = sectionOf(site, 'ROOMS');
  const active = roomTypeFromParam(query.tipo);
  const types = (Object.keys(ROOM_TYPES_PUBLIC) as RoomTypeKey[]).filter((type) =>
    rooms.some((room) => room.type === type),
  );
  const visible = active ? rooms.filter((room) => room.type === active) : rooms;
  const filterClass =
    'inline-flex min-h-11 items-center rounded-pill border px-5 text-sm font-semibold transition-colors';

  return (
    <>
      <PageHeader
        path={routes.rooms}
        title={section?.title ?? ui.nav.rooms}
        kicker={ui.rooms.countLabel(rooms.length)}
        intro={section?.subtitle ?? section?.body}
      >
        {types.length > 1 ? (
          <nav aria-label="Filtrar por tipo de habitación" className="mt-8">
            <ul className="flex flex-wrap gap-2">
              <li>
                <Link
                  href={routes.rooms}
                  aria-current={active ? undefined : 'page'}
                  className={`${filterClass} ${active ? 'border-sand-200 bg-sand-50 text-bamboo-900 hover:border-bamboo-700' : 'border-bamboo-700 bg-bamboo-700 text-white'}`}
                >
                  {ui.rooms.all}
                </Link>
              </li>
              {types.map((type) => (
                <li key={type}>
                  <Link
                    href={`${routes.rooms}?tipo=${ROOM_TYPES_PUBLIC[type].param}`}
                    aria-current={active === type ? 'page' : undefined}
                    className={`${filterClass} ${active === type ? 'border-bamboo-700 bg-bamboo-700 text-white' : 'border-sand-200 bg-sand-50 text-bamboo-900 hover:border-bamboo-700'}`}
                  >
                    {ROOM_TYPES_PUBLIC[type].plural}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </PageHeader>

      <section aria-label={ui.nav.rooms} className={`${container} py-16`}>
        {visible.length > 0 ? (
          <ul className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((room, index) => (
              <li key={room.slug} className="flex">
                <RoomCard
                  room={room}
                  index={index}
                  headingLevel="h2"
                  whatsappUrl={whatsAppLink(site, { kind: 'room', name: room.name })}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-lg text-muted-foreground">{ui.empty.generic}</p>
        )}
        <p className="mt-16 max-w-2xl text-sm leading-normal text-muted-foreground">
          {ui.pricesDisclaimer}
        </p>
      </section>
    </>
  );
}
