import type { Metadata } from 'next';
import { FilterLink, PageHeader, Toolbar } from '@/components/site/page-header';
import { RoomCard } from '@/components/site/room-card';
import { container } from '@/components/site/styles';
import { ui } from '@/lib/i18n/es';
import { pageMetadata } from '@/lib/seo/metadata';
import { getRooms, getSite } from '@/lib/public/api';
import { routes } from '@/lib/public/navigation';
import { filterRoomsByType, roomTypeFilters, roomTypeFromParam } from '@/lib/public/rooms';
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

/**
 * Rooms catalogue (mockup `#habitaciones`): sand page hero, toolbar with one chip per published
 * room type (`?tipo=`, shareable) and a live count, then a 3/2/1-column card grid.
 */
export default async function RoomsPage({ searchParams }: PageProps<'/habitaciones'>) {
  const [site, rooms, query] = await Promise.all([getSite(), getRooms(), searchParams]);
  const section = sectionOf(site, 'ROOMS');
  const filters = roomTypeFilters(rooms);
  const requested = roomTypeFromParam(query.tipo);
  const active = filters.some((filter) => filter.type === requested) ? requested : null;
  const visible = filterRoomsByType(rooms, active);

  return (
    <>
      <PageHeader
        path={routes.rooms}
        title={section?.title ?? ui.nav.rooms}
        kicker={ui.rooms.countLabel(rooms.length)}
        intro={section?.subtitle ?? section?.body}
      />
      <Toolbar label={ui.rooms.filter} count={ui.rooms.countLabel(visible.length)}>
        {filters.length > 1 ? (
          <>
            <FilterLink href={routes.rooms} active={!active}>
              {ui.rooms.all}
            </FilterLink>
            {filters.map((filter) => (
              <FilterLink
                key={filter.type}
                href={`${routes.rooms}?tipo=${filter.param}`}
                active={active === filter.type}
              >
                {filter.label}
              </FilterLink>
            ))}
          </>
        ) : null}
      </Toolbar>

      <section aria-label={ui.nav.rooms} className={`${container} pt-12 pb-[110px]`}>
        {visible.length > 0 ? (
          <ul className="grid gap-6 tab:grid-cols-2 desk:grid-cols-3">
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
