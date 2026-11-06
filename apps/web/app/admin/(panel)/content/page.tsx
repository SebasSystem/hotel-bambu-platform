import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardHeader, Notice, PageHeader } from '@/components/admin/ui';
import { serverApi } from '@/lib/api/server';
import type { LandingSection } from '@/lib/api/types';
import { SectionsManager } from './section-form';

export const metadata: Metadata = { title: 'Secciones de la portada' };

export default async function ContentPage() {
  const sections = await serverApi.get<LandingSection[]>('/admin/content');
  return (
    <>
      <PageHeader
        title="Secciones de la portada"
        description="Muestre u oculte cada bloque de la página de inicio. El orden y los títulos son parte del diseño; los textos del hotel se editan en «Datos del hotel»."
      />
      <div className="grid gap-[18px]">
        <Card>
          <CardHeader
            title="Bloques del inicio, en orden"
            description="Una sección sin datos (por ejemplo, la ubicación sin dirección) no aparece aunque esté visible."
          />
          <div className="mb-4 flex items-start gap-3 rounded-sm bg-ivory p-3.5">
            <span
              aria-hidden="true"
              className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-ink-muted"
            >
              1
            </span>
            <p className="text-[0.8125rem] leading-snug text-muted-foreground">
              <span className="block text-[0.95rem] font-bold text-foreground">
                Portada con carrusel
              </span>
              Siempre visible. Sus fotos se gestionan en{' '}
              <Link href="/admin/hero-slides" className="font-semibold text-green underline">
                Carrusel principal
              </Link>
              .
            </p>
          </div>
          <SectionsManager sections={sections} />
        </Card>
        <Notice title="Cambios al instante">
          Cada cambio se publica en el sitio en unos segundos. Las opiniones de huéspedes aparecerán
          cuando se conecte el perfil de Google del hotel.
        </Notice>
      </div>
    </>
  );
}
