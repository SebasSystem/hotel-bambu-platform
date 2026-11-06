import { ArrowLeft, LockKeyhole } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandLogo } from '@/components/brand/brand-logo';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Iniciar sesión' };

function safeNext(value: string | string[] | undefined): string {
  const next = Array.isArray(value) ? value[0] : value;
  // Only same-site admin paths (no open redirect: reject "//host" and absolute URLs).
  return next && next.startsWith('/admin') && !next.startsWith('/admin/login') ? next : '/admin';
}

/** Login on the admin brand: the deep-green brand panel beside a white form card. */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return (
    <div
      data-admin=""
      className="min-h-dvh bg-admin-bg desk:grid desk:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]"
    >
      <aside
        data-surface="dark"
        className="relative flex flex-col justify-between overflow-hidden bg-green-900 px-[clamp(20px,5vw,64px)] py-6 text-ivory desk:py-12"
      >
        <BrandLogo tone="dark" cutColor="var(--color-green-900)" label="Hotel Bambú Plaza, Mocoa" />
        <div className="hidden desk:block">
          <p className="text-xs font-bold tracking-kicker text-sage uppercase">
            Panel de administración
          </p>
          <p className="mt-4 max-w-md font-display text-[clamp(2.2rem,3.4vw,3.2rem)] leading-tight tracking-[-0.03em]">
            Todo el contenido del sitio, en un solo lugar.
          </p>
          <p className="mt-4 max-w-sm text-sm leading-normal text-on-dark-muted">
            Habitaciones, fotos, horarios y datos de contacto del hotel. Los cambios se publican en
            el sitio en segundos.
          </p>
        </div>
        <p className="hidden text-xs text-sage desk:block">Hotel Bambú Plaza · Mocoa</p>
        <svg
          aria-hidden="true"
          viewBox="0 0 48 48"
          className="pointer-events-none absolute -right-16 -bottom-20 hidden size-[420px] text-white/5 desk:block"
        >
          <rect x="18" y="5" width="9" height="38" rx="4.5" fill="currentColor" />
          <path
            d="M12 17c7 0 10-4 11-10-7 0-11 3-11 10Zm15 11c7-1 11-5 12-12-8 0-12 4-12 12ZM8 32c7 0 11-3 13-10-8 0-12 3-13 10Z"
            fill="currentColor"
          />
        </svg>
      </aside>
      <main className="flex items-center justify-center px-4 py-10 desk:py-16">
        <div className="w-full max-w-[26rem]">
          <div className="rounded-2xl border border-line bg-white p-6 shadow-md tab:p-8">
            <span className="inline-flex size-11 items-center justify-center rounded-full bg-notice-bg text-green">
              <LockKeyhole aria-hidden="true" className="size-5" strokeWidth={1.75} />
            </span>
            <h1 className="mt-4 text-[1.6rem] leading-tight">Iniciar sesión</h1>
            <p className="mt-1 mb-6 text-sm text-muted-foreground">
              Ingrese con su correo y contraseña del panel.
            </p>
            <LoginForm next={safeNext(params.next)} />
          </div>
          <Link
            href="/"
            className="mt-5 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-green hover:underline"
          >
            <ArrowLeft aria-hidden="true" className="size-4" /> Volver al sitio
          </Link>
        </div>
      </main>
    </div>
  );
}
