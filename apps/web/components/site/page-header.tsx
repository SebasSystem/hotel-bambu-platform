import Link from 'next/link';
import type { ReactNode } from 'react';
import { ui } from '@/lib/i18n/es';
import { routes } from '@/lib/public/navigation';
import { breadcrumbJsonLd } from '@/lib/seo/json-ld';
import { JsonLd } from '../seo/json-ld';
import { SectionHeading } from './section';
import { container } from './styles';

interface PageHeaderProps {
  title: string;
  /** Canonical path of the page: adds the BreadcrumbList JSON-LD (requirement 19.2). */
  path?: string;
  kicker?: string | null;
  intro?: string | null;
  /** Intermediate crumbs between "Inicio" and the current page. */
  crumbs?: { href: string; label: string }[];
  children?: ReactNode;
}

/** Inner-page header: breadcrumb, H1 and intro on sand. */
export function PageHeader({ title, path, kicker, intro, crumbs = [], children }: PageHeaderProps) {
  return (
    <div className="border-b border-line bg-sand">
      {path ? (
        <JsonLd
          data={breadcrumbJsonLd([
            { name: ui.nav.home, path: routes.home },
            ...crumbs.map((crumb) => ({ name: crumb.label, path: crumb.href })),
            { name: title, path },
          ])}
        />
      ) : null}
      <div className={`${container} pt-[clamp(2.5rem,6vw,5rem)] pb-[3.75rem]`}>
        <nav
          aria-label="Ruta de navegación"
          className="mb-[clamp(1.5rem,4vw,3rem)] text-sm text-ink-muted-strong"
        >
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link
                href={routes.home}
                className="underline-offset-4 hover:text-green hover:underline"
              >
                {ui.nav.home}
              </Link>
            </li>
            {crumbs.map((crumb) => (
              <li key={crumb.href} className="flex items-center gap-2">
                <span aria-hidden="true">/</span>
                <Link
                  href={crumb.href}
                  className="underline-offset-4 hover:text-green hover:underline"
                >
                  {crumb.label}
                </Link>
              </li>
            ))}
            <li className="flex items-center gap-2">
              <span aria-hidden="true">/</span>
              <span aria-current="page" className="text-charcoal">
                {title}
              </span>
            </li>
          </ol>
        </nav>
        <SectionHeading as="h1" surface="sand" kicker={kicker} title={title} intro={intro} />
        {children}
      </div>
    </div>
  );
}
