'use client';

import { Check, ImageUp } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { browserApi } from '@/lib/api/browser';
import type { MediaAsset, Paginated } from '@/lib/api/types';
import { describeApiError } from '@/lib/forms/form-errors';
import { MediaThumb } from './media-thumb';
import { MediaUploader } from './media-uploader';
import { Button, WarningBadge, cx } from './ui';

const PAGE_SIZE = 48;

export function isPublishable(media: Pick<MediaAsset, 'status' | 'altText'>): boolean {
  return media.status === 'READY' && !!media.altText?.trim();
}

export type MediaPickerTab = 'upload' | 'library';

/**
 * Modal image picker with two tabs: "Subir archivos" (upload with alt text, default when the
 * library is empty) and "Elegir de la galería". Only processed images with alt text can be chosen
 * (requirement 10); the rest are listed but disabled with the reason. Uploaded images are selected
 * automatically: single pickers return them at once, multiple pickers add them to the selection.
 */
export function MediaPicker({
  open,
  title = 'Elegir imagen',
  multiple = false,
  excludeIds = [],
  initialTab,
  onClose,
  onSelect,
}: {
  open: boolean;
  title?: string;
  multiple?: boolean;
  excludeIds?: readonly string[];
  /** Tab shown first; by default the gallery, or the upload tab when the library is empty. */
  initialTab?: MediaPickerTab;
  onClose: () => void;
  onSelect: (items: MediaAsset[]) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="media-picker-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="m-auto max-h-[90dvh] w-[min(60rem,calc(100%-2rem))] rounded-2xl border border-line bg-white p-0 text-foreground shadow-lg backdrop:bg-charcoal/50"
    >
      {/* Content mounts per opening, so tabs, selection and the upload queue start fresh. */}
      {open ? (
        <PickerContent
          title={title}
          multiple={multiple}
          excludeIds={excludeIds}
          initialTab={initialTab}
          onClose={onClose}
          onSelect={onSelect}
        />
      ) : null}
    </dialog>
  );
}

const TABS: { key: MediaPickerTab; label: string }[] = [
  { key: 'upload', label: 'Subir archivos' },
  { key: 'library', label: 'Elegir de la galería' },
];

function uploadNotice(selectedCount: number, waitingCount: number): string {
  const parts: string[] = [];
  if (selectedCount > 0) {
    parts.push(
      selectedCount === 1
        ? '1 imagen subida y seleccionada. Pulse «Agregar» para usarla.'
        : `${selectedCount} imágenes subidas y seleccionadas. Pulse «Agregar» para usarlas.`,
    );
  }
  if (waitingCount > 0) {
    parts.push(
      waitingCount === 1
        ? '1 imagen aún se procesa o ya estaba agregada.'
        : `${waitingCount} imágenes aún se procesan o ya estaban agregadas.`,
    );
  }
  return parts.join(' ');
}

function PickerContent({
  title,
  multiple,
  excludeIds,
  initialTab,
  onClose,
  onSelect,
}: {
  title: string;
  multiple: boolean;
  excludeIds: readonly string[];
  initialTab?: MediaPickerTab;
  onClose: () => void;
  onSelect: (items: MediaAsset[]) => void;
}) {
  const id = useId();
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [data, setData] = useState<Paginated<MediaAsset> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<MediaAsset[]>([]);
  const [chosenTab, setChosenTab] = useState<MediaPickerTab | null>(initialTab ?? null);
  const [notice, setNotice] = useState<string | null>(null);
  const tabRefs = useRef<Partial<Record<MediaPickerTab, HTMLButtonElement | null>>>({});

  useEffect(() => {
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
  }, [page, reload]);

  // Until the user picks a tab: upload when the library is empty, otherwise the gallery.
  const tab: MediaPickerTab = chosenTab ?? (data && data.total === 0 ? 'upload' : 'library');
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

  const onUploaded = (uploaded: MediaAsset[]) => {
    const usable = uploaded.filter((item) => isPublishable(item) && !excluded.has(item.id));
    setReload((n) => n + 1);
    if (!multiple) {
      if (usable[0]) onSelect([usable[0]]);
      else setNotice('La imagen aún se procesa. Elíjala en la galería cuando esté lista.');
      return;
    }
    setSelected((current) => [
      ...current,
      ...usable.filter((item) => !current.some((m) => m.id === item.id)),
    ]);
    setNotice(uploadNotice(usable.length, uploaded.length - usable.length));
  };

  const selectTab = (key: MediaPickerTab, focus = false) => {
    setChosenTab(key);
    if (focus) tabRefs.current[key]?.focus();
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4 border-b border-border p-4">
        <h2 id="media-picker-title" className="text-lg">
          {title}
        </h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cerrar
        </Button>
      </div>
      <div
        role="tablist"
        aria-label="Origen de la imagen"
        className="flex gap-1 border-b border-border px-4 pt-2"
      >
        {TABS.map(({ key, label }, index) => (
          <button
            key={key}
            ref={(element) => {
              tabRefs.current[key] = element;
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${key}`}
            aria-selected={tab === key}
            aria-controls={`${id}-panel`}
            tabIndex={tab === key ? 0 : -1}
            onClick={() => selectTab(key)}
            onKeyDown={(event) => {
              if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
              event.preventDefault();
              const step = event.key === 'ArrowRight' ? 1 : -1;
              const next = TABS[(index + step + TABS.length) % TABS.length];
              if (next) selectTab(next.key, true);
            }}
            className={cx(
              '-mb-px min-h-11 rounded-t-sm border-b-2 px-3 text-sm font-semibold',
              tab === key
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-tab-${tab}`}
        className="max-h-[60dvh] overflow-y-auto p-4"
      >
        {notice ? (
          <p role="status" className="mb-3 text-sm font-semibold text-green">
            {notice}
          </p>
        ) : null}
        {tab === 'upload' ? (
          <MediaUploader multiple={multiple} onUploaded={onUploaded} />
        ) : (
          <>
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
                La galería está vacía. Use «Subir archivos» para agregar imágenes.
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
          </>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border p-4">
        {tab === 'library' ? (
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
        ) : (
          <span />
        )}
        {multiple ? (
          <Button
            disabled={selected.length === 0}
            onClick={() => {
              onSelect(selected);
              setSelected([]);
            }}
          >
            Agregar{selected.length > 0 ? ` (${selected.length})` : ''}
          </Button>
        ) : null}
      </div>
    </>
  );
}

export interface MediaPreview {
  variants: unknown;
  altText: string | null;
  width?: number | null;
  height?: number | null;
}

/**
 * Form control for one image (logo, hero slide…): "Subir imagen" opens the picker on the upload
 * tab, "Elegir de la galería" on the gallery; once set, a preview with "Reemplazar" and "Quitar".
 * `warnings` lists problems of the chosen image (for example a small hero photo).
 */
export function MediaField({
  label,
  hint,
  value,
  preview,
  onChange,
  error,
  warnings,
}: {
  label: string;
  hint?: string;
  value: string | null | undefined;
  preview?: MediaPreview | null;
  onChange: (id: string | null, media?: MediaAsset) => void;
  error?: string;
  warnings?: (media: { width: number | null; height: number | null }) => string[];
}) {
  const [pickerTab, setPickerTab] = useState<MediaPickerTab | null>(null);
  const name = label.toLowerCase();
  const issues =
    value && preview && warnings
      ? warnings({ width: preview.width ?? null, height: preview.height ?? null })
      : [];
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold">{label}</span>
      <div className="flex flex-wrap items-center gap-3">
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
        {value ? (
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPickerTab('library')}
              aria-label={`Reemplazar ${name}`}
            >
              Reemplazar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange(null)}
              aria-label={`Quitar ${name}`}
            >
              Quitar
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPickerTab('upload')}
              aria-label={`Subir imagen para ${name}`}
            >
              <ImageUp aria-hidden="true" className="size-4" /> Subir imagen
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPickerTab('library')}
              aria-label={`Elegir de la galería: ${name}`}
            >
              Elegir de la galería
            </Button>
          </>
        )}
      </div>
      {issues.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {issues.map((issue) => (
            <li key={issue}>
              <WarningBadge>{issue}</WarningBadge>
            </li>
          ))}
        </ul>
      ) : null}
      {hint ? <p className="text-[0.8125rem] leading-snug text-muted-foreground">{hint}</p> : null}
      {error ? <p className="text-sm font-semibold text-destructive">{error}</p> : null}
      <MediaPicker
        open={pickerTab !== null}
        title={label}
        initialTab={pickerTab ?? undefined}
        onClose={() => setPickerTab(null)}
        onSelect={([item]) => {
          if (item) onChange(item.id, item);
          setPickerTab(null);
        }}
      />
    </div>
  );
}
