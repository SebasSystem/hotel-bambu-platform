'use client';

import { heroSlideCreateSchema, heroSlideUpdateSchema } from '@hotel-bambu/shared';
import { MediaThumb } from '@/components/admin/media-thumb';
import { ResourceManager } from '@/components/admin/resource-manager';
import { Badge, BooleanBadge } from '@/components/admin/ui';
import type { HeroSlide } from '@/lib/api/types';

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
          hint: 'Mejor horizontal y de al menos 1600 px de ancho.',
          wide: true,
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
        item ? { variants: item.mediaAsset.variants, altText: item.mediaAsset.altText } : null
      }
      itemLabel={(item) => item.caption ?? item.altText ?? item.mediaAsset.altText ?? 'Diapositiva'}
      toggles={[{ name: 'active', on: 'Ocultar', off: 'Mostrar' }]}
      renderSummary={(item) => (
        <div className="flex items-start gap-4">
          <MediaThumb
            variants={item.mediaAsset.variants}
            alt=""
            className="h-20 w-32 shrink-0 rounded-sm"
          />
          <div className="min-w-0">
            <p className="font-semibold">
              {item.caption ?? item.altText ?? item.mediaAsset.altText ?? 'Sin texto alternativo'}
            </p>
            {item.altText ? (
              <p className="text-sm text-muted-foreground">Texto alternativo propio</p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-2">
              <BooleanBadge value={item.active} on="Visible" off="Oculta" />
              {!item.altText && !item.mediaAsset.altText ? (
                <Badge tone="warning">Falta texto alternativo</Badge>
              ) : null}
            </div>
          </div>
        </div>
      )}
    />
  );
}
