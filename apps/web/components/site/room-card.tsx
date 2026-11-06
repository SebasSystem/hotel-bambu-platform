import Link from 'next/link';
import type { CSSProperties } from 'react';
import { buttonClass } from '@/components/ui/button';
import { cardClass } from '@/components/ui/card';
import { ui } from '@/lib/i18n/es';
import { formatRoomPrice } from '@/lib/public/format';
import { routes } from '@/lib/public/navigation';
import { roomTypeLabel } from '@/lib/public/rooms';
import type { PublicRoomSummary } from '@/lib/public/types';
import { Picture } from './picture';
import { WhatsAppLink } from './whatsapp-link';

interface RoomCardProps {
  room: PublicRoomSummary;
  whatsappUrl: string | null;
  index?: number;
  headingLevel?: 'h2' | 'h3';
}

/**
 * Room card (mockup `.room-card`): paper, 24 px radius, photo with hover zoom, kicker (type and
 * capacity), serif name, short copy, meta row and two compact actions ("Ver detalle" + WhatsApp
 * with the ROOM template). No status pill: there is no availability (owner decision, defect 4).
 * The square photo keeps most of the hotel's 3:4 portrait frames.
 */
export function RoomCard({
  room,
  whatsappUrl,
  index = 0,
  headingLevel: Heading = 'h3',
}: RoomCardProps) {
  const price = formatRoomPrice(room);
  const meta = [ui.rooms.upTo(room.capacity), ...room.amenities.slice(0, 2).map((a) => a.name)];
  return (
    <article
      data-reveal
      style={{ '--i': index % 6 } as CSSProperties}
      className={`${cardClass('room')} group relative flex w-full flex-col`}
    >
      <div className="aspect-square overflow-hidden bg-sand">
        {room.cover ? (
          <Picture
            media={room.cover}
            sizes="(min-width: 62.5rem) 30vw, (min-width: 47.5rem) 45vw, 92vw"
            className="block size-full"
            imgClassName="room-card-img size-full object-cover"
            objectPosition="50% 55%"
          />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-[22px]">
        <p className="text-[0.78rem] font-bold tracking-[0.15em] text-green uppercase">
          {roomTypeLabel(room.type)}
        </p>
        <Heading className="mt-2 text-h3 text-charcoal">
          <Link
            href={routes.room(room.slug)}
            className="after:absolute after:inset-0 after:z-0 after:rounded-lg after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-(--focus-ring)"
          >
            {room.name}
          </Link>
        </Heading>
        {room.shortDescription ? (
          <p className="mt-2.5 line-clamp-2 text-card text-muted-foreground">
            {room.shortDescription}
          </p>
        ) : null}
        <p className="mt-3.5 text-meta font-bold text-charcoal">{meta.join(' · ')}</p>
        {price ? (
          <p className="mt-3 text-sm text-muted-foreground">
            <span className="sr-only">{price.summary}</span>
            <span aria-hidden="true">
              {ui.rooms.from}{' '}
              <span className="font-display text-xl text-charcoal">{price.amount}</span>{' '}
              {price.unit}
            </span>
          </p>
        ) : null}
        <div className="mt-auto flex gap-2 pt-5">
          {/* The whole card is the detail link; this is its visible affordance only. */}
          <span aria-hidden="true" className={`${buttonClass('ghost', 'compact')} flex-1`}>
            {ui.rooms.seeDetail}
          </span>
          {whatsappUrl ? (
            <WhatsAppLink
              href={whatsappUrl}
              source="room_card"
              entityId={room.slug}
              className={`${buttonClass('primary', 'compact')} relative z-10 flex-1`}
            >
              {ui.whatsapp.ask}
              <span className="sr-only"> {room.name}</span>
            </WhatsAppLink>
          ) : null}
        </div>
      </div>
    </article>
  );
}
