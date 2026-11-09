'use client';

import type { AnalyticsSource } from '@hotel-bambu/shared';
import type { ReactNode } from 'react';
import { trackEvent } from '@/lib/analytics/track';
import { ui } from '@/lib/i18n/es';
import { WhatsAppIcon } from './whatsapp-icon';

interface WhatsAppLinkProps {
  href: string;
  source: AnalyticsSource;
  /** Published room slug, for the aggregated counter. */
  entityId?: string;
  className?: string;
  children?: ReactNode;
  icon?: boolean;
  ariaLabel?: string;
}

/**
 * Every WhatsApp entry point (requirement 5): new tab, `noopener noreferrer`, and a
 * `WHATSAPP_CLICK` event only when analytics consent exists (`trackEvent`). The icon is the
 * WhatsApp brand glyph (`WhatsAppIcon`).
 */
export function WhatsAppLink({
  href,
  source,
  entityId,
  className,
  children,
  icon = true,
  ariaLabel,
}: WhatsAppLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label={ariaLabel}
      onClick={() => trackEvent({ type: 'WHATSAPP_CLICK', source, entityId })}
    >
      {icon ? <WhatsAppIcon /> : null}
      {children ?? ui.whatsapp.cta}
      {ariaLabel ? null : <span className="sr-only"> {ui.whatsapp.newTab}</span>}
    </a>
  );
}
