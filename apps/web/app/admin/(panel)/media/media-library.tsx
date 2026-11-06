'use client';

import {
  GALLERY_CATEGORIES,
  mediaUpdateSchema,
  mediaUploadFieldsSchema,
} from '@hotel-bambu/shared';
import { Pencil, Trash2, Upload } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useForm, type FieldValues } from 'react-hook-form';
import { useConfirm, useToast } from '@/components/admin/feedback';
import {
  Field,
  FormAlert,
  SelectField,
  TextAreaField,
  TextField,
  inputClasses,
} from '@/components/admin/fields';
import { MediaThumb } from '@/components/admin/media-thumb';
import { Badge, Button, Card, EmptyState, cx } from '@/components/admin/ui';
import { browserApi } from '@/lib/api/browser';
import { isApiError } from '@/lib/api/client';
import type { MediaAsset, Paginated } from '@/lib/api/types';
import { applyApiError, describeApiError } from '@/lib/forms/form-errors';
import { formResolver } from '@/lib/forms/resolver';
import { GALLERY_CATEGORY_LABELS } from '@/lib/labels';

const MAX_BYTES = 15 * 1024 * 1024;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

const STATUS_LABELS: Record<MediaAsset['status'], string> = {
  READY: 'Lista',
  PROCESSING: 'Procesando',
  UPLOADING: 'Subiendo',
  FAILED: 'Falló',
};

function UploadForm() {
  const router = useRouter();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FieldValues, unknown, FieldValues>({
    resolver: formResolver(mediaUploadFieldsSchema) as never,
    defaultValues: { altText: '', caption: '', galleryCategory: undefined },
  });

  // Release the object URL of the previous preview.
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const chooseFile = (selected: File | null) => {
    setFileError(null);
    setPreview(selected && ACCEPTED.includes(selected.type) ? URL.createObjectURL(selected) : null);
    if (selected && !ACCEPTED.includes(selected.type)) {
      setFileError('Formato no permitido. Use JPG, PNG o WebP.');
      setFile(null);
      setPreview(null);
      return;
    }
    if (selected && selected.size > MAX_BYTES) {
      setFileError('El archivo supera 15 MB.');
      setFile(null);
      setPreview(null);
      return;
    }
    setFile(selected);
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    if (!file) {
      setFileError('Seleccione una imagen.');
      fileRef.current?.focus();
      return;
    }
    // Text fields must precede the file part (API contract, docs/api.md).
    const body = new FormData();
    body.append('altText', values.altText as string);
    if (values.caption) body.append('caption', values.caption as string);
    if (values.galleryCategory) body.append('galleryCategory', values.galleryCategory as string);
    body.append('file', file);
    try {
      await browserApi.post('/admin/media', body);
      toast.success('Imagen subida.');
      reset();
      setFile(null);
      setPreview(null);
      router.refresh();
    } catch (error) {
      const result = applyApiError(error, setError, ['altText', 'caption', 'galleryCategory']);
      if (isApiError(error) && error.details.some((d) => d.path === 'file')) {
        setFileError('El archivo no es una imagen válida.');
      }
      setFormError(result.message);
    }
  });

  return (
    <Card>
      <form
        onSubmit={onSubmit}
        noValidate
        className="flex flex-col gap-4"
        aria-label="Subir imagen"
      >
        <h2 className="text-lg">Subir imagen</h2>
        <FormAlert message={formError} />
        <div className="grid gap-4 md:grid-cols-[1fr_12rem]">
          <div className="flex flex-col gap-4">
            <Field
              label="Archivo"
              required
              hint="JPG, PNG o WebP, máximo 15 MB. Se eliminan los metadatos (GPS)."
              error={fileError ? { message: fileError } : undefined}
            >
              {(control) => (
                <input
                  {...control}
                  ref={fileRef}
                  type="file"
                  accept={ACCEPTED.join(',')}
                  className={cx(
                    inputClasses,
                    'min-h-[110px] cursor-pointer border-[1.5px] border-dashed bg-ivory/50 py-8 text-center',
                    'file:mr-3 file:cursor-pointer file:rounded-pill file:border-0 file:bg-green file:px-4 file:py-2 file:text-sm file:font-bold file:text-white',
                  )}
                  onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
                />
              )}
            </Field>
            <TextField
              label="Texto alternativo"
              required
              hint="Describa lo que se ve, para personas que no pueden ver la imagen. Ejemplo: «Habitación doble con cama queen y ventana»."
              error={errors.altText as { message?: string } | undefined}
              registration={register('altText')}
            />
            <TextAreaField
              label="Descripción (opcional)"
              rows={2}
              error={errors.caption as { message?: string } | undefined}
              registration={register('caption')}
            />
            <SelectField
              label="Agregar también a la galería"
              placeholder="No agregar"
              options={GALLERY_CATEGORIES.map((value) => ({
                value,
                label: GALLERY_CATEGORY_LABELS[value],
              }))}
              hint="Queda sin publicar hasta que la publique en «Galería»."
              error={errors.galleryCategory as { message?: string } | undefined}
              registration={register('galleryCategory', {
                setValueAs: (v: string) => (v ? v : undefined),
              })}
            />
          </div>
          <div aria-hidden={!preview}>
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Vista previa del archivo seleccionado"
                className="aspect-4/3 w-full rounded-sm object-cover"
              />
            ) : (
              <div className="flex aspect-4/3 items-center justify-center rounded-sm bg-muted text-sm text-muted-foreground">
                Vista previa
              </div>
            )}
          </div>
        </div>
        <div>
          <Button type="submit" loading={isSubmitting}>
            <Upload aria-hidden="true" className="size-4" /> Subir
          </Button>
        </div>
      </form>
    </Card>
  );
}

function EditMediaForm({ item, onDone }: { item: MediaAsset; onDone: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FieldValues, unknown, FieldValues>({
    resolver: formResolver(mediaUpdateSchema) as never,
    defaultValues: { altText: item.altText ?? '', caption: item.caption ?? '' },
  });
  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await browserApi.patch(`/admin/media/${item.id}`, values);
      toast.success('Imagen actualizada.');
      router.refresh();
      onDone();
    } catch (error) {
      setFormError(applyApiError(error, setError, ['altText', 'caption']).message);
    }
  });
  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3" aria-label="Editar imagen">
      <FormAlert message={formError} />
      <TextField
        label="Texto alternativo"
        required
        error={errors.altText as { message?: string } | undefined}
        registration={register('altText')}
      />
      <TextAreaField
        label="Descripción"
        rows={2}
        error={errors.caption as { message?: string } | undefined}
        registration={register('caption')}
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={isSubmitting}>
          Guardar
        </Button>
        <Button variant="secondary" size="sm" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

export function MediaLibrary({
  data,
  missingAlt,
}: {
  data: Paginated<MediaAsset>;
  missingAlt: boolean;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const confirm = useConfirm();
  const toast = useToast();
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);
  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));
  const pageHref = (page: number) =>
    `/admin/media?page=${page}${missingAlt ? '&missingAlt=true' : ''}`;

  const remove = async (item: MediaAsset) => {
    const ok = await confirm({
      title: '¿Eliminar imagen?',
      description:
        'Se borrarán el archivo y sus versiones. No se puede eliminar si una habitación, servicio, sección o el perfil del hotel la usa.',
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (!ok) return;
    setDeleting(item.id);
    try {
      await browserApi.delete(`/admin/media/${item.id}`);
      toast.success('Imagen eliminada.');
      router.refresh();
    } catch (error) {
      toast.error(
        isApiError(error) && error.status === 409
          ? 'La imagen está en uso. Quítela primero de habitaciones, del carrusel principal, de secciones o del perfil del hotel.'
          : describeApiError(error),
      );
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <UploadForm />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg">Biblioteca ({data.total})</h2>
        <Link
          href={missingAlt ? '/admin/media' : '/admin/media?missingAlt=true'}
          className="text-sm text-primary underline underline-offset-4"
        >
          {missingAlt ? 'Ver todas' : 'Ver solo sin texto alternativo'}
        </Link>
      </div>
      {data.items.length === 0 ? <EmptyState>No hay imágenes.</EmptyState> : null}
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.items.map((item) => {
          const uses = item._count
            ? item._count.roomTypeImages + item._count.heroSlides + item._count.hotelLogos
            : 0;
          return (
            <li
              key={item.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white"
            >
              <MediaThumb
                variants={item.variants}
                alt={item.altText ?? ''}
                className="aspect-4/3 w-full"
                minWidth={480}
              />
              <div className="flex flex-1 flex-col gap-2 p-3">
                {editing === item.id ? (
                  <EditMediaForm item={item} onDone={() => setEditing(null)} />
                ) : (
                  <>
                    <p className="text-sm">
                      {item.altText || (
                        <strong className="text-destructive">Sin texto alternativo</strong>
                      )}
                    </p>
                    {item.caption ? (
                      <p className="text-xs text-muted-foreground">{item.caption}</p>
                    ) : null}
                    <div className="flex flex-wrap gap-1.5">
                      <Badge
                        tone={
                          item.status === 'READY'
                            ? 'success'
                            : item.status === 'FAILED'
                              ? 'danger'
                              : 'neutral'
                        }
                      >
                        {STATUS_LABELS[item.status]}
                      </Badge>
                      {uses > 0 ? <Badge>En uso ({uses})</Badge> : null}
                      {item.galleryItems && item.galleryItems.length > 0 ? (
                        <Badge>En galería</Badge>
                      ) : null}
                      {item.width && item.height ? (
                        <Badge>
                          {item.width}×{item.height}
                        </Badge>
                      ) : null}
                    </div>
                    <div className="mt-auto flex gap-2 pt-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setEditing(item.id)}
                        aria-label={`Editar ${item.altText ?? 'imagen'}`}
                      >
                        <Pencil aria-hidden="true" className="size-4" /> Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        loading={deleting === item.id}
                        onClick={() => void remove(item)}
                        aria-label={`Eliminar ${item.altText ?? 'imagen'}`}
                      >
                        <Trash2 aria-hidden="true" className="size-4" /> Eliminar
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {totalPages > 1 ? (
        <nav aria-label="Páginas" className="flex items-center justify-center gap-3 text-sm">
          {data.page > 1 ? (
            <Link
              href={pageHref(data.page - 1)}
              className="text-primary underline underline-offset-4"
            >
              Anterior
            </Link>
          ) : null}
          <span>
            Página {data.page} de {totalPages}
          </span>
          {data.page < totalPages ? (
            <Link
              href={pageHref(data.page + 1)}
              className="text-primary underline underline-offset-4"
            >
              Siguiente
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
