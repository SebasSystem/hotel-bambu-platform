'use client';

import { Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { browserApi } from '@/lib/api/browser';
import type { MediaAsset, Paginated } from '@/lib/api/types';
import { describeApiError } from '@/lib/forms/form-errors';
import { MediaThumb } from './media-thumb';
import { Button, cx } from './ui';

const PAGE_SIZE = 48;

export function isPublishable(media: Pick<MediaAsset, 'status' | 'altText'>): boolean {
  return media.status === 'READY' && !!media.altText?.trim();
}

/**
 * Modal image picker over the media library. Only processed images with alt text can be chosen
 * (requirement 10); the rest are listed but disabled with the reason.
 */
export function MediaPicker({
  open,
  title = 'Elegir imagen',
  multiple = false,
  excludeIds = [],
  onClose,
  onSelect,
}: {
  open: boolean;
  title?: string;
  multiple?: boolean;
  excludeIds?: readonly string[];
  onClose: () => void;
  onSelect: (items: MediaAsset[]) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<MediaAsset> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<MediaAsset[]>([]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    browserApi
      .get<Paginated<MediaAsset>>('/admin/media', {
        query: { page, pageSize: PAGE_SIZE },
        signal: controller.signal,
      })
      .then((result) => {
        setData(result);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setError(describeApiError(err));
      });
    return () => controller.abort();
  }, [open, page]);

  const excluded = new Set(excludeIds);
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  const toggle = (item: MediaAsset) => {
    if (!multiple) {
      onSelect([item]);
      setSelected([]);
      return;
    }
    setSelected((current) =>
      current.some((m) => m.id === item.id)
        ? current.filter((m) => m.id !== item.id)
        : [...current, item],
    );
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="media-picker-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="m-auto max-h-[90dvh] w-[min(60rem,calc(100%-2rem))] rounded-md border border-border bg-card p-0 shadow-lg backdrop:bg-ink-900/50"
    >
      <div className="flex items-center justify-between gap-4 border-b border-border p-4">
        <h2 id="media-picker-title" className="text-xl font-semibold">
          {title}
        </h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cerrar
        </Button>
      </div>
      <div className="max-h-[60dvh] overflow-y-auto p-4">
        {error ? (
          <p role="alert" className="text-sm font-semibold text-destructive">
            {error}
          </p>
        ) : null}
        {!data && !error ? (
          <p className="text-sm text-muted-foreground">Cargando imágenes…</p>
        ) : null}
        {data && data.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            La biblioteca está vacía. Suba imágenes en «Galería y medios».
          </p>
        ) : null}
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {data?.items.map((item) => {
            const usable = isPublishable(item) && !excluded.has(item.id);
            const isSelected = selected.some((m) => m.id === item.id);
            const reason = excluded.has(item.id)
              ? 'Ya agregada'
              : item.status !== 'READY'
                ? 'En proceso'
                : !item.altText?.trim()
                  ? 'Sin texto alternativo'
                  : null;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={!usable}
                  aria-pressed={multiple ? isSelected : undefined}
                  onClick={() => toggle(item)}
                  className={cx(
                    'relative block w-full overflow-hidden rounded-sm border-2 text-left',
                    isSelected ? 'border-primary' : 'border-transparent',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                  )}
                >
                  <MediaThumb
                    variants={item.variants}
                    alt={item.altText ?? ''}
                    className="aspect-4/3 w-full"
                  />
                  <span className="block truncate p-1 text-xs">
                    {item.altText || 'Sin texto alternativo'}
                  </span>
                  {reason ? (
                    <span className="absolute top-1 left-1 rounded-xs bg-card px-1.5 py-0.5 text-xs font-semibold">
                      {reason}
                    </span>
                  ) : null}
                  {isSelected ? (
                    <span className="absolute top-1 right-1 rounded-pill bg-primary p-1 text-primary-foreground">
                      <Check aria-hidden="true" className="size-4" />
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border p-4">
        <div className="flex items-center gap-2 text-sm">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </Button>
          <span>
            Página {page} de {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </Button>
        </div>
        {multiple ? (
          <Button
            disabled={selected.length === 0}
            onClick={() => {
              onSelect(selected);
              setSelected([]);
            }}
          >
            Agregar {selected.length > 0 ? `(${selected.length})` : ''}
          </Button>
        ) : null}
      </div>
    </dialog>
  );
}

/** Form control: current image + "Elegir" / "Quitar". Value is a media id or null. */
export function MediaField({
  label,
  hint,
  value,
  preview,
  onChange,
  error,
}: {
  label: string;
  hint?: string;
  value: string | null | undefined;
  preview?: { variants: unknown; altText: string | null } | null;
  onChange: (id: string | null, media?: MediaAsset) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold">{label}</span>
      <div className="flex items-center gap-3">
        {value && preview ? (
          <MediaThumb
            variants={preview.variants}
            alt={preview.altText ?? ''}
            className="h-16 w-24 rounded-xs"
          />
        ) : (
          <span className="flex h-16 w-24 items-center justify-center rounded-xs bg-muted text-xs text-muted-foreground">
            {value ? 'Seleccionada' : 'Sin imagen'}
          </span>
        )}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setOpen(true)}
          aria-label={`Elegir ${label.toLowerCase()}`}
        >
          Elegir
        </Button>
        {value ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange(null)}
            aria-label={`Quitar ${label.toLowerCase()}`}
          >
            Quitar
          </Button>
        ) : null}
      </div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? <p className="text-sm font-semibold text-destructive">{error}</p> : null}
      <MediaPicker
        open={open}
        title={label}
        onClose={() => setOpen(false)}
        onSelect={([item]) => {
          if (item) onChange(item.id, item);
          setOpen(false);
        }}
      />
    </div>
  );
}
