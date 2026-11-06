import type { Metadata } from 'next';
import { Card, PageHeader } from '@/components/admin/ui';
import { serverApi } from '@/lib/api/server';
import type { HeroSlide, LandingSection } from '@/lib/api/types';
import { HeroSlidesManager } from './hero-slides-manager';
import { SectionsManager } from './section-form';

export const metadata: Metadata = { title: 'Contenido de la landing' };

export default async function ContentPage() {
  const [sections, slides] = await Promise.all([
    serverApi.get<LandingSection[]>('/admin/content'),
    serverApi.get<HeroSlide[]>('/admin/hero-slides'),
  ]);
  return (
    <>
      <PageHeader
        title="Contenido de la landing"
        description="Fotos de la portada y secciones visibles del inicio, en su orden. Los títulos son parte del diseño del sitio y los textos del hotel se editan en «Información del hotel»."
      />
      <div className="flex flex-col gap-6">
        <Card>
          <section aria-labelledby="carrusel-title" className="flex flex-col gap-4">
            <div>
              <h2 id="carrusel-title" className="text-lg font-semibold">
                Carrusel principal
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Fotos del inicio, en este orden. Es la única fuente de la portada: sin diapositivas
                visibles se usan las fotos destacadas de la galería y las de los tipos de
                habitación.
              </p>
            </div>
            <HeroSlidesManager items={slides} />
          </section>
        </Card>
        <Card>
          <SectionsManager sections={sections} />
        </Card>
      </div>
    </>
  );
}
