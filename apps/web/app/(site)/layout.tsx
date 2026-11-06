import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import type { ReactNode } from 'react';
import '@/styles/site.css';
import { ConsentProvider } from '@/components/consent/consent-manager';
import { Footer } from '@/components/site/footer';
import { Header } from '@/components/site/header';
import { MotionBoot } from '@/components/site/motion-boot';
import { WhatsAppFab } from '@/components/site/whatsapp-fab';
import { CONSENT_COOKIE, parseConsentValue } from '@/lib/consent/consent';
import { ui } from '@/lib/i18n/es';
import { getSite } from '@/lib/public/api';
import { whatsAppLink } from '@/lib/public/whatsapp';

export async function generateMetadata(): Promise<Metadata> {
  const { hotel } = await getSite();
  return {
    title: { default: hotel.name, template: `%s · ${hotel.name}` },
    description: hotel.shortDescription ?? undefined,
  };
}

/**
 * Public site shell: skip link, header, main landmark, footer, floating WhatsApp and the cookie
 * consent manager. The consent cookie is read on the server so the map can render already
 * loaded for visitors who granted functional cookies (no flash, no banner flicker).
 */
export default async function SiteLayout({ children }: { children: ReactNode }) {
  const [site, cookieStore] = await Promise.all([getSite(), cookies()]);
  const whatsappUrl = whatsAppLink(site, { kind: 'general' });
  const consent = parseConsentValue(cookieStore.get(CONSENT_COOKIE)?.value);

  return (
    <ConsentProvider initial={consent}>
      <a href="#contenido" className="skip-link">
        {ui.skipToContent}
      </a>
      <Header hotelName={site.hotel.name} whatsappUrl={whatsappUrl} />
      <main id="contenido" tabIndex={-1} data-menu-inert="" className="outline-none">
        {children}
      </main>
      {/* On phones the floating WhatsApp button must not cover the last footer row (spec defect 5). */}
      <div
        data-menu-inert=""
        className={whatsappUrl ? 'bg-charcoal pb-[79px] tab:pb-0' : undefined}
      >
        <Footer site={site} whatsappUrl={whatsappUrl} />
      </div>
      {whatsappUrl ? <WhatsAppFab href={whatsappUrl} /> : null}
      <MotionBoot />
    </ConsentProvider>
  );
}
