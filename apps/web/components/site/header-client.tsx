'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { isActivePath } from '@/lib/public/navigation';

/**
 * Desktop navigation link: `aria-current` for the active section (nested routes included), shown
 * as the mockup's green underline that grows from the left (styles/site.css `.nav-link`).
 */
export function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const pathname = usePathname();
  return (
    <Link
      href={href}
      className="nav-link"
      aria-current={isActivePath(pathname, href) ? 'page' : undefined}
    >
      {children}
    </Link>
  );
}
