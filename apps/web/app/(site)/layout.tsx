import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@/styles/site.css';
import { Footer } from '@/components/site/footer';
import { Header } from '@/components/site/header';
import { MotionBoot } from '@/components/site/motion-boot';
import { WhatsAppFab } from '@/components/site/whatsapp-fab';
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

/** Public site shell: skip link, header, main landmark, footer, floating WhatsApp. */
export default async function SiteLayout({ children }: { children: ReactNode }) {
  const site = await getSite();
  const whatsappUrl = whatsAppLink(site, { kind: 'general' });

  return (
    <>
      <a href="#contenido" className="skip-link">
        {ui.skipToContent}
      </a>
      <Header hotelName={site.hotel.name} whatsappUrl={whatsappUrl} />
      <main id="contenido" tabIndex={-1} className="pt-(--header-h) outline-none">
        {children}
      </main>
      <Footer site={site} whatsappUrl={whatsappUrl} />
      {whatsappUrl ? <WhatsAppFab href={whatsappUrl} /> : null}
      <MotionBoot />
    </>
  );
}
