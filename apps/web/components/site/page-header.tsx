import Link from 'next/link';
import type { ReactNode } from 'react';
import { ui } from '@/lib/i18n/es';
import { routes } from '@/lib/public/navigation';
import { SectionHeading } from './section';
import { container } from './styles';

interface PageHeaderProps {
  title: string;
  kicker?: string | null;
  intro?: string | null;
  /** Visible breadcrumb (JSON-LD BreadcrumbList arrives in T7). */
  crumbs?: { href: string; label: string }[];
  children?: ReactNode;
}

/** Inner-page header: breadcrumb, H1 and intro on sand. */
export function PageHeader({ title, kicker, intro, crumbs = [], children }: PageHeaderProps) {
  return (
    <div className="border-b border-sand-200 bg-sand-100">
      <div className={`${container} pt-10 pb-14 sm:pt-14 sm:pb-16`}>
        <nav aria-label="Ruta de navegación" className="mb-8 text-sm text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link
                href={routes.home}
                className="underline-offset-4 hover:text-bamboo-700 hover:underline"
              >
                {ui.nav.home}
              </Link>
            </li>
            {crumbs.map((crumb) => (
              <li key={crumb.href} className="flex items-center gap-2">
                <span aria-hidden="true">/</span>
                <Link
                  href={crumb.href}
                  className="underline-offset-4 hover:text-bamboo-700 hover:underline"
                >
                  {crumb.label}
                </Link>
              </li>
            ))}
            <li className="flex items-center gap-2">
              <span aria-hidden="true">/</span>
              <span aria-current="page" className="text-foreground">
                {title}
              </span>
            </li>
          </ol>
        </nav>
        <SectionHeading as="h1" kicker={kicker} title={title} intro={intro} />
        {children}
      </div>
    </div>
  );
}
