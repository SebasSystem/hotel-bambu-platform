'use client';

import { MapPin, Navigation } from 'lucide-react';
import { useState } from 'react';
import { useConsent } from '@/components/consent/consent-manager';
import { trackEvent } from '@/lib/analytics/track';
import { ui } from '@/lib/i18n/es';
import { button } from './styles';

interface MapEmbedProps {
  hotelName: string;
  embedUrl: string;
  directionsUrl: string;
  address: string | null;
}

/**
 * Google Maps on demand (requirement 17.5): a static placeholder until the visitor clicks
 * "Cargar mapa" (the iframe may set third-party cookies), or loaded automatically when the visitor
 * granted functional cookies. Withdrawing that consent unloads it. "Cómo llegar" is always available.
 */
export function MapEmbed({ hotelName, embedUrl, directionsUrl, address }: MapEmbedProps) {
  const { consent } = useConsent();
  const functional = consent?.functional === true;
  // The manual click is remembered per consent decision: a new decision without functional
  // cookies (withdrawal, 17.5.8) unloads the iframe again.
  const [clickedFor, setClickedFor] = useState<string | null>(null);
  const decisionKey = consent ? `${consent.id}:${String(consent.functional)}` : 'none';
  const loaded = functional || clickedFor === decisionKey;

  return (
    <div className="overflow-hidden rounded-lg border border-sand-200 bg-sand-100">
      <div className="relative aspect-[4/3] w-full sm:aspect-[16/10]">
        {loaded ? (
          <iframe
            src={embedUrl}
            title={ui.map.title(hotelName)}
            className="absolute inset-0 size-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        ) : (
          <div className="map-placeholder absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <span className="inline-flex size-14 items-center justify-center rounded-pill bg-sand-50 text-bamboo-700 shadow-sm">
              <MapPin aria-hidden="true" strokeWidth={1.5} className="size-7" />
            </span>
            {address ? <p className="font-semibold text-bamboo-900">{address}</p> : null}
            <p className="max-w-sm text-xs leading-normal text-muted-foreground">{ui.map.notice}</p>
            <button
              type="button"
              className={button.outline}
              onClick={() => {
                setClickedFor(decisionKey);
                trackEvent({ type: 'MAP_CLICK', source: 'location' });
              }}
            >
              {ui.map.load}
            </button>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sand-200 bg-sand-50 px-4 py-3">
        <span className="text-sm text-muted-foreground">{hotelName}</span>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={button.primary}
          onClick={() => trackEvent({ type: 'MAP_CLICK', source: 'location' })}
        >
          <Navigation aria-hidden="true" strokeWidth={1.75} className="size-4" />
          {ui.map.directions}
          <span className="sr-only"> {ui.whatsapp.newTab}</span>
        </a>
      </div>
    </div>
  );
}
