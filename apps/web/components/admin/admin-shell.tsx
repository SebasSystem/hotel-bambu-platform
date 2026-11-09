'use client';

import {
  BedDouble,
  DoorOpen,
  ExternalLink,
  FileText,
  GalleryHorizontal,
  Hotel,
  ImageUp,
  Images,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  MapPin,
  Share2,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { BrandLogo } from '@/components/brand/brand-logo';
import { ACCESS_DENIED_PARAM, canAccess, isAccessDenied } from '@/lib/admin/access';
import { browserApi, setCsrfToken } from '@/lib/api/browser';
import { describeApiError } from '@/lib/forms/form-errors';
import { useAdmin } from './admin-context';
import { AdminDrawer } from './admin-drawer';
import { useToast } from './feedback';
import { Notice, buttonClasses, cx } from './ui';

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface AdminNavGroup {
  /** Null for the ungrouped first item (Resumen). */
  label: string | null;
  items: readonly AdminNavItem[];
}

/**
 * Grouped navigation in Spanish (docs/research/admin-ux.md §3.1, adapted to the C2/C3 routes).
 * Each item is shown only when the role may open it (`canAccess`, lib/admin/access.ts).
 */
export const ADMIN_NAV: readonly AdminNavGroup[] = [
  { label: null, items: [{ href: '/admin', label: 'Resumen', icon: LayoutDashboard }] },
  {
    label: 'Hotel',
    items: [
      { href: '/admin/hotel', label: 'Datos del hotel', icon: Hotel },
      { href: '/admin/nearby-places', label: 'Ubicación y lugares cercanos', icon: MapPin },
    ],
  },
  {
    label: 'Habitaciones',
    items: [
      { href: '/admin/room-types', label: 'Tipos de habitación', icon: BedDouble },
      { href: '/admin/rooms', label: 'Habitaciones', icon: DoorOpen },
      { href: '/admin/amenities', label: 'Comodidades', icon: Sparkles },
    ],
  },
  {
    label: 'Contenido',
    items: [
      { href: '/admin/content', label: 'Secciones de la portada', icon: LayoutTemplate },
      { href: '/admin/hero-slides', label: 'Carrusel principal', icon: GalleryHorizontal },
      { href: '/admin/gallery', label: 'Galería', icon: Images },
      { href: '/admin/media', label: 'Fotos y medios', icon: ImageUp },
      { href: '/admin/policies', label: 'Políticas y preguntas', icon: FileText },
      { href: '/admin/social', label: 'Redes sociales', icon: Share2 },
    ],
  },
  {
    label: 'Usuarios',
    items: [
      { href: '/admin/users', label: 'Usuarios', icon: Users },
      { href: '/admin/roles', label: 'Roles', icon: ShieldCheck },
    ],
  },
  { label: 'Cuenta', items: [{ href: '/admin/account', label: 'Mi cuenta', icon: UserRound }] },
];

/** Navigation filtered by the role's permissions; groups left empty are dropped. */
export function visibleNav(
  nav: readonly AdminNavGroup[],
  permissions: readonly string[],
): AdminNavGroup[] {
  return nav
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccess(permissions, item.href)),
    }))
    .filter((group) => group.items.length > 0);
}

export function isActive(pathname: string, href: string): boolean {
  return href === '/admin'
    ? pathname === '/admin'
    : pathname === href || pathname.startsWith(`${href}/`);
}

/** Group and item for the topbar breadcrumb. */
export function activeNav(pathname: string): { group: string | null; item: AdminNavItem } | null {
  for (const group of ADMIN_NAV) {
    const item = group.items.find((entry) => isActive(pathname, entry.href));
    if (item) return { group: group.label, item };
  }
  return null;
}

function AdminNav({ pathname, idPrefix }: { pathname: string; idPrefix: string }) {
  const { user } = useAdmin();
  return (
    <nav aria-label="Panel" className="mt-6 flex-1">
      {visibleNav(ADMIN_NAV, user.permissions).map((group, index) => {
        const headingId = group.label ? `${idPrefix}-group-${index}` : undefined;
        return (
          <div key={group.label ?? 'root'} className={index > 0 ? 'mt-5' : undefined}>
            {group.label ? (
              <p
                id={headingId}
                className="mb-1.5 px-[13px] text-[0.6875rem] font-bold tracking-label text-sage uppercase"
              >
                {group.label}
              </p>
            ) : null}
            <ul aria-labelledby={headingId} className="grid gap-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = isActive(pathname, href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? 'page' : undefined}
                      className={cx(
                        'flex min-h-11 items-center gap-[11px] rounded-[10px] px-[13px] py-2 text-[0.9rem] leading-snug transition-colors duration-(--duration-fast)',
                        active
                          ? 'bg-white/12 font-bold text-white'
                          : 'text-on-dark-muted hover:bg-white/8 hover:text-white',
                      )}
                    >
                      <Icon aria-hidden="true" className="size-[18px] shrink-0" strokeWidth={1.5} />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

function initials(name: string): string {
  const parts = name.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'A';
}

function UserBlock({ onLogout, loggingOut }: { onLogout: () => void; loggingOut: boolean }) {
  const { user } = useAdmin();
  const name = user.name ?? user.email;
  return (
    <div className="mt-6 border-t border-white/13 pt-4">
      <div className="flex items-center gap-3 px-1">
        <span
          aria-hidden="true"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-pill bg-white/12 text-xs font-bold text-white"
        >
          {initials(name)}
        </span>
        <div className="min-w-0 text-[0.8rem] leading-snug">
          <p className="truncate font-bold text-white" title={name}>
            {name}
          </p>
          {user.name ? (
            <p className="truncate text-sage" title={user.email}>
              {user.email}
            </p>
          ) : null}
          <p className="truncate text-on-dark-muted" title={`Rol: ${user.role.name}`}>
            <span className="sr-only">Rol: </span>
            {user.role.name}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onLogout}
        disabled={loggingOut}
        aria-busy={loggingOut || undefined}
        className="mt-3 flex min-h-11 w-full items-center gap-[11px] rounded-[10px] px-[13px] text-[0.9rem] text-on-dark-muted transition-colors hover:bg-white/8 hover:text-white disabled:opacity-60"
      >
        <LogOut aria-hidden="true" className="size-[18px]" strokeWidth={1.5} /> Cerrar sesión
      </button>
    </div>
  );
}

/**
 * Explains a redirect from a page the role may not open (`?acceso=denegado`, set by
 * `requirePermission` in lib/admin/session.ts).
 */
function AccessDeniedNotice() {
  const params = useSearchParams();
  if (!isAccessDenied(params.get(ACCESS_DENIED_PARAM))) return null;
  return (
    <div role="status" className="mb-6">
      <Notice tone="warning" title="Sección no disponible">
        No tiene permiso para abrir esa sección. Le mostramos la primera sección disponible para su
        rol; si necesita acceso, pídalo a un administrador.
      </Notice>
    </div>
  );
}

/** How long the scrollbar stays highlighted after the last scroll event. */
const SCROLLING_IDLE_MS = 900;

/**
 * Sets `data-scrolling` on the scrolling element (the document or the given ref) while the user
 * scrolls, so styles/admin.css can make the thin scrollbar clearer only then.
 */
function useScrollingFlag(ref?: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const target: HTMLElement | Window | null = ref ? ref.current : window;
    if (!target) return;
    const flagged = ref ? ref.current! : document.documentElement;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      flagged.setAttribute('data-scrolling', '');
      clearTimeout(timer);
      timer = setTimeout(() => flagged.removeAttribute('data-scrolling'), SCROLLING_IDLE_MS);
    };
    target.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      target.removeEventListener('scroll', onScroll);
      clearTimeout(timer);
      flagged.removeAttribute('data-scrolling');
    };
  }, [ref]);
}

/**
 * Admin shell on the mockup layout: a 260 px deep-green sidebar (brand, grouped nav, user block)
 * and a 74 px white topbar with the breadcrumb and "Ver sitio". Below the desktop breakpoint the
 * sidebar becomes a modal drawer (AdminDrawer) and nothing overflows the viewport. The document
 * and the sidebar use the thin admin scrollbar (`data-admin-shell`, `.admin-scroll`).
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const [loggingOut, setLoggingOut] = useState(false);
  const current = activeNav(pathname);
  const sidebarRef = useRef<HTMLDivElement>(null);
  useScrollingFlag();
  useScrollingFlag(sidebarRef);

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

  const brand = (
    <Link href="/admin" className="inline-flex flex-col gap-2 rounded-sm px-1">
      <BrandLogo tone="dark" cutColor="var(--color-green-900)" decorative />
      <span className="pl-[51px] text-[0.6875rem] font-bold tracking-label text-sage uppercase">
        Administración
      </span>
      <span className="sr-only">Hotel Bambú Plaza, ir al resumen del panel</span>
    </Link>
  );

  return (
    <div
      data-admin-shell=""
      className="min-h-dvh bg-admin-bg desk:grid desk:grid-cols-[260px_minmax(0,1fr)]"
    >
      <a
        href="#admin-main"
        data-surface="dark"
        className="fixed top-4 left-4 z-(--z-skip-link) -translate-y-[200%] rounded-xs bg-charcoal px-4 py-3 font-bold text-white focus:translate-y-0"
      >
        Saltar al contenido
      </a>
      {/* The green column spans the whole page; its content sticks to the viewport (defect 9). */}
      <aside data-admin-inert="" data-surface="dark" className="hidden bg-green-900 desk:block">
        <div
          ref={sidebarRef}
          className="admin-scroll sticky top-0 flex h-dvh flex-col overflow-y-auto px-[18px] py-6 text-ivory"
        >
          {brand}
          <AdminNav pathname={pathname} idPrefix="sidebar" />
          <UserBlock onLogout={() => void logout()} loggingOut={loggingOut} />
        </div>
      </aside>
      <div className="flex min-w-0 flex-col">
        <header
          data-admin-inert=""
          className="sticky top-0 z-(--z-header) flex h-[74px] items-center gap-3 border-b border-line bg-white px-[clamp(16px,4vw,48px)]"
        >
          <AdminDrawer>
            {brand}
            <AdminNav pathname={pathname} idPrefix="drawer" />
            <UserBlock onLogout={() => void logout()} loggingOut={loggingOut} />
          </AdminDrawer>
          <p className="min-w-0 flex-1 truncate text-[0.95rem] leading-tight tab:text-[1.05rem]">
            {current?.group && current.group !== current.item.label ? (
              <span className="hidden text-muted-foreground tab:inline">
                {current.group}
                <span aria-hidden="true" className="px-2">
                  /
                </span>
              </span>
            ) : null}
            <span className="font-bold">{current?.item.label ?? 'Panel'}</span>
          </p>
          <Link
            href="/"
            target="_blank"
            className={buttonClasses('secondary', 'md', 'shrink-0 px-3 tab:px-5')}
          >
            <ExternalLink aria-hidden="true" className="size-4" />
            <span className="max-tab:sr-only">Ver sitio</span>
            <span className="sr-only"> (se abre en una pestaña nueva)</span>
          </Link>
        </header>
        <main
          id="admin-main"
          data-admin-inert=""
          tabIndex={-1}
          className="mx-auto w-full max-w-[1200px] flex-1 px-[clamp(16px,4vw,46px)] py-[clamp(22px,4vw,40px)] outline-none"
        >
          <Suspense fallback={null}>
            <AccessDeniedNotice />
          </Suspense>
          {children}
        </main>
      </div>
    </div>
  );
}
