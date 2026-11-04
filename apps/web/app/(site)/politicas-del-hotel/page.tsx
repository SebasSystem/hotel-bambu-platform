import type { Metadata } from 'next';
import { TextBlock } from '@/components/site/blocks';
import { PageHeader } from '@/components/site/page-header';
import { container } from '@/components/site/styles';
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

/** Hotel policies (requirement 4.1): check-in/out times, published policies, ESCNNA notice. */
export default async function PoliciesPage() {
  const [site, policies] = await Promise.all([getSite(), getPolicies()]);
  const { hotel } = site;
  const hasTimes = Boolean(hotel.checkInTime || hotel.checkOutTime);

  return (
    <>
      <PageHeader path={routes.policies} title={ui.nav.policies} />
      <div className={`${container} py-16`}>
        <div className="grid max-w-4xl gap-12">
          {hasTimes ? (
            <dl className="grid gap-6 rounded-xl bg-sand-100 p-8 sm:grid-cols-2">
              {hotel.checkInTime ? (
                <div>
                  <dt className="text-sm text-muted-foreground">{ui.contact.checkIn}</dt>
                  <dd className="mt-1 font-display text-3xl text-bamboo-900">
                    {hotel.checkInTime}
                  </dd>
                </div>
              ) : null}
              {hotel.checkOutTime ? (
                <div>
                  <dt className="text-sm text-muted-foreground">{ui.contact.checkOut}</dt>
                  <dd className="mt-1 font-display text-3xl text-bamboo-900">
                    {hotel.checkOutTime}
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : null}

          {policies.map((policy) => (
            <section key={policy.id} aria-labelledby={`politica-${policy.id}`}>
              <h2 id={`politica-${policy.id}`} className="text-2xl font-medium text-bamboo-900">
                {policy.title}
              </h2>
              <TextBlock text={policy.content} className="mt-4 text-foreground/90" />
            </section>
          ))}

          {hotel.escnnaNotice ? (
            <aside className="rounded-xl border border-sand-200 bg-card p-8 text-sm leading-normal">
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
