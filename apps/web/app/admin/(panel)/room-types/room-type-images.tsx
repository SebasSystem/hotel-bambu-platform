'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useAction, useUnsavedChangesWarning } from '@/components/admin/hooks';
import { MediaPicker } from '@/components/admin/media-picker';
import { MediaThumb } from '@/components/admin/media-thumb';
import { ReorderButtons, moveItem } from '@/components/admin/reorder-buttons';
import { Button, Card, EmptyState } from '@/components/admin/ui';
import { browserApi } from '@/lib/api/browser';
import type { RoomType } from '@/lib/api/types';

interface ImageRow {
  mediaAssetId: string;
  isCover: boolean;
  variants: unknown;
  altText: string | null;
}

function fromRoom(room: RoomType): ImageRow[] {
  return room.images.map((image) => ({
    mediaAssetId: image.mediaAssetId,
    isCover: image.isCover,
    variants: image.media.variants,
    altText: image.media.altText,
  }));
}

/** Ordered image set of a room type with one cover; saved as a whole (PUT /admin/room-types/:id/images). */
export function RoomTypeImages({ room }: { room: RoomType }) {
  const [rows, setRows] = useState<ImageRow[]>(() => fromRoom(room));
  const [dirty, setDirty] = useState(false);
  const [picking, setPicking] = useState(false);
  const { run, busy } = useAction();
  useUnsavedChangesWarning(dirty);

  const update = (next: ImageRow[]) => {
    setRows(next);
    setDirty(true);
  };

  const save = async () => {
    const saved = await run(
      'images',
      () =>
        browserApi.put<RoomType>(`/admin/room-types/${room.id}/images`, {
          images: rows.map(({ mediaAssetId, isCover }) => ({ mediaAssetId, isCover })),
        }),
      'Imágenes guardadas.',
    );
    if (saved) {
      setRows(fromRoom(saved));
      setDirty(false);
    }
  };

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg">Imágenes</h2>
          <p className="text-sm text-muted-foreground">
            La imagen principal es obligatoria para publicar. El orden es el de la galería de la
            habitación.
          </p>
        </div>
        <Button variant="secondary" onClick={() => setPicking(true)}>
          <Plus aria-hidden="true" className="size-4" /> Agregar imágenes
        </Button>
      </div>

      {rows.length === 0 ? <EmptyState>Esta habitación aún no tiene imágenes.</EmptyState> : null}

      <fieldset>
        <legend className="sr-only">Imagen principal</legend>
        <ul className="flex flex-col gap-3">
          {rows.map((row, index) => (
            <li
              key={row.mediaAssetId}
              className="flex flex-wrap items-center gap-3 rounded-sm border border-border p-2"
            >
              <MediaThumb
                variants={row.variants}
                alt={row.altText ?? ''}
                className="h-16 w-24 rounded-xs"
              />
              <p className="min-w-0 flex-1 truncate text-sm">
                {row.altText || 'Sin texto alternativo'}
              </p>
              <label className="flex min-h-6 items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="cover"
                  className="size-5 accent-(--primary)"
                  checked={row.isCover}
                  onChange={() =>
                    update(
                      rows.map((r) => ({ ...r, isCover: r.mediaAssetId === row.mediaAssetId })),
                    )
                  }
                />
                Principal
              </label>
              <ReorderButtons
                index={index}
                count={rows.length}
                label={`imagen ${index + 1}`}
                onMove={(from, to) => update(moveItem(rows, from, to))}
              />
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Quitar imagen ${index + 1}`}
                onClick={() => update(rows.filter((r) => r.mediaAssetId !== row.mediaAssetId))}
              >
                <Trash2 aria-hidden="true" className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      </fieldset>

      <div className="mt-4 flex items-center gap-3">
        <Button onClick={() => void save()} loading={busy === 'images'} disabled={!dirty}>
          Guardar imágenes
        </Button>
        {dirty ? (
          <span className="text-sm text-muted-foreground">Hay cambios sin guardar.</span>
        ) : null}
      </div>

      <MediaPicker
        open={picking}
        multiple
        title="Agregar imágenes a la habitación"
        excludeIds={rows.map((r) => r.mediaAssetId)}
        onClose={() => setPicking(false)}
        onSelect={(items) => {
          const hasCover = rows.some((r) => r.isCover);
          update([
            ...rows,
            ...items.map((item, i) => ({
              mediaAssetId: item.id,
              isCover: !hasCover && i === 0,
              variants: item.variants,
              altText: item.altText,
            })),
          ]);
          setPicking(false);
        }}
      />
    </Card>
  );
}
