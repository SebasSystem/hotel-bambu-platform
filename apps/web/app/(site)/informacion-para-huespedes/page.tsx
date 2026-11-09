import type { Metadata } from 'next';
import { FaqList, TextBlock } from '@/components/site/blocks';
import { ContactCtaLink } from '@/components/site/contact-cta';
import { PageHeader } from '@/components/site/page-header';
import { container } from '@/components/site/styles';
import { buttonClass } from '@/components/ui/button';
import { cardClass } from '@/components/ui/card';
import { SectionHeading } from '@/components/ui/section-heading';
import { ui } from '@/lib/i18n/es';
import { pageMetadata } from '@/lib/seo/metadata';
import { policiesSeo } from '@/lib/seo/page-seo';
import { routes } from '@/lib/public/navigation';
import { getFaqs, getPolicies, getSite, getSiteImages } from '@/lib/public/api';
import { contactCta } from '@/lib/public/cta';

export async function generateMetadata(): Promise<Metadata> {
  const [site, images] = await Promise.all([getSite(), getSiteImages()]);
  const seo = policiesSeo(site.hotel);
  const meta = pageMetadata({
    path: routes.policies,
    siteName: site.hotel.name,
    title: seo.title,
    description: seo.description,
    image: images[0] ?? null,
  });
  return { ...meta, title: { absolute: seo.title } };
}

/**
 * "Información para huéspedes" (owner review 2026-11-08; formerly `/politicas-del-hotel`, and C3
 * merged `/preguntas-frecuentes` here; both answer a 301): check-in/out figures, each published policy as a mockup detail block inside a paper card,
 * then the visible FAQ (no FAQPage markup: the rich result is retired) and the
 * contact card.
 */
export default async function GuestInfoPage() {
  const [site, policies, faqs] = await Promise.all([getSite(), getPolicies(), getFaqs()]);
  const { hotel } = site;
  const cta = contactCta(site, { kind: 'general' });
  const hasTimes = Boolean(hotel.checkInTime || hotel.checkOutTime);

  return (
    <>
      <PageHeader
        path={routes.policies}
        title={ui.pages.policies}
        kicker={ui.home.policiesKicker}
        intro={ui.pages.policiesIntro}
      />
      <div className={`${container} pt-12 pb-[110px]`}>
        <div className="grid max-w-4xl gap-7">
          {hasTimes ? (
            <dl className="grid gap-6 rounded-lg bg-sand p-[clamp(28px,4vw,48px)] xs:grid-cols-2">
              {hotel.checkInTime ? (
                <div>
                  <dt className="detail-label">{ui.contact.checkIn}</dt>
                  <dd className="font-display text-fact leading-none text-green">
                    {hotel.checkInTime}
                  </dd>
                </div>
              ) : null}
              {hotel.checkOutTime ? (
                <div>
                  <dt className="detail-label">{ui.contact.checkOut}</dt>
                  <dd className="font-display text-fact leading-none text-green">
                    {hotel.checkOutTime}
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : null}

          {policies.length > 0 ? (
            <div
              className={`${cardClass('panel')} [&>section:first-child]:border-t-0 [&>section:first-child]:pt-0`}
            >
              {policies.map((policy) => (
                <section
                  key={policy.id}
                  aria-labelledby={`politica-${policy.id}`}
                  className="detail-block last:pb-0"
                >
                  <h2 id={`politica-${policy.id}`} className="text-h3 text-charcoal">
                    {policy.title}
                  </h2>
                  <TextBlock text={policy.content} className="mt-3 text-charcoal/90" />
                </section>
              ))}
            </div>
          ) : null}

          {!hasTimes && policies.length === 0 && faqs.length === 0 ? (
            <p className="text-lg text-muted-foreground">{ui.empty.generic}</p>
          ) : null}
        </div>

        {faqs.length > 0 || cta ? (
          <section
            id="preguntas-frecuentes"
            aria-labelledby="preguntas-title"
            className="mt-[clamp(56px,7vw,96px)] grid scroll-mt-28 gap-12 desk:grid-cols-[1.4fr_0.6fr]"
          >
            <div>
              <SectionHeading id="preguntas-title" title={ui.faq.title} className="mb-8" />
              {faqs.length > 0 ? <FaqList faqs={faqs} /> : null}
            </div>
            {cta ? (
              <aside className={`${cardClass('panel')} h-fit desk:mt-[88px]`}>
                <h3 className="text-h3 text-charcoal">{ui.faq.other}</h3>
                <p className="mt-3 text-sm text-muted-foreground">
                  {cta.kind === 'whatsapp' ? ui.whatsapp.external : ui.rooms.confirm}
                </p>
                <ContactCtaLink
                  cta={cta}
                  source="faq"
                  className={`${buttonClass('primary')} mt-6`}
                />
              </aside>
            ) : null}
          </section>
        ) : null}
      </div>
    </>
  );
}
