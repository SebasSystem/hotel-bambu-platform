import Link from 'next/link';
import type { CSSProperties } from 'react';
import { buttonClass } from '@/components/ui/button';
import { cardClass } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { ui } from '@/lib/i18n/es';
import type { ContactCta } from '@/lib/public/cta';
import { formatRoomPrice } from '@/lib/public/format';
import { routes } from '@/lib/public/navigation';
import { bedsText, roomAmenityLabel, roomExcerpt, roomTypeLabel } from '@/lib/public/rooms';
import type { PublicRoomTypeSummary } from '@/lib/public/types';
import { IMAGE_SIZES } from '@/lib/public/image-sizes';
import { ContactCtaLink } from './contact-cta';
import { SiteIcon } from './icon';
import { Picture } from './picture';

interface RoomCardProps {
  /** The list payload carries the bed setup (D6: no detail request per card). */
  room: PublicRoomTypeSummary;
  cta: ContactCta | null;
  index?: number;
  headingLevel?: 'h2' | 'h3';
  /** Photo frame: square in the catalogue grid, 4:3 when only two cards share a row. */
  frame?: 'square' | 'wide';
  /** First card of a page whose LCP is this photo (rooms catalogue): eager + preloaded. */
  priority?: boolean;
}

/**
 * Room type card (mockup `.room-card`, research §3 row 3): photo, kind, name, capacity and beds,
 * ROOM amenities as chips, the "desde" rate or "Consultar tarifa", then "Ver habitación" (the
 * whole card links to the type page) and the contact CTA (WhatsApp, or a call when there is no
 * WhatsApp number). No status pill: there is no availability (owner decision, defect 4).
 */
export function RoomCard({
  room,
  cta,
  index = 0,
  headingLevel: Heading = 'h3',
  frame = 'square',
  priority = false,
}: RoomCardProps) {
  const price = formatRoomPrice(room);
  const excerpt = roomExcerpt(room.description);
  const facts = [ui.rooms.upTo(room.capacity), bedsText(room.beds)].filter(Boolean).join(' · ');
  return (
    <article
      data-reveal
      style={{ '--i': index % 6 } as CSSProperties}
      className={`${cardClass('room')} group relative flex w-full flex-col text-charcoal`}
    >
      <div
        className={`${frame === 'wide' ? 'aspect-[4/3]' : 'aspect-square'} overflow-hidden bg-sand`}
      >
        {room.cover ? (
          <Picture
            media={room.cover}
            priority={priority}
            sizes={IMAGE_SIZES.roomCard}
            className="block size-full"
            imgClassName="room-card-img size-full object-cover"
            objectPosition="50% 55%"
          />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-[22px] tab:p-7">
        <p
          data-room-kind=""
          className="text-[0.78rem] font-bold tracking-[0.15em] text-green uppercase"
        >
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
        <p className="mt-2 text-meta font-bold text-charcoal">{facts}</p>
        {excerpt ? (
          <p className="mt-2.5 line-clamp-2 text-card text-muted-foreground">{excerpt}</p>
        ) : null}
        {room.amenities.length > 0 ? (
          <ul aria-label={ui.rooms.includes} className="mt-4 flex flex-wrap gap-2">
            {room.amenities.map((amenity) => (
              <li key={amenity.name}>
                <Chip>
                  <SiteIcon iconKey={amenity.iconKey} className="text-green" />
                  {roomAmenityLabel(amenity)}
                </Chip>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-5 border-t border-line pt-4">
          {price ? (
            <p className="text-sm text-muted-foreground">
              <span className="sr-only">{price.summary}</span>
              <span aria-hidden="true">
                {ui.rooms.from}{' '}
                <span className="font-display text-xl text-charcoal">{price.amount}</span>{' '}
                {price.unit}
              </span>
            </p>
          ) : (
            <p className="text-sm font-bold text-green">{ui.rooms.noPrice}</p>
          )}
        </div>
        <div className="mt-auto flex flex-wrap gap-2 pt-5">
          {/* The whole card is the detail link; this is its visible affordance only. */}
          <span aria-hidden="true" className={`${buttonClass('ghost', 'compact')} flex-1`}>
            {ui.rooms.seeDetail}
          </span>
          {cta ? (
            <ContactCtaLink
              cta={cta}
              source="room_card"
              entityId={room.slug}
              className={`${buttonClass('primary', 'compact')} relative z-10 flex-1`}
              whatsappLabel={
                <>
                  {ui.whatsapp.ask}
                  <span className="sr-only"> {room.name}</span>
                </>
              }
              phoneLabel={ui.phone.call}
              ariaLabel={cta.kind === 'phone' ? cta.label : undefined}
            />
          ) : null}
        </div>
      </div>
    </article>
  );
}
