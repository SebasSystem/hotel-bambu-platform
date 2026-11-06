import type { Metadata } from 'next';
import { FaqList } from '@/components/site/blocks';
import { PageHeader } from '@/components/site/page-header';
import { container } from '@/components/site/styles';
import { WhatsAppLink } from '@/components/site/whatsapp-link';
import { JsonLd } from '@/components/seo/json-ld';
import { buttonClass } from '@/components/ui/button';
import { cardClass } from '@/components/ui/card';
import { ui } from '@/lib/i18n/es';
import { pageMetadata } from '@/lib/seo/metadata';
import { faqJsonLd } from '@/lib/seo/json-ld';
import { routes } from '@/lib/public/navigation';
import { getFaqs, getSite } from '@/lib/public/api';
import { sectionOf } from '@/lib/public/site';
import { whatsAppLink } from '@/lib/public/whatsapp';

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return pageMetadata({
    path: routes.faq,
    siteName: site.hotel.name,
    title: ui.nav.faq,
    description: `Respuestas a las preguntas más frecuentes sobre ${site.hotel.name}.`,
  });
}

/** FAQ (spec §4): rows styled as mockup detail blocks, a WhatsApp card on the side. */
export default async function FaqPage() {
  const [site, faqs] = await Promise.all([getSite(), getFaqs()]);
  const section = sectionOf(site, 'FAQ');
  const whatsappUrl = whatsAppLink(site, { kind: 'general' });

  return (
    <>
      {faqs.length > 0 ? <JsonLd data={faqJsonLd(faqs)} /> : null}
      <PageHeader
        path={routes.faq}
        title={ui.nav.faq}
        kicker={section?.subtitle}
        intro={section?.body}
      />
      <div className={`${container} grid gap-12 pt-12 pb-[110px] desk:grid-cols-[1.4fr_0.6fr]`}>
        <div>
          {faqs.length > 0 ? (
            <FaqList faqs={faqs} />
          ) : (
            <p className="text-lg text-muted-foreground">{ui.empty.generic}</p>
          )}
        </div>
        {whatsappUrl ? (
          <aside className={`${cardClass('panel')} h-fit`}>
            <h2 className="text-h3 text-charcoal">{ui.faq.other}</h2>
            <p className="mt-3 text-sm text-muted-foreground">{ui.whatsapp.external}</p>
            <WhatsAppLink
              href={whatsappUrl}
              source="faq"
              className={`${buttonClass('primary')} mt-6`}
            />
          </aside>
        ) : null}
      </div>
    </>
  );
}
