import type { AnalyticsSource } from '@hotel-bambu/shared';
import { Phone } from 'lucide-react';
import type { ReactNode } from 'react';
import type { ContactCta } from '@/lib/public/cta';
import { WhatsAppLink } from './whatsapp-link';

interface ContactCtaLinkProps {
  cta: ContactCta;
  source: AnalyticsSource;
  className?: string;
  /** Visible text of the WhatsApp variant (default "Escríbenos por WhatsApp"). */
  whatsappLabel?: ReactNode;
  /** Visible text of the phone variant (default "Llamar al 310 679 8260"). */
  phoneLabel?: ReactNode;
  /** Published room type slug, for the aggregated WhatsApp counter. */
  entityId?: string;
  icon?: boolean;
  /** Accessible name when the visible text is shortened (icon buttons, compact cards). */
  ariaLabel?: string;
}

/**
 * Renders the site contact CTA (`contactCta`): the WhatsApp link (new tab, consented click event)
 * or a `tel:` link when the hotel has no WhatsApp number yet.
 */
export function ContactCtaLink({
  cta,
  source,
  className,
  whatsappLabel,
  phoneLabel,
  entityId,
  icon = true,
  ariaLabel,
}: ContactCtaLinkProps) {
  if (cta.kind === 'whatsapp') {
    return (
      <WhatsAppLink
        href={cta.href}
        source={source}
        entityId={entityId}
        className={className}
        icon={icon}
        ariaLabel={ariaLabel}
      >
        {whatsappLabel}
      </WhatsAppLink>
    );
  }
  return (
    <a href={cta.href} className={className} aria-label={ariaLabel}>
      {icon ? <Phone aria-hidden="true" strokeWidth={1.75} className="size-5 shrink-0" /> : null}
      {phoneLabel ?? cta.label}
    </a>
  );
}
