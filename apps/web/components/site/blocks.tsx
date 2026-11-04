import { ArrowRight, Clock, Mail, MapPin, Phone, Plus } from 'lucide-react';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { ui } from '@/lib/i18n/es';
import { paragraphs } from '@/lib/public/format';
import { routes } from '@/lib/public/navigation';
import { ROOM_TYPES_PUBLIC, type RoomTypeSummary } from '@/lib/public/rooms';
import { displayPhone, fullAddress, mapLinks, telHref } from '@/lib/public/site';
import type {
  PublicAmenity,
  PublicFaq,
  PublicHotel,
  PublicMedia,
  PublicService,
} from '@/lib/public/types';
import { SiteIcon } from './icon';
import { MapEmbed } from './map-embed';
import { Picture } from './picture';
import { RoomPrice } from './room-price';
import { button, link } from './styles';
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

export function RoomTypeCards({
  types,
  hasWhatsApp,
}: {
  types: RoomTypeSummary[];
  hasWhatsApp: boolean;
}) {
  return (
    <ul className="grid gap-8 md:grid-cols-2">
      {types.map((summary, index) => {
        const meta = ROOM_TYPES_PUBLIC[summary.type];
        return (
          <li
            key={summary.type}
            data-reveal
            style={{ '--i': index } as CSSProperties}
            className="group relative grid overflow-hidden rounded-xl bg-card shadow-sm sm:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]"
          >
            <div className="aspect-[4/5] overflow-hidden bg-sand-100 sm:aspect-auto sm:h-full">
              {summary.cover ? (
                <Picture
                  media={summary.cover}
                  sizes="(min-width: 64rem) 260px, (min-width: 40rem) 40vw, 92vw"
                  className="block size-full"
                  imgClassName="room-card-img size-full object-cover"
                />
              ) : null}
            </div>
            <div className="flex flex-col p-6 sm:p-7">
              <h3 className="text-2xl font-medium text-bamboo-900">
                <Link
                  href={`${routes.rooms}?tipo=${meta.param}`}
                  className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded-xl focus-visible:after:outline-2 focus-visible:after:outline-ring"
                >
                  {meta.plural}
                </Link>
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {ui.rooms.countLabel(summary.count)} · {ui.rooms.capacity(summary.maxCapacity)}
              </p>
              {summary.sharedAmenities.length > 0 ? (
                <ul className="mt-5 grid gap-2 text-sm text-ink-600">
                  {summary.sharedAmenities.slice(0, 4).map((amenity) => (
                    <li key={amenity.name} className="inline-flex items-center gap-2">
                      <SiteIcon iconKey={amenity.iconKey} className="size-4 text-bamboo-700" />
                      {amenity.name}
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-auto flex items-end justify-between gap-4 pt-6">
                <RoomPrice
                  room={
                    summary.cheapest ?? {
                      basePrice: null,
                      priceUnit: 'PER_NIGHT',
                      taxesIncluded: true,
                    }
                  }
                  hasWhatsApp={hasWhatsApp}
                />
                <span
                  aria-hidden="true"
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-pill bg-bamboo-100 text-bamboo-700 transition-colors group-hover:bg-bamboo-700 group-hover:text-white"
                >
                  <ArrowRight className="size-5" strokeWidth={1.75} />
                </span>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Highlighted services on the dark band (solar panels, water reserve, internet…). */
export function ServiceList({
  services,
  onDark = false,
}: {
  services: PublicService[];
  onDark?: boolean;
}) {
  return (
    <ul className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((service, index) => (
        <li key={service.id} data-reveal style={{ '--i': index } as CSSProperties}>
          {service.media ? (
            <div className="mb-5 aspect-[4/3] overflow-hidden rounded-lg">
              <Picture
                media={service.media}
                sizes="(min-width: 64rem) 30vw, (min-width: 40rem) 45vw, 92vw"
                className="block size-full"
                imgClassName="size-full object-cover"
              />
            </div>
          ) : (
            <span
              className={`inline-flex size-12 items-center justify-center rounded-pill ${
                onDark ? 'bg-bamboo-800 text-cane-500' : 'bg-bamboo-100 text-bamboo-700'
              }`}
            >
              <SiteIcon iconKey={service.iconKey} className="size-6" />
            </span>
          )}
          <h3 className={`mt-5 text-xl font-medium ${onDark ? 'text-sand-50' : 'text-bamboo-900'}`}>
            {service.name}
          </h3>
          {service.description ? (
            <p
              className={`mt-2 leading-normal ${onDark ? 'text-sand-50/75' : 'text-muted-foreground'}`}
            >
              {service.description}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function AmenityChips({
  amenities,
  onDark = false,
}: {
  amenities: PublicAmenity[];
  onDark?: boolean;
}) {
  return (
    <ul className="flex flex-wrap gap-3">
      {amenities.map((amenity) => (
        <li
          key={amenity.id}
          className={`inline-flex items-center gap-2 rounded-pill px-4 py-2 text-sm font-semibold ${
            onDark ? 'bg-bamboo-800 text-sand-50' : 'bg-bamboo-100 text-bamboo-900'
          }`}
        >
          <SiteIcon
            iconKey={amenity.iconKey}
            className={`size-4 ${onDark ? 'text-bamboo-300' : 'text-bamboo-700'}`}
          />
          {amenity.name}
        </li>
      ))}
    </ul>
  );
}

/** Home gallery teaser: swipeable row on mobile (scroll-snap), mosaic on desktop. */
export function GalleryTeaser({ images }: { images: PublicMedia[] }) {
  return (
    <>
      <ul className="snap-row -mx-(--gutter) px-(--gutter) md:hidden" aria-label={ui.nav.gallery}>
        {images.map((media) => (
          <li key={media.id} className="aspect-[3/4] overflow-hidden rounded-lg bg-sand-100">
            <Picture
              media={media}
              sizes="78vw"
              className="block size-full"
              imgClassName="size-full object-cover"
            />
          </li>
        ))}
      </ul>
      <ul className="hidden gap-4 md:grid md:grid-cols-4 md:grid-rows-2 lg:h-[40rem]">
        {images.slice(0, 5).map((media, index) => (
          <li
            key={media.id}
            data-reveal
            style={{ '--i': index } as CSSProperties}
            className={`overflow-hidden rounded-lg bg-sand-100 ${
              index === 0 ? 'md:col-span-2 md:row-span-2' : 'aspect-[3/4] lg:aspect-auto'
            }`}
          >
            <Picture
              media={media}
              sizes={
                index === 0 ? '(min-width: 80rem) 620px, 50vw' : '(min-width: 80rem) 300px, 25vw'
              }
              className="block size-full"
              imgClassName="size-full object-cover"
            />
          </li>
        ))}
      </ul>
    </>
  );
}

export function FaqList({ faqs }: { faqs: PublicFaq[] }) {
  return (
    <div className="divide-y divide-sand-200 border-y border-sand-200">
      {faqs.map((faq) => (
        <details key={faq.id} className="faq-item group">
          <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-6 py-5 text-lg font-semibold text-bamboo-900 hover:text-bamboo-700">
            <span>{faq.question}</span>
            <Plus
              aria-hidden="true"
              strokeWidth={1.5}
              className="faq-icon size-6 shrink-0 text-bamboo-700"
            />
          </summary>
          <TextBlock text={faq.answer} className="pb-6 text-muted-foreground" />
        </details>
      ))}
    </div>
  );
}

/** True when the hotel configured anything the location block can show. */
export function hasLocation(hotel: PublicHotel): boolean {
  return Boolean(mapLinks(hotel) || hotel.directions || hotel.nearbyAttractions);
}

export function LocationBlock({
  hotel,
  showDetails = true,
}: {
  hotel: PublicHotel;
  showDetails?: boolean;
}) {
  const links = mapLinks(hotel);
  const address = fullAddress(hotel);
  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
      <div className="lg:col-span-5">
        {address ? (
          <p className="flex items-start gap-3 text-lg font-semibold text-bamboo-900">
            <MapPin
              aria-hidden="true"
              strokeWidth={1.5}
              className="mt-1 size-5 shrink-0 text-bamboo-700"
            />
            {address}
          </p>
        ) : null}
        {showDetails && hotel.directions ? (
          <div className="mt-8">
            <h3 className="text-xl font-medium text-bamboo-900">{ui.map.directions}</h3>
            <TextBlock text={hotel.directions} className="mt-3 text-muted-foreground" />
          </div>
        ) : null}
        {showDetails && hotel.nearbyAttractions ? (
          <div className="mt-8">
            <h3 className="text-xl font-medium text-bamboo-900">{ui.location.nearby}</h3>
            <TextBlock text={hotel.nearbyAttractions} className="mt-3 text-muted-foreground" />
          </div>
        ) : null}
      </div>
      {links ? (
        <div className="lg:col-span-7">
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

/** Contact details (requirement 4.2.9): only the fields the hotel configured. */
export function ContactDetails({
  hotel,
  whatsappUrl,
}: {
  hotel: PublicHotel;
  whatsappUrl: string | null;
}) {
  const address = fullAddress(hotel);
  const item = 'flex items-start gap-3';
  const icon = 'mt-0.5 size-5 shrink-0 text-bamboo-700';
  return (
    <ul className="grid gap-5 text-base">
      {whatsappUrl && hotel.whatsappNumber ? (
        <li className={item}>
          <SiteIcon iconKey="message-circle" className={icon} />
          <span>
            <span className="block text-sm text-muted-foreground">WhatsApp</span>
            <WhatsAppLink href={whatsappUrl} source="contact" icon={false} className={link}>
              {displayPhone(hotel.whatsappNumber)}
            </WhatsAppLink>
          </span>
        </li>
      ) : null}
      {hotel.phone ? (
        <li className={item}>
          <Phone aria-hidden="true" strokeWidth={1.5} className={icon} />
          <span>
            <span className="block text-sm text-muted-foreground">{ui.contact.phone}</span>
            <a href={telHref(hotel.phone)} className={link}>
              {hotel.phone}
            </a>
          </span>
        </li>
      ) : null}
      {hotel.email ? (
        <li className={item}>
          <Mail aria-hidden="true" strokeWidth={1.5} className={icon} />
          <span>
            <span className="block text-sm text-muted-foreground">{ui.contact.email}</span>
            <a href={`mailto:${hotel.email}`} className={link}>
              {hotel.email}
            </a>
          </span>
        </li>
      ) : null}
      {address ? (
        <li className={item}>
          <MapPin aria-hidden="true" strokeWidth={1.5} className={icon} />
          <span>
            <span className="block text-sm text-muted-foreground">{ui.contact.address}</span>
            {address}
          </span>
        </li>
      ) : null}
      {hotel.openingHours?.length ? (
        <li className={item}>
          <Clock aria-hidden="true" strokeWidth={1.5} className={icon} />
          <span>
            <span className="block text-sm text-muted-foreground">{ui.contact.hours}</span>
            {hotel.openingHours.map((row) => (
              <span key={`${row.days}-${row.hours}`} className="block">
                {row.days}: {row.hours}
              </span>
            ))}
          </span>
        </li>
      ) : null}
      {hotel.checkInTime || hotel.checkOutTime ? (
        <li className={item}>
          <SiteIcon iconKey="key-round" className={icon} />
          <span>
            {hotel.checkInTime ? (
              <span className="block">
                {ui.contact.checkIn}: {hotel.checkInTime}
              </span>
            ) : null}
            {hotel.checkOutTime ? (
              <span className="block">
                {ui.contact.checkOut}: {hotel.checkOutTime}
              </span>
            ) : null}
          </span>
        </li>
      ) : null}
    </ul>
  );
}

/** Closing call to action (WhatsApp when configured, otherwise the rooms page). */
export function ClosingCta({
  title,
  whatsappUrl,
  hotel,
}: {
  title: string;
  whatsappUrl: string | null;
  hotel: PublicHotel;
}) {
  const showDetails = hasContact(hotel, whatsappUrl);
  return (
    <section aria-labelledby="cierre" className="bg-sand-100 py-(--section-y)">
      <div className="mx-auto grid w-full max-w-(--container-site) gap-12 px-(--gutter) lg:grid-cols-12">
        <div className="lg:col-span-6">
          <h2 id="cierre" data-reveal className="text-4xl font-medium text-balance text-bamboo-900">
            {title}
          </h2>
          <p data-reveal className="mt-5 max-w-lg text-lg leading-normal text-muted-foreground">
            {whatsappUrl ? ui.closing.withWhatsApp : ui.closing.withoutWhatsApp}
          </p>
          <div data-reveal className="mt-8 flex flex-col gap-3 sm:flex-row">
            {whatsappUrl ? (
              <WhatsAppLink href={whatsappUrl} source="contact" className={button.whatsapp} />
            ) : null}
            <Link href={routes.rooms} className={whatsappUrl ? button.outline : button.primary}>
              {ui.rooms.seeAll}
            </Link>
          </div>
        </div>
        {showDetails ? (
          <div className="rounded-xl bg-sand-50 p-8 lg:col-span-5 lg:col-start-8">
            <ContactDetails hotel={hotel} whatsappUrl={whatsappUrl} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
