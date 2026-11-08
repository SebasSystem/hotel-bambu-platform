import Link from 'next/link';
import type { ReactNode } from 'react';
import { ui } from '@/lib/i18n/es';
import { routes } from '@/lib/public/navigation';
import { chipClass } from '@/components/ui/chip';
import { breadcrumbJsonLd } from '@/lib/seo/json-ld';
import { JsonLd } from '../seo/json-ld';
import { SectionHeading } from '@/components/ui/section-heading';
import { container } from './styles';

interface PageHeaderProps {
  title: string;
  /** Breadcrumb name of the page when it differs from the H1 (default: the title). */
  crumbName?: string;
  /** Canonical path of the page: adds the BreadcrumbList JSON-LD (requirement 19.2). */
  path?: string;
  kicker?: string | null;
  intro?: string | null;
  /** Intermediate crumbs between "Inicio" and the current page. */
  crumbs?: { href: string; label: string }[];
  children?: ReactNode;
}

const crumbLink = 'underline-offset-4 hover:text-green hover:underline';

/**
 * Visible breadcrumb ("Inicio / Habitaciones / Habitación de pareja"), shared by `PageHeader` and
 * the room type page. The BreadcrumbList JSON-LD is rendered by the caller.
 */
export function Breadcrumbs({
  crumbs = [],
  current,
  className = '',
}: {
  /** Intermediate crumbs between "Inicio" and the current page. */
  crumbs?: { href: string; label: string }[];
  current: string;
  className?: string;
}) {
  return (
    <nav aria-label={ui.breadcrumb} className={`text-sm text-ink-muted-strong ${className}`}>
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link href={routes.home} className={crumbLink}>
            {ui.nav.home}
          </Link>
        </li>
        {crumbs.map((crumb) => (
          <li key={crumb.href} className="flex items-center gap-2">
            <span aria-hidden="true">/</span>
            <Link href={crumb.href} className={crumbLink}>
              {crumb.label}
            </Link>
          </li>
        ))}
        <li className="flex items-center gap-2">
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="text-charcoal">
            {current}
          </span>
        </li>
      </ol>
    </nav>
  );
}

/**
 * Inner-page header: breadcrumb, H1 and intro on sand. Compact (owner review 2026-11-08) so the
 * page content starts above the fold.
 */
export function PageHeader({
  title,
  crumbName = title,
  path,
  kicker,
  intro,
  crumbs = [],
  children,
}: PageHeaderProps) {
  return (
    <div className="border-b border-line bg-sand">
      {path ? (
        <JsonLd
          data={breadcrumbJsonLd([
            { name: ui.nav.home, path: routes.home },
            ...crumbs.map((crumb) => ({ name: crumb.label, path: crumb.href })),
            { name: crumbName, path },
          ])}
        />
      ) : null}
      <div
        className={`${container} pt-[clamp(1.5rem,3vw,2.5rem)] pb-[clamp(1.75rem,3.5vw,2.5rem)]`}
      >
        <Breadcrumbs crumbs={crumbs} current={crumbName} className="mb-[clamp(1rem,2vw,1.5rem)]" />
        <SectionHeading as="h1" surface="sand" eyebrow={kicker} title={title} intro={intro} />
        {children}
      </div>
    </div>
  );
}

/**
 * Filter toolbar under the page hero (mockup `.toolbar`): single-select chips on the left as links
 * (`?tipo=` / `?categoria=`, shareable and indexable) and a live result count on the right.
 */
export function Toolbar({
  label,
  count,
  children,
}: {
  label: string;
  count: string;
  children?: ReactNode;
}) {
  return (
    <div className="border-b border-line bg-paper">
      <div
        className={`${container} flex flex-col gap-3 py-5 tab:flex-row tab:items-center tab:justify-between`}
      >
        {children ? (
          <nav aria-label={label}>
            <ul className="flex flex-wrap gap-2">{children}</ul>
          </nav>
        ) : (
          <span />
        )}
        <p aria-live="polite" className="text-sm font-bold text-muted-foreground">
          {count}
        </p>
      </div>
    </div>
  );
}

export function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        scroll={false}
        aria-current={active ? 'page' : undefined}
        className={`${chipClass(active)} min-h-11`}
      >
        {children}
      </Link>
    </li>
  );
}
