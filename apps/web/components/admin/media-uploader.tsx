'use client';

import { GALLERY_CATEGORIES } from '@hotel-bambu/shared';
import { CheckCircle2, ImageUp, Trash2, TriangleAlert } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState, type DragEvent } from 'react';
import {
  ACCEPTED_IMAGE_TYPES,
  ALT_TEXT_MAX,
  UploadError,
  altTextError,
  uploadImage,
  validateImageFile,
} from '@/lib/admin/media-upload';
import { browserApi } from '@/lib/api/browser';
import type { MediaAsset } from '@/lib/api/types';
import { describeApiError } from '@/lib/forms/form-errors';
import { GALLERY_CATEGORY_LABELS } from '@/lib/labels';
import { useToast } from './feedback';
import { inputClasses } from './fields';
import { Button, cx } from './ui';

export type UploadStatus = 'pending' | 'uploading' | 'processing' | 'ready' | 'error';

export interface UploadItem {
  key: string;
  file: File;
  previewUrl: string | null;
  altText: string;
  caption: string;
  status: UploadStatus;
  /** Upload or processing error (Spanish). */
  error: string | null;
  altError: string | null;
  media: MediaAsset | null;
}

const STATUS_TEXT: Record<UploadStatus, string> = {
  pending: 'Lista para subir',
  uploading: 'Subiendo…',
  processing: 'Procesando…',
  ready: 'Subida',
  error: 'No se pudo subir',
};

const objectUrl = (file: File) =>
  typeof URL.createObjectURL === 'function' ? URL.createObjectURL(file) : null;
const revoke = (url: string | null) => {
  if (url && typeof URL.revokeObjectURL === 'function') URL.revokeObjectURL(url);
};

let keySeed = 0;

/**
 * Upload queue shared by the media library and the picker: client-side validation (format, size,
 * alt text), sequential uploads with a per-file status, and READY detection. Only one file is kept
 * when `multiple` is false.
 */
export function useMediaUploads({ multiple }: { multiple: boolean }) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [rejected, setRejected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Release preview URLs when the queue unmounts.
  useEffect(() => () => itemsRef.current.forEach((item) => revoke(item.previewUrl)), []);

  const patch = useCallback((key: string, changes: Partial<UploadItem>) => {
    setItems((current) =>
      current.map((item) => (item.key === key ? { ...item, ...changes } : item)),
    );
  }, []);

  const addFiles = useCallback(
    (files: readonly File[]) => {
      const errors: string[] = [];
      const accepted: UploadItem[] = [];
      for (const file of files) {
        const problem = validateImageFile(file);
        if (problem) {
          errors.push(problem);
          continue;
        }
        accepted.push({
          key: `upload-${++keySeed}`,
          file,
          previewUrl: objectUrl(file),
          altText: '',
          caption: '',
          status: 'pending',
          error: null,
          altError: null,
          media: null,
        });
      }
      setRejected(errors);
      if (accepted.length === 0) return;
      setItems((current) => {
        if (multiple) return [...current, ...accepted];
        current.forEach((item) => revoke(item.previewUrl));
        return accepted.slice(0, 1);
      });
    },
    [multiple],
  );

  const remove = useCallback((key: string) => {
    setItems((current) => {
      revoke(current.find((item) => item.key === key)?.previewUrl ?? null);
      return current.filter((item) => item.key !== key);
    });
  }, []);

  const setAltText = useCallback(
    (key: string, altText: string) => patch(key, { altText, altError: null }),
    [patch],
  );
  const setCaption = useCallback(
    (key: string, caption: string) => patch(key, { caption }),
    [patch],
  );

  /** Drops finished files from the queue (after they were handed to the caller). */
  const clearUploaded = useCallback(() => {
    setItems((current) => {
      current.filter((item) => item.status === 'ready').forEach((i) => revoke(i.previewUrl));
      return current.filter((item) => item.status !== 'ready');
    });
  }, []);

  /**
   * Uploads every pending or failed file. Returns the uploaded assets (READY or still processing),
   * or `null` when an alt text is missing (nothing is sent then).
   */
  const uploadAll = useCallback(
    async (extra: { galleryCategory?: string } = {}): Promise<MediaAsset[] | null> => {
      const queue = itemsRef.current.filter(
        (item) => item.status === 'pending' || item.status === 'error',
      );
      const altErrors = new Map(queue.map((item) => [item.key, altTextError(item.altText)]));
      if ([...altErrors.values()].some(Boolean)) {
        setItems((current) =>
          current.map((item) =>
            altErrors.has(item.key) ? { ...item, altError: altErrors.get(item.key) ?? null } : item,
          ),
        );
        return null;
      }
      setBusy(true);
      const uploaded: MediaAsset[] = [];
      try {
        for (const item of queue) {
          patch(item.key, { status: 'uploading', error: null });
          try {
            const media = await uploadImage(
              browserApi,
              {
                file: item.file,
                altText: item.altText,
                caption: item.caption,
                galleryCategory: extra.galleryCategory,
              },
              { onStatus: (phase) => patch(item.key, { status: phase }) },
            );
            uploaded.push(media);
            patch(item.key, {
              status: media.status === 'READY' ? 'ready' : 'processing',
              media,
            });
          } catch (error) {
            patch(item.key, {
              status: 'error',
              error: error instanceof UploadError ? error.message : describeApiError(error),
            });
          }
        }
      } finally {
        setBusy(false);
      }
      return uploaded;
    },
    [patch],
  );

  return {
    items,
    rejected,
    busy,
    addFiles,
    remove,
    setAltText,
    setCaption,
    uploadAll,
    clearUploaded,
  };
}

export type MediaUploads = ReturnType<typeof useMediaUploads>;

/**
 * Drag & drop zone + file list with one alt text per file (requirement 10). Not a <form>: it is
 * rendered inside other forms (hotel profile, room types), so Enter in an alt text uploads instead
 * of submitting the outer form.
 */
export function MediaUploader({
  multiple,
  onUploaded,
  withCaption = false,
  withGalleryOption = false,
}: {
  multiple: boolean;
  /** Called with the assets uploaded in this round (READY or still processing). */
  onUploaded: (media: MediaAsset[]) => void;
  withCaption?: boolean;
  withGalleryOption?: boolean;
}) {
  const uploads = useMediaUploads({ multiple });
  const { items, rejected, busy, addFiles, remove, setAltText, setCaption, uploadAll } = uploads;
  const toast = useToast();
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [galleryCategory, setGalleryCategory] = useState('');
  const pending = items.filter((item) => item.status === 'pending' || item.status === 'error');

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    addFiles([...event.dataTransfer.files]);
  };

  const submit = async () => {
    const uploaded = await uploadAll(galleryCategory ? { galleryCategory } : {});
    if (uploaded === null) {
      // Focus the first alt text that needs attention.
      const firstMissing = document.querySelector<HTMLInputElement>(
        `[data-upload-root="${id}"] [aria-invalid="true"]`,
      );
      firstMissing?.focus();
      return;
    }
    if (uploaded.length > 0) {
      toast.success(
        uploaded.length === 1 ? 'Imagen subida.' : `${uploaded.length} imágenes subidas.`,
      );
      onUploaded(uploaded);
    }
    const failed = pending.length - uploaded.length;
    if (failed > 0) {
      toast.error(
        failed === 1 ? 'Una imagen no se pudo subir.' : `${failed} imágenes no se pudieron subir.`,
      );
    }
  };

  const plural = pending.length === 1 ? 'imagen' : 'imágenes';

  return (
    <div data-upload-root={id} className="flex flex-col gap-4">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cx(
          'flex flex-col items-center gap-2 rounded-2xl border-[1.5px] border-dashed p-5 text-center',
          dragging ? 'border-green bg-green/5' : 'border-line bg-ivory/50',
        )}
      >
        <ImageUp aria-hidden="true" className="size-7 text-green" />
        <label htmlFor={`${id}-files`} className="text-sm font-semibold">
          Archivos
          <span className="block font-normal text-muted-foreground">
            Arrastre {multiple ? 'las imágenes' : 'la imagen'} aquí o selecciónela
            {multiple ? 's' : ''}.
          </span>
        </label>
        <input
          ref={inputRef}
          id={`${id}-files`}
          type="file"
          multiple={multiple}
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          aria-describedby={`${id}-files-hint`}
          className={cx(
            'max-w-full text-sm',
            'file:mr-3 file:cursor-pointer file:rounded-pill file:border-0 file:bg-green file:px-4 file:py-2 file:text-sm file:font-bold file:text-white',
          )}
          onChange={(event) => {
            addFiles([...(event.target.files ?? [])]);
            event.target.value = '';
          }}
        />
        <p id={`${id}-files-hint`} className="text-[0.8125rem] text-muted-foreground">
          JPG, PNG o WebP, máximo 15 MB{multiple ? ' cada una' : ''}. Se eliminan los metadatos
          (GPS).
        </p>
      </div>

      {rejected.length > 0 ? (
        <ul role="alert" className="flex flex-col gap-1 text-sm font-semibold text-destructive">
          {rejected.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      ) : null}

      {items.length > 0 ? (
        <ul className="flex flex-col gap-3" aria-label="Imágenes seleccionadas">
          {items.map((item) => (
            <UploadRow
              key={item.key}
              item={item}
              withCaption={withCaption}
              disabled={busy}
              onAltText={(value) => setAltText(item.key, value)}
              onCaption={(value) => setCaption(item.key, value)}
              onRemove={() => remove(item.key)}
              onEnter={() => void submit()}
            />
          ))}
        </ul>
      ) : null}

      {withGalleryOption && items.length > 0 ? (
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Agregar también a la galería
          <select
            className={inputClasses}
            value={galleryCategory}
            onChange={(event) => setGalleryCategory(event.target.value)}
          >
            <option value="">No agregar</option>
            {GALLERY_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {GALLERY_CATEGORY_LABELS[value]}
              </option>
            ))}
          </select>
          <span className="font-normal text-muted-foreground">
            Quedan sin publicar hasta que las publique en «Galería».
          </span>
        </label>
      ) : null}

      {pending.length > 0 ? (
        <div>
          <Button onClick={() => void submit()} loading={busy}>
            Subir {pending.length} {plural}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function UploadRow({
  item,
  withCaption,
  disabled,
  onAltText,
  onCaption,
  onRemove,
  onEnter,
}: {
  item: UploadItem;
  withCaption: boolean;
  disabled: boolean;
  onAltText: (value: string) => void;
  onCaption: (value: string) => void;
  onRemove: () => void;
  onEnter: () => void;
}) {
  const id = useId();
  const locked = disabled || item.status === 'ready' || item.status === 'processing';
  const errorId = item.altError ? `${id}-alt-error` : undefined;
  return (
    <li className="grid gap-3 rounded-sm border border-border p-3 sm:grid-cols-[7rem_1fr_auto]">
      {item.previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.previewUrl} alt="" className="aspect-4/3 w-28 rounded-xs object-cover" />
      ) : (
        <span className="flex aspect-4/3 w-28 items-center justify-center rounded-xs bg-muted text-xs text-muted-foreground">
          Vista previa
        </span>
      )}
      <div className="flex min-w-0 flex-col gap-2">
        <p className="truncate text-sm font-semibold">{item.file.name}</p>
        <label htmlFor={`${id}-alt`} className="text-sm font-semibold">
          <span className="sr-only">Texto alternativo de {item.file.name}</span>
          <span aria-hidden="true">
            Texto alternativo <span className="text-destructive">*</span>
          </span>
        </label>
        <input
          id={`${id}-alt`}
          className={inputClasses}
          value={item.altText}
          maxLength={ALT_TEXT_MAX + 50}
          readOnly={locked}
          aria-invalid={item.altError ? true : undefined}
          aria-describedby={[`${id}-alt-hint`, errorId].filter(Boolean).join(' ')}
          onChange={(event) => onAltText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onEnter();
            }
          }}
        />
        <p id={`${id}-alt-hint`} className="text-[0.8125rem] leading-snug text-muted-foreground">
          Describa lo que se ve. Ejemplo: «Habitación doble con cama queen y ventana».
        </p>
        {item.altError ? (
          <p
            id={errorId}
            className="flex items-center gap-1.5 text-sm font-semibold text-destructive"
          >
            <TriangleAlert aria-hidden="true" className="size-4" />
            {item.altError}
          </p>
        ) : null}
        {withCaption ? (
          <>
            <label htmlFor={`${id}-caption`} className="text-sm font-semibold">
              Descripción (opcional)
            </label>
            <input
              id={`${id}-caption`}
              className={inputClasses}
              value={item.caption}
              maxLength={300}
              readOnly={locked}
              onChange={(event) => onCaption(event.target.value)}
            />
          </>
        ) : null}
        <p role="status" className="flex items-center gap-1.5 text-sm">
          {item.status === 'ready' ? (
            <CheckCircle2 aria-hidden="true" className="size-4 text-green" />
          ) : item.status === 'uploading' || item.status === 'processing' ? (
            <span
              aria-hidden="true"
              className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            />
          ) : null}
          <span className={item.status === 'error' ? 'font-semibold text-destructive' : undefined}>
            {STATUS_TEXT[item.status]}
            {item.error ? `: ${item.error}` : ''}
          </span>
        </p>
      </div>
      <div>
        <Button
          variant="ghost"
          size="sm"
          disabled={item.status === 'uploading'}
          aria-label={`Quitar ${item.file.name} de la lista`}
          onClick={onRemove}
        >
          <Trash2 aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </li>
  );
}
