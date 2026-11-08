import type { Metadata } from 'next';
import { Notice, PageHeader } from '@/components/admin/ui';
import { HERO_MIN_SLIDES, HERO_MIN_WIDTH, heroPhotoIssues } from '@/lib/admin/readiness';
import { serverApi } from '@/lib/api/server';
import type { HeroSlide } from '@/lib/api/types';
import { HeroSlidesManager } from './hero-slides-manager';

export const metadata: Metadata = { title: 'Carrusel principal' };

export default async function HeroSlidesPage() {
  const slides = await serverApi.get<HeroSlide[]>('/admin/hero-slides');
  // Same rule as the dashboard checklist: visible and landscape (small ones only get a warning).
  const ready = slides.filter((slide) => {
    const issues = heroPhotoIssues(slide.mediaAsset);
    return slide.active && !issues.includes('portrait') && !issues.includes('unknown');
  }).length;
  return (
    <>
      <PageHeader
        title="Carrusel principal"
        description="Las fotos de la portada, en este orden. Sin diapositivas visibles, el sitio usa las fotos destacadas de la galería y las de los tipos de habitación."
      />
      <div className="mb-5 grid gap-3">
        <Notice
          tone={ready >= HERO_MIN_SLIDES ? 'info' : 'warning'}
          title={`${Math.min(ready, HERO_MIN_SLIDES)} de ${HERO_MIN_SLIDES} fotos horizontales visibles`}
        >
          Cada diapositiva necesita una foto horizontal (más ancha que alta) de al menos{' '}
          {HERO_MIN_WIDTH} px de ancho, por ejemplo 1920 × 1080. Use al menos {HERO_MIN_SLIDES}. Las
          fotos más pequeñas se ven borrosas en pantallas grandes, y las verticales del celular se
          recortan arriba y abajo y pierden lo importante.
        </Notice>
      </div>
      <HeroSlidesManager items={slides} />
    </>
  );
}
