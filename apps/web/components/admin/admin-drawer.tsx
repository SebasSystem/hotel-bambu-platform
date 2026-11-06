'use client';

import { Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { focusableWithin, trapTab } from '@/lib/a11y/focus-trap';

/** Same value as `--breakpoint-desk`: the fixed sidebar takes over from here. */
const DESKTOP_QUERY = '(min-width: 62.5rem)';

/**
 * Admin navigation drawer below the desktop breakpoint (mockup defect 8: the mockup admin rendered
 * 856 px wide on a 390 px phone). A modal panel portalled to <body>: focus moves in and is trapped,
 * Escape / close button / backdrop / route change / desktop resize close it, the page behind
 * (`[data-admin-inert]`) is inert and does not scroll, and focus returns to the toggle once the page
 * is interactive again.
 */
export function AdminDrawer({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef(false);

  const close = useCallback((returnFocus: boolean) => {
    restoreFocus.current = returnFocus;
    setOpen(false);
  }, []);

  const lastPath = useRef(pathname);
  useEffect(() => {
    if (lastPath.current !== pathname) {
      lastPath.current = pathname;
      close(false);
    }
  }, [pathname, close]);

  useEffect(() => {
    if (!open) {
      // Runs after the previous effect's cleanup removed `inert`, so the toggle can take focus.
      if (restoreFocus.current) {
        restoreFocus.current = false;
        toggleRef.current?.focus();
      }
      return;
    }
    const panel = panelRef.current;
    if (panel) focusableWithin(panel)[0]?.focus();

    const background = [...document.querySelectorAll<HTMLElement>('[data-admin-inert]')];
    background.forEach((element) => element.setAttribute('inert', ''));
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = 'hidden';

    const desktop =
      typeof window.matchMedia === 'function' ? window.matchMedia(DESKTOP_QUERY) : null;
    const onDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) close(false);
    };
    desktop?.addEventListener('change', onDesktop);

    return () => {
      background.forEach((element) => element.removeAttribute('inert'));
      root.style.overflow = overflow;
      desktop?.removeEventListener('change', onDesktop);
    };
  }, [open, close]);

  return (
    <>
      <button
        ref={toggleRef}
        type="button"
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-pill border border-line-strong bg-white text-foreground hover:border-green desk:hidden"
        aria-expanded={open}
        aria-controls="admin-drawer"
        aria-label="Abrir menú del panel"
        onClick={() => setOpen(true)}
      >
        <Menu aria-hidden="true" className="size-5" strokeWidth={1.75} />
      </button>
      {open
        ? createPortal(
            <div className="fixed inset-0 z-(--z-overlay) desk:hidden">
              <div
                data-admin-backdrop=""
                aria-hidden="true"
                className="absolute inset-0 bg-charcoal/55"
                onClick={() => close(true)}
              />
              <div
                id="admin-drawer"
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label="Menú del panel"
                data-surface="dark"
                className="admin-drawer absolute inset-y-0 left-0 flex w-[min(19rem,86vw)] flex-col overflow-y-auto bg-green-900 px-[18px] pt-4 pb-6 text-ivory shadow-lg"
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    event.stopPropagation();
                    close(true);
                    return;
                  }
                  if (panelRef.current) trapTab(event, panelRef.current);
                }}
              >
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="inline-flex size-11 items-center justify-center rounded-pill text-ivory hover:bg-white/10"
                    aria-label="Cerrar menú del panel"
                    onClick={() => close(true)}
                  >
                    <X aria-hidden="true" className="size-5" strokeWidth={1.75} />
                  </button>
                </div>
                {children}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
