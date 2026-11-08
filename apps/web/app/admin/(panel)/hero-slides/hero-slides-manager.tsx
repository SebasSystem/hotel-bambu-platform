'use client';

import { heroSlideCreateSchema, heroSlideUpdateSchema } from '@hotel-bambu/shared';
import { MediaThumb } from '@/components/admin/media-thumb';
import { ResourceManager } from '@/components/admin/resource-manager';
import { BooleanBadge, WarningBadge } from '@/components/admin/ui';
import { HERO_MIN_WIDTH, heroPhotoIssues } from '@/lib/admin/readiness';
import type { HeroSlide } from '@/lib/api/types';

const ISSUE_TEXT = {
  portrait: 'Foto vertical: se recorta mucho en pantallas anchas',
  small: `Menos de ${HERO_MIN_WIDTH} px de ancho: se verá borrosa`,
  unknown: 'Tamaño desconocido (la foto aún se procesa)',
} as const;

/**
 * "Carrusel principal" (spec §7 Admin, mockup upload zone): ordered home hero slides. Without
 * active slides the site falls back to the hotel hero photo and featured gallery photos.
 */
export function HeroSlidesManager({ items }: { items: HeroSlide[] }) {
  return (
    <ResourceManager<HeroSlide>
      endpoint="/admin/hero-slides"
      items={items}
      noun="diapositiva"
      emptyText="Aún no hay fotos en el carrusel. Agregue la primera para la portada."
      createSchema={heroSlideCreateSchema}
      updateSchema={heroSlideUpdateSchema}
      reorderable
      deleteDescription="La diapositiva se quitará del carrusel. La imagen seguirá en la biblioteca de medios."
      fields={[
        {
          name: 'mediaAssetId',
          label: 'Imagen',
          kind: 'media',
          required: true,
          hint: `Horizontal (más ancha que alta) y de al menos ${HERO_MIN_WIDTH} px de ancho, por ejemplo 1920 × 1080. Puede subirla aquí mismo.`,
          wide: true,
          mediaWarnings: (media) => heroPhotoIssues(media).map((issue) => ISSUE_TEXT[issue]),
        },
        {
          name: 'altText',
          label: 'Texto alternativo',
          kind: 'text',
          hint: 'Opcional. Reemplaza el de la imagen solo en el carrusel.',
        },
        { name: 'caption', label: 'Leyenda', kind: 'text', hint: 'Opcional, texto corto.' },
        { name: 'active', label: 'Visible en el carrusel', kind: 'checkbox' },
      ]}
      emptyValues={{ mediaAssetId: null, altText: '', caption: '', active: true }}
      toFormValues={(item) => ({
        mediaAssetId: item.mediaAssetId,
        altText: item.altText ?? '',
        caption: item.caption ?? '',
        active: item.active,
      })}
      mediaPreview={(item) =>
        item
          ? {
              variants: item.mediaAsset.variants,
              altText: item.mediaAsset.altText,
              width: item.mediaAsset.width,
              height: item.mediaAsset.height,
            }
          : null
      }
      itemLabel={(item) => item.caption ?? item.altText ?? item.mediaAsset.altText ?? 'Diapositiva'}
      toggles={[{ name: 'active', on: 'Ocultar', off: 'Mostrar' }]}
      renderSummary={(item) => {
        const { width, height } = item.mediaAsset;
        return (
          <div className="flex flex-wrap items-start gap-4">
            <MediaThumb
              variants={item.mediaAsset.variants}
              alt=""
              className="aspect-video w-36 shrink-0 rounded-sm"
            />
            <div className="min-w-0 flex-1">
              <p className="font-bold">
                {item.caption ?? item.altText ?? item.mediaAsset.altText ?? 'Sin texto alternativo'}
              </p>
              <p className="mt-0.5 text-[0.8125rem] text-muted-foreground tabular-nums">
                {width && height ? `${width} × ${height} px` : 'Sin medidas'}
                {item.altText ? ' · texto alternativo propio' : ''}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <BooleanBadge value={item.active} on="Visible" off="Oculta" />
                {!item.altText && !item.mediaAsset.altText ? (
                  <WarningBadge>Falta texto alternativo</WarningBadge>
                ) : null}
                {heroPhotoIssues(item.mediaAsset).map((issue) => (
                  <WarningBadge key={issue}>{ISSUE_TEXT[issue]}</WarningBadge>
                ))}
              </div>
            </div>
          </div>
        );
      }}
    />
  );
}
