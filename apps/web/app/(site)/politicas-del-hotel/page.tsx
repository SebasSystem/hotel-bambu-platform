import type { Metadata } from 'next';
import { TextBlock } from '@/components/site/blocks';
import { PageHeader } from '@/components/site/page-header';
import { container } from '@/components/site/styles';
import { cardClass } from '@/components/ui/card';
import { ui } from '@/lib/i18n/es';
import { pageMetadata } from '@/lib/seo/metadata';
import { routes } from '@/lib/public/navigation';
import { getPolicies, getSite } from '@/lib/public/api';

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return pageMetadata({
    path: routes.policies,
    siteName: site.hotel.name,
    title: ui.nav.policies,
    description: `Check-in, check-out y políticas de ${site.hotel.name}.`,
  });
}

/**
 * Hotel policies (requirement 4.1, spec §4): check-in/out figures, then each published policy as
 * a mockup detail block inside a paper card, and the ESCNNA notice.
 */
export default async function PoliciesPage() {
  const [site, policies] = await Promise.all([getSite(), getPolicies()]);
  const { hotel } = site;
  const hasTimes = Boolean(hotel.checkInTime || hotel.checkOutTime);

  return (
    <>
      <PageHeader path={routes.policies} title={ui.nav.policies} />
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

          {hotel.escnnaNotice ? (
            <aside className="rounded-lg border border-line bg-notice-bg p-7 text-sm text-notice-fg">
              <TextBlock text={hotel.escnnaNotice} />
            </aside>
          ) : null}

          {!hasTimes && policies.length === 0 ? (
            <p className="text-lg text-muted-foreground">{ui.empty.generic}</p>
          ) : null}
        </div>
      </div>
    </>
  );
}
