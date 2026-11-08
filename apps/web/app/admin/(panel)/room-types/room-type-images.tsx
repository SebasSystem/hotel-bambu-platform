'use client';

import { Plus, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useAction, useUnsavedChangesWarning } from '@/components/admin/hooks';
import { MediaPicker } from '@/components/admin/media-picker';
import { MediaThumb } from '@/components/admin/media-thumb';
import { ReorderButtons, moveItem } from '@/components/admin/reorder-buttons';
import { Badge, Button, Card, EmptyState } from '@/components/admin/ui';
import { browserApi } from '@/lib/api/browser';
import type { MediaAsset, RoomType } from '@/lib/api/types';

export interface ImageRow {
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

/** Appends picked media; the first image becomes the cover when there is none yet. */
export function addImageRows(rows: ImageRow[], items: MediaAsset[]): ImageRow[] {
  const hasCover = rows.some((r) => r.isCover);
  return [
    ...rows,
    ...items
      .filter((item) => !rows.some((r) => r.mediaAssetId === item.id))
      .map((item, i) => ({
        mediaAssetId: item.id,
        isCover: !hasCover && i === 0,
        variants: item.variants,
        altText: item.altText,
      })),
  ];
}

/** Removes an image; when it was the cover, the first remaining image takes its place. */
export function removeImageRow(rows: ImageRow[], mediaAssetId: string): ImageRow[] {
  const next = rows.filter((r) => r.mediaAssetId !== mediaAssetId);
  if (next.length > 0 && !next.some((r) => r.isCover)) {
    return next.map((r, index) => ({ ...r, isCover: index === 0 }));
  }
  return next;
}

export const setCoverRow = (rows: ImageRow[], mediaAssetId: string): ImageRow[] =>
  rows.map((r) => ({ ...r, isCover: r.mediaAssetId === mediaAssetId }));

/** Request shape shared by PUT /admin/room-types/:id/images and the create call. */
export const toImageInput = (rows: ImageRow[]) =>
  rows.map(({ mediaAssetId, isCover }) => ({ mediaAssetId, isCover }));

/**
 * Controlled ordered image list with one cover ("Portada"), reorder buttons and the upload-enabled
 * picker. Used on the edit page (saved with its own button) and inside the creation form.
 */
export function RoomTypeImageList({
  rows,
  onChange,
  emptyText = 'Esta habitación aún no tiene imágenes.',
}: {
  rows: ImageRow[];
  onChange: (rows: ImageRow[]) => void;
  emptyText?: string;
}) {
  const [picking, setPicking] = useState(false);
  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button variant="secondary" onClick={() => setPicking(true)}>
          <Plus aria-hidden="true" className="size-4" /> Agregar imágenes
        </Button>
      </div>

      {rows.length === 0 ? <EmptyState>{emptyText}</EmptyState> : null}

      <ul className="flex flex-col gap-3" aria-label="Imágenes del tipo de habitación">
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
            {row.isCover ? (
              <Badge tone="success">
                <Star aria-hidden="true" className="size-3.5" /> Portada
              </Badge>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Usar imagen ${index + 1} como portada`}
                onClick={() => onChange(setCoverRow(rows, row.mediaAssetId))}
              >
                Usar como portada
              </Button>
            )}
            <ReorderButtons
              index={index}
              count={rows.length}
              label={`imagen ${index + 1}`}
              onMove={(from, to) => onChange(moveItem(rows, from, to))}
            />
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Quitar imagen ${index + 1}`}
              onClick={() => onChange(removeImageRow(rows, row.mediaAssetId))}
            >
              <Trash2 aria-hidden="true" className="size-4" />
            </Button>
          </li>
        ))}
      </ul>

      <MediaPicker
        open={picking}
        multiple
        title="Agregar imágenes a la habitación"
        excludeIds={rows.map((r) => r.mediaAssetId)}
        onClose={() => setPicking(false)}
        onSelect={(items) => {
          onChange(addImageRows(rows, items));
          setPicking(false);
        }}
      />
    </div>
  );
}

/** Ordered image set of a room type with one cover; saved as a whole (PUT /admin/room-types/:id/images). */
export function RoomTypeImages({ room }: { room: RoomType }) {
  const [rows, setRows] = useState<ImageRow[]>(() => fromRoom(room));
  const [dirty, setDirty] = useState(false);
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
          images: toImageInput(rows),
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
      <div className="mb-4">
        <h2 className="text-lg">Imágenes</h2>
        <p className="text-sm text-muted-foreground">
          La portada es obligatoria para publicar. El orden es el de la galería de la habitación.
        </p>
      </div>

      <RoomTypeImageList rows={rows} onChange={update} />

      <div className="mt-4 flex items-center gap-3">
        <Button onClick={() => void save()} loading={busy === 'images'} disabled={!dirty}>
          Guardar imágenes
        </Button>
        {dirty ? (
          <span className="text-sm text-muted-foreground">Hay cambios sin guardar.</span>
        ) : null}
      </div>
    </Card>
  );
}
