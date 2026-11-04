import type { Metadata } from 'next';
import { ContactDetails, hasContact } from '@/components/site/blocks';
import { PageHeader } from '@/components/site/page-header';
import { button, container } from '@/components/site/styles';
import { WhatsAppLink } from '@/components/site/whatsapp-link';
import { ui } from '@/lib/i18n/es';
import { pageMetadata } from '@/lib/seo/metadata';
import { routes } from '@/lib/public/navigation';
import { getSite } from '@/lib/public/api';
import { sectionOf } from '@/lib/public/site';
import { whatsAppLink } from '@/lib/public/whatsapp';

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return pageMetadata({
    path: routes.contact,
    siteName: site.hotel.name,
    title: ui.nav.contact,
    description: `Contacta a ${site.hotel.name}: WhatsApp, teléfono, correo y horarios.`,
  });
}

export default async function ContactPage() {
  const site = await getSite();
  const section = sectionOf(site, 'CONTACT');
  const whatsappUrl = whatsAppLink(site, { kind: 'general' });

  return (
    <>
      <PageHeader
        path={routes.contact}
        title={section?.title ?? ui.nav.contact}
        kicker={section?.subtitle}
        intro={section?.body}
      />
      <div className={`${container} grid gap-12 py-16 lg:grid-cols-12`}>
        {hasContact(site.hotel, whatsappUrl) ? (
          <div className="lg:col-span-6">
            <ContactDetails hotel={site.hotel} whatsappUrl={whatsappUrl} />
          </div>
        ) : (
          <p className="text-lg text-muted-foreground lg:col-span-6">{ui.empty.contact}</p>
        )}
        {whatsappUrl ? (
          <aside className="h-fit rounded-xl bg-sand-100 p-8 lg:col-span-5 lg:col-start-8">
            <h2 className="text-2xl font-medium text-bamboo-900">{ui.whatsapp.cta}</h2>
            <p className="mt-3 leading-normal text-muted-foreground">{ui.closing.withWhatsApp}</p>
            <WhatsAppLink
              href={whatsappUrl}
              source="contact"
              className={`${button.whatsapp} mt-6`}
            />
            <p className="mt-4 text-xs leading-normal text-muted-foreground">
              {ui.whatsapp.external}
            </p>
          </aside>
        ) : null}
      </div>
    </>
  );
}
