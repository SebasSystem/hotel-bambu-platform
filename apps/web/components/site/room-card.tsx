import Link from 'next/link';
import type { CSSProperties } from 'react';
import { ui } from '@/lib/i18n/es';
import { routes } from '@/lib/public/navigation';
import { roomTypeLabel } from '@/lib/public/rooms';
import type { PublicRoomSummary } from '@/lib/public/types';
import { SiteIcon } from './icon';
import { Picture } from './picture';
import { RoomPrice } from './room-price';
import { button } from './styles';
import { WhatsAppLink } from './whatsapp-link';

interface RoomCardProps {
  room: PublicRoomSummary;
  whatsappUrl: string | null;
  index?: number;
  headingLevel?: 'h2' | 'h3';
}

/** Portrait 4:5 card (art direction A): photo, name, capacity, amenities, rate, CTAs. */
export function RoomCard({
  room,
  whatsappUrl,
  index = 0,
  headingLevel: Heading = 'h3',
}: RoomCardProps) {
  return (
    <article
      data-reveal
      className="room-card group relative flex w-full flex-col"
      style={{ '--i': index % 6 } as CSSProperties}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-sand-100">
        {room.cover ? (
          <Picture
            media={room.cover}
            sizes="(min-width: 80rem) 400px, (min-width: 48rem) 45vw, 92vw"
            className="block size-full"
            imgClassName="room-card-img size-full object-cover"
          />
        ) : null}
        <span className="absolute top-3 left-3 rounded-pill bg-sand-50/90 px-3 py-1 text-xs font-semibold text-bamboo-900 backdrop-blur">
          {roomTypeLabel(room.type)}
        </span>
      </div>
      <div className="flex flex-1 flex-col pt-5">
        <Heading className="text-2xl font-medium text-bamboo-900">
          <Link
            href={routes.room(room.slug)}
            className="rounded-xs after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded-lg focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-ring"
          >
            {room.name}
          </Link>
        </Heading>
        <p className="mt-1 text-sm text-muted-foreground">{ui.rooms.capacity(room.capacity)}</p>
        {room.shortDescription ? (
          <p className="mt-3 line-clamp-2 text-sm leading-normal text-foreground/85">
            {room.shortDescription}
          </p>
        ) : null}
        {room.amenities.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-ink-600">
            {room.amenities.slice(0, 4).map((amenity) => (
              <li key={amenity.name} className="inline-flex items-center gap-1.5">
                <SiteIcon iconKey={amenity.iconKey} className="size-4 text-bamboo-700" />
                {amenity.name}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-5">
          <RoomPrice room={room} hasWhatsApp={Boolean(whatsappUrl)} />
          {whatsappUrl ? (
            <WhatsAppLink
              href={whatsappUrl}
              source="room_card"
              entityId={room.slug}
              className={`${button.whatsapp} relative z-10`}
            >
              {ui.whatsapp.short}
            </WhatsAppLink>
          ) : null}
        </div>
      </div>
    </article>
  );
}
