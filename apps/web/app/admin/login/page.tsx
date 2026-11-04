import type { Metadata } from 'next';
import Image from 'next/image';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Iniciar sesión' };

function safeNext(value: string | string[] | undefined): string {
  const next = Array.isArray(value) ? value[0] : value;
  // Only same-site admin paths (no open redirect: reject "//host" and absolute URLs).
  return next && next.startsWith('/admin') && !next.startsWith('/admin/login') ? next : '/admin';
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-md border border-border bg-card p-8 shadow-sm">
        <Image
          src="/brand/logo.svg"
          alt="Hotel Bambú Plaza"
          width={196}
          height={50}
          priority
          unoptimized
          className="mx-auto"
        />
        <h1 className="mt-6 text-center text-2xl font-semibold text-bamboo-900">
          Panel de administración
        </h1>
        <p className="mt-1 mb-6 text-center text-sm text-muted-foreground">
          Ingrese con su correo y contraseña.
        </p>
        <LoginForm next={safeNext(params.next)} />
      </div>
    </main>
  );
}
