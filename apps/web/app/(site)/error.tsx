'use client';

import { button, container } from '@/components/site/styles';

/** Public error boundary: friendly message and retry, no technical details (requirement 18.1). */
export default function SiteError({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className={`${container} py-(--section-y)`}>
      <h1 className="text-4xl font-medium text-bamboo-900">No pudimos cargar esta página</h1>
      <p className="mt-5 max-w-xl text-lg leading-normal text-muted-foreground">
        Ocurrió un problema temporal. Inténtalo de nuevo en unos segundos.
      </p>
      <button type="button" onClick={reset} className={`${button.primary} mt-8`}>
        Reintentar
      </button>
    </section>
  );
}
