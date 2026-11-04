'use client';

import { landingSectionUpdateSchema } from '@hotel-bambu/shared';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Controller, useForm, type FieldValues } from 'react-hook-form';
import { useToast } from '@/components/admin/feedback';
import { CheckboxField, FormAlert, TextAreaField, TextField } from '@/components/admin/fields';
import { useUnsavedChangesWarning } from '@/components/admin/hooks';
import { MediaField } from '@/components/admin/media-picker';
import { Button, Card } from '@/components/admin/ui';
import { browserApi } from '@/lib/api/browser';
import type { LandingSection } from '@/lib/api/types';
import { applyApiError } from '@/lib/forms/form-errors';
import { formResolver } from '@/lib/forms/resolver';

export const SECTION_LABELS: Record<string, string> = {
  HERO: 'Portada',
  ABOUT: 'Sobre el hotel',
  ROOMS: 'Habitaciones',
  SERVICES: 'Servicios',
  GALLERY: 'Galería',
  LOCATION: 'Ubicación',
  FAQ: 'Preguntas frecuentes',
  CONTACT: 'Contacto',
};

function toFormValues(section: LandingSection): FieldValues {
  return {
    title: section.title ?? '',
    subtitle: section.subtitle ?? '',
    body: section.body ?? '',
    ctaLabel: section.ctaLabel ?? '',
    mediaAssetId: section.mediaAssetId,
    enabled: section.enabled,
  };
}

/** Fixed fields per landing section (9.8): plain text only, no HTML. */
export function SectionForm({ section }: { section: LandingSection }) {
  const router = useRouter();
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ variants: unknown; altText: string | null } | null>(
    section.mediaAsset,
  );
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FieldValues, unknown, FieldValues>({
    resolver: formResolver(landingSectionUpdateSchema) as never,
    defaultValues: toFormValues(section),
  });
  useUnsavedChangesWarning(isDirty);
  const err = (name: string) => errors[name] as { message?: string } | undefined;
  const label = SECTION_LABELS[section.key] ?? section.key;

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const saved = await browserApi.put<LandingSection>(`/admin/content/${section.key}`, values);
      reset(toFormValues(saved));
      toast.success(`Sección «${label}» guardada.`);
      router.refresh();
    } catch (error) {
      setFormError(
        applyApiError(error, setError, [
          'title',
          'subtitle',
          'body',
          'ctaLabel',
          'mediaAssetId',
          'enabled',
        ]).message,
      );
    }
  });

  const headingId = `section-${section.key}`;
  return (
    <Card>
      <form
        onSubmit={onSubmit}
        noValidate
        aria-labelledby={headingId}
        className="flex flex-col gap-4"
      >
        <h2 id={headingId} className="text-xl font-semibold">
          {label}
        </h2>
        <FormAlert message={formError} />
        <CheckboxField
          label="Mostrar esta sección en la página de inicio"
          registration={register('enabled')}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Título" error={err('title')} registration={register('title')} />
          <TextField
            label="Subtítulo"
            error={err('subtitle')}
            registration={register('subtitle')}
          />
          <TextAreaField
            className="md:col-span-2"
            label="Texto"
            hint="Texto simple, sin HTML."
            rows={4}
            error={err('body')}
            registration={register('body')}
          />
          <TextField
            label="Texto del botón"
            hint="Por ejemplo: «Escríbanos por WhatsApp»."
            error={err('ctaLabel')}
            registration={register('ctaLabel')}
          />
        </div>
        <Controller
          control={control}
          name="mediaAssetId"
          render={({ field, fieldState }) => (
            <MediaField
              label="Imagen de la sección"
              value={field.value as string | null}
              preview={preview}
              error={fieldState.error?.message}
              onChange={(id, media) => {
                field.onChange(id);
                setPreview(media ? { variants: media.variants, altText: media.altText } : null);
              }}
            />
          )}
        />
        <div>
          <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
            Guardar sección
          </Button>
        </div>
      </form>
    </Card>
  );
}
