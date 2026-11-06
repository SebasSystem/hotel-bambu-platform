import type { Metadata } from 'next';
import { FilterLink, PageHeader, Toolbar } from '@/components/site/page-header';
import { RoomCard } from '@/components/site/room-card';
import { container } from '@/components/site/styles';
import { ui } from '@/lib/i18n/es';
import { pageMetadata } from '@/lib/seo/metadata';
import { roomsSeo } from '@/lib/seo/page-seo';
import { getRoomTypes, getSite } from '@/lib/public/api';
import { contactCta } from '@/lib/public/cta';
import { routes } from '@/lib/public/navigation';
import {
  filterRoomsByType,
  publishedRoomTotal,
  roomTypeFilters,
  roomTypeFromParam,
} from '@/lib/public/rooms';

export async function generateMetadata(): Promise<Metadata> {
  const [site, rooms] = await Promise.all([getSite(), getRoomTypes()]);
  const seo = roomsSeo(site.hotel, rooms, contactCta(site, { kind: 'general' })?.kind ?? null);
  const meta = pageMetadata({
    path: routes.rooms,
    siteName: site.hotel.name,
    title: seo.title,
    description: seo.description,
    image: rooms[0]?.cover ?? null,
  });
  return { ...meta, title: { absolute: seo.title } };
}

/**
 * Rooms catalogue (mockup `#habitaciones`): sand page hero, toolbar with one chip per published
 * room kind (`?tipo=`, shareable) and a live count, then a 3/2/1-column grid of room type cards
 * (ADR 0016: one card per type; the kicker counts the published rooms).
 */
export default async function RoomsPage({ searchParams }: PageProps<'/habitaciones'>) {
  const [site, rooms, query] = await Promise.all([getSite(), getRoomTypes(), searchParams]);
  const roomCount = publishedRoomTotal(rooms);
  const filters = roomTypeFilters(rooms);
  const requested = roomTypeFromParam(query.tipo);
  const active = filters.some((filter) => filter.type === requested) ? requested : null;
  const visible = filterRoomsByType(rooms, active);

  return (
    <>
      <PageHeader
        path={routes.rooms}
        title={
          site.hotel.municipality ? `${ui.nav.rooms} en ${site.hotel.municipality}` : ui.nav.rooms
        }
        crumbName={ui.nav.rooms}
        kicker={roomCount > 0 ? ui.rooms.countLabel(roomCount) : null}
        intro={ui.rooms.intro}
      />
      <Toolbar label={ui.rooms.filter} count={ui.rooms.typeCount(visible.length)}>
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
          <ul
            className={`grid gap-6 tab:grid-cols-2 ${visible.length >= 3 ? 'desk:grid-cols-3' : ''}`}
          >
            {visible.map((room, index) => (
              <li key={room.slug} className="flex">
                <RoomCard
                  room={room}
                  index={index}
                  priority={index === 0}
                  headingLevel="h2"
                  frame={visible.length < 3 ? 'wide' : 'square'}
                  cta={contactCta(site, { kind: 'roomType', name: room.name })}
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
