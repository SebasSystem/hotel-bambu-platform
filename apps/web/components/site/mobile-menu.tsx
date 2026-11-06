'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { buttonClass, iconButtonClass } from '@/components/ui/button';
import { trapTab, focusableWithin } from '@/lib/a11y/focus-trap';
import { ui } from '@/lib/i18n/es';
import { isActivePath, type NavItem } from '@/lib/public/navigation';
import { WhatsAppLink } from './whatsapp-link';

/** Same value as `--breakpoint-desk`: the desktop navigation takes over from here. */
const DESKTOP_QUERY = '(min-width: 62.5rem)';

/**
 * Mobile navigation (mockup `.mobile-menu`, with its defects fixed): a panel under the header, the
 * toggle swaps to a close icon, focus moves into the panel and is trapped between the toggle and
 * the panel, Escape / backdrop / route change / desktop resize close it, focus returns to the
 * toggle, and the page behind (`[data-menu-inert]`) is inert and does not scroll.
 */
export function MobileMenu({
  links,
  whatsappUrl,
}: {
  links: readonly NavItem[];
  whatsappUrl: string | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) toggleRef.current?.focus();
  }, []);

  // Close on navigation (also covers links to the current page through onClick below).
  const lastPath = useRef(pathname);
  useEffect(() => {
    if (lastPath.current !== pathname) {
      lastPath.current = pathname;
      setOpen(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (panel) focusableWithin(panel)[0]?.focus();

    const background = [...document.querySelectorAll<HTMLElement>('[data-menu-inert]')];
    background.forEach((element) => element.setAttribute('inert', ''));
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = 'hidden';

    const desktop =
      typeof window.matchMedia === 'function' ? window.matchMedia(DESKTOP_QUERY) : null;
    const onDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false);
    };
    desktop?.addEventListener('change', onDesktop);

    return () => {
      background.forEach((element) => element.removeAttribute('inert'));
      root.style.overflow = overflow;
      desktop?.removeEventListener('change', onDesktop);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="desk:hidden"
      onKeyDown={(event) => {
        if (!open) return;
        if (event.key === 'Escape') {
          event.stopPropagation();
          close(true);
          return;
        }
        if (rootRef.current) trapTab(event, rootRef.current);
      }}
    >
      <button
        ref={toggleRef}
        type="button"
        className={iconButtonClass()}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? ui.menu.close : ui.menu.open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? (
          <X aria-hidden="true" strokeWidth={1.5} />
        ) : (
          <Menu aria-hidden="true" strokeWidth={1.5} />
        )}
      </button>

      {open ? (
        <>
          <div
            data-menu-backdrop=""
            aria-hidden="true"
            className="mobile-menu-backdrop"
            onClick={() => close(false)}
          />
          <div id="mobile-menu" ref={panelRef} className="mobile-menu">
            <nav aria-label={ui.menu.label}>
              <ul className="grid gap-[3px]">
                {links.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="mobile-nav-link"
                      aria-current={isActivePath(pathname, item.href) ? 'page' : undefined}
                      onClick={() => setOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            {whatsappUrl ? (
              <WhatsAppLink
                href={whatsappUrl}
                source="header"
                className={`${buttonClass('primary')} mt-3 w-full`}
              />
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
