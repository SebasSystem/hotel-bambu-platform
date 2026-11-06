import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { cardClass } from '@/components/ui/card';
import { ui } from '@/lib/i18n/es';
import { paragraphs } from '@/lib/public/format';
import { displayPhone, fullAddress, mapLinks, telHref } from '@/lib/public/site';
import type { PublicFaq, PublicHotel, PublicNearbyPlace } from '@/lib/public/types';
import { SiteIcon } from './icon';
import { MapEmbed } from './map-embed';
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

/** Nearby places with their measured distance and travel time (admin › Lugares cercanos). */
export function NearbyList({ places }: { places: PublicNearbyPlace[] }) {
  if (places.length === 0) return null;
  return (
    <ul data-testid="nearby-places" className="border-b border-line">
      {places.map((place) => {
        const meta = [place.distanceText, place.travelTimeText].filter(Boolean).join(' · ');
        return (
          <li
            key={place.id}
            className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-line py-3.5"
          >
            <span className="font-bold text-charcoal">
              {place.name}
              {place.category ? (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {place.category}
                </span>
              ) : null}
            </span>
            {meta ? <span className="text-sm text-ink-muted-strong">{meta}</span> : null}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Location: address card (with the nearby places and, on the location page, the directions text)
 * and the on-demand map card (mockup contact grid). Works without nearby places.
 */
export function LocationBlock({
  hotel,
  nearby = [],
  showDetails = true,
  children,
}: {
  hotel: PublicHotel;
  nearby?: PublicNearbyPlace[];
  showDetails?: boolean;
  /** Extra content after the address (a flex column: `mt-auto` pins actions to the bottom). */
  children?: ReactNode;
}) {
  const links = mapLinks(hotel);
  const address = fullAddress(hotel);
  const hasCard = Boolean(
    address ||
    nearby.length > 0 ||
    children ||
    (showDetails && (hotel.directions || hotel.nearbyAttractions)),
  );
  // Without nearby places or directions the card is short: keep its natural height next to the
  // map instead of stretching it into an empty box (D7 empty-data review).
  const light =
    nearby.length === 0 && !(showDetails && (hotel.directions || hotel.nearbyAttractions));
  return (
    <div
      className={[
        'grid gap-7 *:min-w-0 desk:grid-cols-[0.85fr_1.15fr]',
        light ? 'desk:items-start' : '',
      ].join(' ')}
    >
      {hasCard ? (
        <div className={`${cardClass('panel')} flex flex-col`}>
          {address ? (
            <>
              <p className="detail-label">{ui.contact.address}</p>
              <p className="text-h3 leading-snug font-display text-charcoal">{address}</p>
            </>
          ) : null}
          {nearby.length > 0 ? (
            <div className="detail-block mt-6">
              <h3 className="detail-label">{ui.location.nearby}</h3>
              <NearbyList places={nearby} />
            </div>
          ) : null}
          {showDetails && hotel.directions ? (
            <div className="detail-block mt-6">
              <h3 className="detail-label">{ui.map.directions}</h3>
              <TextBlock text={hotel.directions} className="text-muted-foreground" />
            </div>
          ) : null}
          {showDetails && hotel.nearbyAttractions ? (
            <div className="detail-block">
              <h3 className="detail-label">{ui.location.surroundings}</h3>
              <TextBlock text={hotel.nearbyAttractions} className="text-muted-foreground" />
            </div>
          ) : null}
          {children ? <div className="mt-7 flex flex-1 flex-col">{children}</div> : null}
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
  showAddress = true,
}: {
  hotel: PublicHotel;
  whatsappUrl: string | null;
  /** Off when the address is already shown above the list. */
  showAddress?: boolean;
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
      {showAddress && address ? <Row label={ui.contact.address}>{address}</Row> : null}
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
