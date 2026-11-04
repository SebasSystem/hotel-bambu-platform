'use client';

import { GALLERY_CATEGORIES } from '@hotel-bambu/shared';
import { Plus, Trash2 } from 'lucide-react';
import { useId, useState } from 'react';
import { useConfirm } from '@/components/admin/feedback';
import { inputClasses } from '@/components/admin/fields';
import { useAction } from '@/components/admin/hooks';
import { MediaPicker } from '@/components/admin/media-picker';
import { MediaThumb } from '@/components/admin/media-thumb';
import { ReorderButtons, moveItem } from '@/components/admin/reorder-buttons';
import { BooleanBadge, Button, EmptyState } from '@/components/admin/ui';
import { browserApi } from '@/lib/api/browser';
import type { GalleryItem } from '@/lib/api/types';
import { GALLERY_CATEGORY_LABELS } from '@/lib/labels';

const CATEGORY_OPTIONS = GALLERY_CATEGORIES.map((value) => ({
  value,
  label: GALLERY_CATEGORY_LABELS[value],
}));

export function GalleryManager({ items }: { items: GalleryItem[] }) {
  const { run, busy } = useAction();
  const confirm = useConfirm();
  const [picking, setPicking] = useState(false);
  const [newCategory, setNewCategory] = useState<string>('ROOMS');
  const categoryId = useId();

  const move = (from: number, to: number) => {
    const ids = moveItem(items, from, to).map((item) => item.id);
    void run('order', () => browserApi.put('/admin/gallery/order', { ids }), 'Orden actualizado.');
  };

  const patch = (item: GalleryItem, body: Record<string, unknown>, key: string) =>
    void run(
      `${key}:${item.id}`,
      () => browserApi.patch(`/admin/gallery/${item.id}`, body),
      'Cambios guardados.',
    );

  const remove = async (item: GalleryItem) => {
    const ok = await confirm({
      title: '¿Quitar de la galería?',
      description: 'La imagen seguirá en la biblioteca de medios.',
      confirmLabel: 'Quitar',
      destructive: true,
    });
    if (ok)
      await run(
        `delete:${item.id}`,
        () => browserApi.delete(`/admin/gallery/${item.id}`),
        'Quitada de la galería.',
      );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={categoryId} className="text-sm font-semibold">
            Categoría para las nuevas imágenes
          </label>
          <select
            id={categoryId}
            className={inputClasses}
            value={newCategory}
            onChange={(event) => setNewCategory(event.target.value)}
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <Button onClick={() => setPicking(true)}>
          <Plus aria-hidden="true" className="size-4" /> Agregar desde medios
        </Button>
      </div>

      {items.length === 0 ? <EmptyState>La galería está vacía.</EmptyState> : null}

      <ul className="flex flex-col gap-3">
        {items.map((item, index) => {
          const label = item.mediaAsset.altText ?? `imagen ${index + 1}`;
          return (
            <li
              key={item.id}
              className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-card p-3 shadow-xs"
            >
              <MediaThumb
                variants={item.mediaAsset.variants}
                alt={item.mediaAsset.altText ?? ''}
                className="h-16 w-24 rounded-xs"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">
                  {item.mediaAsset.altText || 'Sin texto alternativo'}
                </p>
                <div className="mt-1 flex gap-2">
                  <BooleanBadge value={item.published} on="Publicada" off="No publicada" />
                  {item.featured ? <BooleanBadge value on="Destacada" off="" /> : null}
                </div>
              </div>
              <label className="sr-only" htmlFor={`category-${item.id}`}>
                Categoría de {label}
              </label>
              <select
                id={`category-${item.id}`}
                className={`${inputClasses} w-auto`}
                value={item.category}
                disabled={busy !== null}
                onChange={(event) => patch(item, { category: event.target.value }, 'category')}
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Button
                variant="secondary"
                size="sm"
                aria-pressed={item.published}
                loading={busy === `published:${item.id}`}
                onClick={() => patch(item, { published: !item.published }, 'published')}
              >
                {item.published ? 'Despublicar' : 'Publicar'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                aria-pressed={item.featured}
                loading={busy === `featured:${item.id}`}
                onClick={() => patch(item, { featured: !item.featured }, 'featured')}
              >
                {item.featured ? 'Quitar portada' : 'Marcar portada'}
              </Button>
              <ReorderButtons
                index={index}
                count={items.length}
                label={label}
                onMove={move}
                disabled={busy !== null}
              />
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Quitar ${label} de la galería`}
                loading={busy === `delete:${item.id}`}
                onClick={() => void remove(item)}
              >
                <Trash2 aria-hidden="true" className="size-4" />
              </Button>
            </li>
          );
        })}
      </ul>

      <MediaPicker
        open={picking}
        multiple
        title="Agregar imágenes a la galería"
        excludeIds={items.map((item) => item.mediaAssetId)}
        onClose={() => setPicking(false)}
        onSelect={(selected) => {
          setPicking(false);
          void run(
            'add',
            async () => {
              for (const media of selected) {
                await browserApi.post('/admin/gallery', {
                  mediaAssetId: media.id,
                  category: newCategory,
                });
              }
            },
            selected.length === 1
              ? 'Imagen agregada (sin publicar).'
              : 'Imágenes agregadas (sin publicar).',
          );
        }}
      />
    </div>
  );
}
