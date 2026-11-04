'use client';

import '@/styles/globals.css';

/**
 * Last-resort error page (replaces the root layout when it fails, e.g. the API is down while the
 * site profile loads). Branded, Spanish, no technical details (requirement 18.1).
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es-CO">
      <body className="flex min-h-dvh items-center bg-background text-foreground">
        <main className="mx-auto w-full max-w-xl px-6 py-16">
          {/* eslint-disable-next-line @next/next/no-img-element -- static brand SVG, no layout */}
          <img
            src="/brand/logo.svg"
            alt="Hotel Bambú Plaza"
            width={250}
            height={64}
            className="h-12 w-auto"
          />
          <h1 className="mt-10 text-4xl font-medium text-bamboo-900">
            El sitio no está disponible en este momento
          </h1>
          <p className="mt-5 text-lg leading-normal text-muted-foreground">
            Ocurrió un problema temporal. Inténtalo de nuevo en unos minutos.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-8 inline-flex min-h-11 items-center justify-center rounded-pill bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            Reintentar
          </button>
        </main>
      </body>
    </html>
  );
}
