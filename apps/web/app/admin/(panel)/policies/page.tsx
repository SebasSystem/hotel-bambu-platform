import type { Metadata } from 'next';
import { PageHeader } from '@/components/admin/ui';
import { serverApi } from '@/lib/api/server';
import type { Faq, Policy } from '@/lib/api/types';
import { FaqManager } from '../faq/faq-manager';
import { PoliciesManager } from './policies-manager';

export const metadata: Metadata = { title: 'Políticas y preguntas' };

/** One admin page for the one public page «Políticas y preguntas frecuentes» (C3). */
export default async function PoliciesPage() {
  const [policies, faqs] = await Promise.all([
    serverApi.get<Policy[]>('/admin/policies'),
    serverApi.get<Faq[]>('/admin/faq'),
  ]);
  return (
    <>
      <PageHeader
        title="Políticas y preguntas"
        description="Lo que se muestra en «Políticas y preguntas frecuentes» del sitio. Solo lo publicado aparece; use las flechas para ordenar."
      />
      <div className="grid gap-9">
        <section aria-labelledby="politicas" className="grid gap-3">
          <div>
            <h2 id="politicas" className="scroll-mt-24 text-lg">
              Políticas del hotel
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Check-in y check-out, mascotas, menores, fumadores, cancelación y medios de pago.
            </p>
          </div>
          <PoliciesManager items={policies} />
        </section>
        <section aria-labelledby="preguntas" className="grid gap-3">
          <div>
            <h2 id="preguntas" className="scroll-mt-24 text-lg">
              Preguntas frecuentes
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Respuestas cortas a lo que más preguntan los huéspedes.
            </p>
          </div>
          <FaqManager items={faqs} />
        </section>
      </div>
    </>
  );
}
