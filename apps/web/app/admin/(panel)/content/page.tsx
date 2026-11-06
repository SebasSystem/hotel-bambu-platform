import type { Metadata } from 'next';
import { Card, PageHeader } from '@/components/admin/ui';
import { serverApi } from '@/lib/api/server';
import type { HeroSlide, LandingSection } from '@/lib/api/types';
import { HeroSlidesManager } from './hero-slides-manager';
import { SectionForm } from './section-form';

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
        description="Textos e imágenes de cada sección de la página de inicio. El diseño lo controla el sitio; aquí solo se edita el contenido."
      />
      <div className="flex flex-col gap-6">
        <Card>
          <section aria-labelledby="carrusel-title" className="flex flex-col gap-4">
            <div>
              <h2 id="carrusel-title" className="text-lg font-semibold">
                Carrusel principal
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Fotos del inicio, en este orden. Sin diapositivas visibles se usan la foto principal
                del hotel y las fotos destacadas de la galería.
              </p>
            </div>
            <HeroSlidesManager items={slides} />
          </section>
        </Card>
        {sections.map((section) => (
          <SectionForm key={section.key} section={section} />
        ))}
      </div>
    </>
  );
}
