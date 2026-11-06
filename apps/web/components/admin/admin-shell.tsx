'use client';

import {
  BedDouble,
  CircleHelp,
  FileText,
  Hotel,
  Images,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Menu,
  MessageCircle,
  Share2,
  Tag,
  UserRound,
  Wifi,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { browserApi, setCsrfToken } from '@/lib/api/browser';
import { useAdmin } from './admin-context';
import { useToast } from './feedback';
import { describeApiError } from '@/lib/forms/form-errors';
import { Button, cx } from './ui';

/** Navigation per requirement 9.1. */
export const ADMIN_NAV = [
  { href: '/admin', label: 'Resumen', icon: LayoutDashboard },
  { href: '/admin/hotel', label: 'Información del hotel', icon: Hotel },
  { href: '/admin/rooms', label: 'Habitaciones', icon: BedDouble },
  { href: '/admin/amenities', label: 'Comodidades', icon: Wifi },
  { href: '/admin/promotions', label: 'Promociones', icon: Tag },
  { href: '/admin/media', label: 'Medios', icon: Images },
  { href: '/admin/gallery', label: 'Galería', icon: Images },
  { href: '/admin/content', label: 'Contenido de la landing', icon: LayoutTemplate },
  { href: '/admin/faq', label: 'Preguntas frecuentes', icon: CircleHelp },
  { href: '/admin/policies', label: 'Políticas del hotel', icon: FileText },
  { href: '/admin/social', label: 'Redes sociales', icon: Share2 },
  { href: '/admin/whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { href: '/admin/account', label: 'Mi cuenta', icon: UserRound },
] as const;

export function isActive(pathname: string, href: string): boolean {
  return href === '/admin'
    ? pathname === '/admin'
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAdmin();
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const logout = async () => {
    setLoggingOut(true);
    try {
      await browserApi.post('/auth/logout');
      setCsrfToken(null);
      router.replace('/admin/login');
      router.refresh();
    } catch (error) {
      toast.error(describeApiError(error));
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[16rem_1fr]">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-(--z-overlay) focus:rounded-sm focus:bg-card focus:p-3"
      >
        Saltar al contenido
      </a>
      <header className="flex items-center justify-between border-b border-border bg-surface-dark px-4 py-3 text-on-surface-dark md:hidden">
        <span className="font-display text-lg font-semibold">Hotel Bambú Plaza</span>
        <Button
          variant="ghost"
          size="sm"
          className="text-on-surface-dark hover:bg-bamboo-800"
          aria-expanded={menuOpen}
          aria-controls="admin-nav"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? (
            <X aria-hidden="true" className="size-5" />
          ) : (
            <Menu aria-hidden="true" className="size-5" />
          )}
          Menú
        </Button>
      </header>
      <aside
        className={cx(
          'bg-surface-dark text-on-surface-dark md:sticky md:top-0 md:flex md:h-dvh md:flex-col',
          menuOpen ? 'flex flex-col' : 'hidden',
        )}
      >
        <div className="hidden px-5 pt-6 pb-4 md:block">
          <p className="font-display text-xl font-semibold">Hotel Bambú Plaza</p>
          <p className="text-xs text-on-surface-dark-muted">Panel de administración</p>
        </div>
        <nav id="admin-nav" aria-label="Panel" className="flex-1 overflow-y-auto px-3 py-2">
          <ul className="flex flex-col gap-0.5">
            {ADMIN_NAV.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => setMenuOpen(false)}
                    className={cx(
                      'flex min-h-10 items-center gap-3 rounded-sm px-3 text-sm',
                      active
                        ? 'bg-bamboo-700 font-semibold text-white'
                        : 'text-on-surface-dark hover:bg-bamboo-800',
                    )}
                  >
                    <Icon aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.5} />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-bamboo-800 p-4 text-sm">
          <p className="truncate text-on-surface-dark-muted" title={user.email}>
            {user.name ?? user.email}
          </p>
          <div className="mt-2 flex gap-2">
            <Link
              href="/"
              className="text-on-surface-dark underline underline-offset-4"
              target="_blank"
            >
              Ver el sitio
            </Link>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 w-full justify-start text-on-surface-dark hover:bg-bamboo-800"
            loading={loggingOut}
            onClick={() => void logout()}
          >
            <LogOut aria-hidden="true" className="size-4" /> Cerrar sesión
          </Button>
        </div>
      </aside>
      <main id="admin-main" className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
        {children}
      </main>
    </div>
  );
}
