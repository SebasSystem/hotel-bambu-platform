import { ChevronDown } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { cardClass } from '@/components/ui/card';
import { ui } from '@/lib/i18n/es';
import { paragraphs } from '@/lib/public/format';
import { displayPhone, fullAddress, mapLinks, telHref } from '@/lib/public/site';
import type { PublicFaq, PublicHotel, PublicMedia } from '@/lib/public/types';
import { SiteIcon } from './icon';
import { MapEmbed } from './map-embed';
import { Picture } from './picture';
import { WhatsAppLink } from './whatsapp-link';

/** Reusable content blocks shared by the home narrative and the inner pages. */

export function TextBlock({ text, className = '' }: { text: string | null; className?: string }) {
  const chunks = paragraphs(text);
  if (chunks.length === 0) return null;
  return (
    <div className={`grid gap-4 leading-normal text-pretty ${className}`}>
      {chunks.map((chunk, index) => (
        <p key={index} className="whitespace-pre-line">
          {chunk}
        </p>
      ))}
    </div>
  );
}

/** 52 px green-tint circle with a Lucide icon (mockup `.amenity-icon`). */
export function IconBadge({
  iconKey,
  className = '',
}: {
  iconKey: string | null;
  className?: string;
}) {
  return (
    <span
      className={`inline-grid size-[52px] shrink-0 place-items-center rounded-full bg-green-50 text-green ${className}`}
    >
      <SiteIcon iconKey={iconKey} className="size-5" />
    </span>
  );
}

interface Feature {
  id: string;
  name: string;
  description: string | null;
  iconKey: string | null;
  media?: PublicMedia | null;
}

/**
 * Mockup amenity cards (`.amenities-grid`): 4 columns, paper tile, icon circle, serif title and a
 * muted note; hover lifts 5 px. Used for the home room amenities.
 */
export function FeatureGrid({ items, columns = 4 }: { items: Feature[]; columns?: 3 | 4 }) {
  return (
    <ul
      className={`grid grid-cols-1 gap-2.5 xs:grid-cols-2 tab:gap-4 ${
        columns === 4 ? 'desk:grid-cols-4' : 'desk:grid-cols-3'
      }`}
    >
      {items.map((item, index) => (
        <li
          key={item.id}
          data-reveal
          style={{ '--i': index } as CSSProperties}
          className={`${cardClass('tile', true)} flex items-center gap-4 overflow-hidden xs:min-h-[220px] xs:flex-col xs:items-stretch xs:justify-between xs:gap-0`}
        >
          {item.media ? (
            <div className="-mx-[18px] -mt-[18px] mb-6 aspect-[4/3] overflow-hidden tab:-mx-6 tab:-mt-6">
              <Picture
                media={item.media}
                sizes="(min-width: 62.5rem) 25vw, (min-width: 26.25rem) 45vw, 92vw"
                className="block size-full"
                imgClassName="size-full object-cover"
              />
            </div>
          ) : (
            <IconBadge iconKey={item.iconKey} />
          )}
          <div>
            <h3 className="text-h3 text-charcoal xs:mt-8 xs:mb-2">{item.name}</h3>
            {item.description ? (
              <p className="text-[0.85rem] text-muted-foreground">{item.description}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

/** FAQ rows styled as mockup `.detail-block`: top border, serif question, rotating chevron. */
export function FaqList({ faqs }: { faqs: PublicFaq[] }) {
  return (
    <div className="border-b border-line">
      {faqs.map((faq) => (
        <details key={faq.id} className="faq-item group border-t border-line">
          <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-6 py-[26px] text-h3 leading-snug font-display text-charcoal hover:text-green">
            <span>{faq.question}</span>
            <ChevronDown
              aria-hidden="true"
              strokeWidth={1.5}
              className="faq-icon size-5 shrink-0 text-green"
            />
          </summary>
          <TextBlock text={faq.answer} className="max-w-[680px] pb-7 text-muted-foreground" />
        </details>
      ))}
    </div>
  );
}

/** True when the hotel configured anything the location block can show. */
export function hasLocation(hotel: PublicHotel): boolean {
  return Boolean(mapLinks(hotel) || hotel.directions || hotel.nearbyAttractions);
}

/** Location: address + directions card and the on-demand map card (mockup contact grid). */
export function LocationBlock({
  hotel,
  showDetails = true,
}: {
  hotel: PublicHotel;
  showDetails?: boolean;
}) {
  const links = mapLinks(hotel);
  const address = fullAddress(hotel);
  const hasCard = Boolean(
    address || (showDetails && (hotel.directions || hotel.nearbyAttractions)),
  );
  return (
    <div className="grid gap-7 *:min-w-0 desk:grid-cols-[0.85fr_1.15fr]">
      {hasCard ? (
        <div className={cardClass('panel')}>
          {address ? (
            <>
              <p className="detail-label">{ui.contact.address}</p>
              <p className="text-h3 leading-snug font-display text-charcoal">{address}</p>
            </>
          ) : null}
          {showDetails && hotel.directions ? (
            <div className="detail-block mt-6">
              <h2 className="detail-label">{ui.map.directions}</h2>
              <TextBlock text={hotel.directions} className="text-muted-foreground" />
            </div>
          ) : null}
          {showDetails && hotel.nearbyAttractions ? (
            <div className="detail-block">
              <h2 className="detail-label">{ui.location.nearby}</h2>
              <TextBlock text={hotel.nearbyAttractions} className="text-muted-foreground" />
            </div>
          ) : null}
        </div>
      ) : null}
      {links ? (
        <div className={hasCard ? '' : 'desk:col-span-2'}>
          <MapEmbed
            hotelName={hotel.name}
            embedUrl={links.embedUrl}
            directionsUrl={links.directionsUrl}
            address={address}
          />
        </div>
      ) : null}
    </div>
  );
}

export function hasContact(hotel: PublicHotel, whatsappUrl: string | null): boolean {
  return Boolean(
    whatsappUrl ||
    hotel.phone ||
    hotel.email ||
    fullAddress(hotel) ||
    hotel.openingHours?.length ||
    hotel.checkInTime ||
    hotel.checkOutTime,
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-line py-[18px]">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right font-bold text-charcoal">{children}</dd>
    </div>
  );
}

const valueLink =
  'underline decoration-sage decoration-2 underline-offset-4 transition-colors hover:decoration-green';

/** Contact rows (mockup `.contact-list`): only the fields the hotel configured. */
export function ContactList({
  hotel,
  whatsappUrl,
}: {
  hotel: PublicHotel;
  whatsappUrl: string | null;
}) {
  const address = fullAddress(hotel);
  return (
    <dl className="border-b border-line">
      {whatsappUrl && hotel.whatsappNumber ? (
        <Row label="WhatsApp">
          <WhatsAppLink href={whatsappUrl} source="contact" icon={false} className={valueLink}>
            {displayPhone(hotel.whatsappNumber)}
          </WhatsAppLink>
        </Row>
      ) : null}
      {hotel.phone ? (
        <Row label={ui.contact.phone}>
          <a href={telHref(hotel.phone)} className={valueLink}>
            {hotel.phone}
          </a>
        </Row>
      ) : null}
      {hotel.email ? (
        <Row label={ui.contact.email}>
          <a href={`mailto:${hotel.email}`} className={`${valueLink} break-all`}>
            {hotel.email}
          </a>
        </Row>
      ) : null}
      {address ? <Row label={ui.contact.address}>{address}</Row> : null}
      {hotel.openingHours?.length ? (
        <Row label={ui.contact.hours}>
          {hotel.openingHours.map((row) => (
            <span key={`${row.days}-${row.hours}`} className="block">
              {row.days}: {row.hours}
            </span>
          ))}
        </Row>
      ) : null}
      {hotel.checkInTime ? <Row label={ui.contact.checkIn}>{hotel.checkInTime}</Row> : null}
      {hotel.checkOutTime ? <Row label={ui.contact.checkOut}>{hotel.checkOutTime}</Row> : null}
    </dl>
  );
}
