'use client';

import { mediaUpdateSchema } from '@hotel-bambu/shared';
import { Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm, type FieldValues } from 'react-hook-form';
import { useConfirm, useToast } from '@/components/admin/feedback';
import { FormAlert, TextAreaField, TextField } from '@/components/admin/fields';
import { FormModal } from '@/components/admin/form-modal';
import { MediaThumb } from '@/components/admin/media-thumb';
import { MediaUploader } from '@/components/admin/media-uploader';
import { Badge, Button, Card, EmptyState } from '@/components/admin/ui';
import { browserApi } from '@/lib/api/browser';
import { isApiError } from '@/lib/api/client';
import type { MediaAsset, Paginated } from '@/lib/api/types';
import { applyApiError, describeApiError } from '@/lib/forms/form-errors';
import { formResolver } from '@/lib/forms/resolver';

const STATUS_LABELS: Record<MediaAsset['status'], string> = {
  READY: 'Lista',
  PROCESSING: 'Procesando',
  UPLOADING: 'Subiendo',
  FAILED: 'Falló',
};

/** Upload card: drag & drop, several files, alt text per file (shared with the picker). */
function UploadCard() {
  const router = useRouter();
  return (
    <Card>
      <section aria-labelledby="upload-title" className="flex flex-col gap-4">
        <h2 id="upload-title" className="text-lg">
          Subir imágenes
        </h2>
        <MediaUploader multiple withCaption withGalleryOption onUploaded={() => router.refresh()} />
      </section>
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
    formState: { errors, isSubmitting, isDirty },
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
    <FormModal
      open
      onClose={onDone}
      title="Editar imagen"
      size="sm"
      dirty={isDirty}
      onSubmit={onSubmit}
      submitting={isSubmitting}
      submitLabel="Guardar cambios"
    >
      <MediaThumb
        variants={item.variants}
        alt=""
        className="aspect-4/3 w-full rounded-sm"
        minWidth={480}
      />
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
    </FormModal>
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
      <UploadCard />
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
