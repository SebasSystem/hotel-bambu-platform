'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ui } from '@/lib/i18n/es';
import { mainNav, routes } from '@/lib/public/navigation';
import { button } from './styles';
import { WhatsAppLink } from './whatsapp-link';

/** Header state as data attributes (styled in styles/site.css): overlay on home, scrolled. */
export function HeaderFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 24);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <header
      className="site-header"
      data-overlay={pathname === routes.home ? 'true' : 'false'}
      data-scrolled={scrolled ? 'true' : 'false'}
    >
      {children}
    </header>
  );
}

/**
 * Mobile navigation in a native modal `<dialog>`: focus is trapped and Esc closes it; focus
 * returns to the menu button. Hidden from `lg` up, where the inline navigation shows.
 */
export function MobileMenu({ whatsappUrl }: { whatsappUrl: string | null }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    dialogRef.current?.close();
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        className="menu-button inline-flex size-11 items-center justify-center rounded-pill lg:hidden"
        aria-haspopup="dialog"
        aria-controls="mobile-menu"
        onClick={() => dialogRef.current?.showModal()}
      >
        <Menu aria-hidden="true" strokeWidth={1.75} className="size-6" />
        <span className="sr-only">{ui.menu.open}</span>
      </button>
      <dialog
        id="mobile-menu"
        ref={dialogRef}
        aria-label={ui.menu.label}
        className="mobile-menu"
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
      >
        <div className="flex min-h-full flex-col px-(--gutter) pt-4 pb-10">
          <div className="flex justify-end">
            <button
              type="button"
              className="inline-flex size-11 items-center justify-center rounded-pill text-bamboo-900 hover:bg-sand-100"
              onClick={() => dialogRef.current?.close()}
            >
              <X aria-hidden="true" strokeWidth={1.75} className="size-6" />
              <span className="sr-only">{ui.menu.close}</span>
            </button>
          </div>
          <nav aria-label={ui.menu.label} className="mt-4">
            <ul className="flex flex-col">
              <li>
                <Link href={routes.home} className="mobile-nav-link">
                  {ui.nav.home}
                </Link>
              </li>
              {mainNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="mobile-nav-link"
                    aria-current={pathname === item.href ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          {whatsappUrl ? (
            <div className="mt-auto pt-10">
              <WhatsAppLink
                href={whatsappUrl}
                source="header"
                className={`${button.whatsapp} w-full`}
              />
            </div>
          ) : null}
        </div>
      </dialog>
    </>
  );
}

/** Desktop navigation link with `aria-current` for the active section. */
export function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link href={href} className="nav-link" aria-current={active ? 'page' : undefined}>
      {children}
    </Link>
  );
}
