'use client';

import { MapPin, Navigation } from 'lucide-react';
import { useState } from 'react';
import { useConsent } from '@/components/consent/consent-manager';
import { trackEvent } from '@/lib/analytics/track';
import { ui } from '@/lib/i18n/es';
import { buttonClass } from '@/components/ui/button';

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
    <div className="overflow-hidden rounded-lg border border-line bg-paper">
      <div className="relative min-h-[330px] w-full min-w-0 aspect-[4/3] tab:aspect-[16/10]">
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
          <div className="map-placeholder absolute inset-0 flex items-end p-5 tab:p-8">
            <div
              data-surface="dark"
              className="grid max-w-md gap-3 rounded-md bg-[rgb(17_31_24/0.72)] p-5 text-white backdrop-blur-[8px]"
            >
              <p className="inline-flex items-center gap-2 font-bold">
                <MapPin aria-hidden="true" strokeWidth={1.5} className="size-5 shrink-0" />
                {address ?? hotelName}
              </p>
              <p className="text-xs leading-normal text-white/80">{ui.map.notice}</p>
              <button
                type="button"
                className={`${buttonClass('light')} justify-self-start`}
                onClick={() => {
                  setClickedFor(decisionKey);
                  trackEvent({ type: 'MAP_CLICK', source: 'location' });
                }}
              >
                {ui.map.load}
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4">
        <span className="text-sm text-muted-foreground">{hotelName}</span>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass('primary')}
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
