'use client';

import { hotelProfileUpdateSchema } from '@hotel-bambu/shared';
import { Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Controller, useFieldArray, useForm, type FieldValues } from 'react-hook-form';
import { useToast } from '@/components/admin/feedback';
import { FormAlert, FormSection, TextAreaField, TextField } from '@/components/admin/fields';
import { useUnsavedChangesWarning } from '@/components/admin/hooks';
import { MediaField } from '@/components/admin/media-picker';
import { Button } from '@/components/admin/ui';
import { browserApi } from '@/lib/api/browser';
import type { HotelProfile } from '@/lib/api/types';
import { applyApiError } from '@/lib/forms/form-errors';
import { asNullableNumber, asNullableString, formResolver } from '@/lib/forms/resolver';

const TEXT_FIELDS = [
  'name',
  'legalName',
  'rntNumber',
  'escnnaNotice',
  'shortDescription',
  'description',
  'address',
  'municipality',
  'department',
  'mapUrl',
  'directions',
  'nearbyAttractions',
  'phone',
  'email',
] as const;

const FIELD_NAMES = [
  ...TEXT_FIELDS,
  'latitude',
  'longitude',
  'openingHours',
  'checkInTime',
  'checkOutTime',
  'logoMediaId',
  'heroMediaId',
];

function toFormValues(profile: HotelProfile): FieldValues {
  const values: FieldValues = {};
  for (const key of TEXT_FIELDS) values[key] = profile[key] ?? '';
  return {
    ...values,
    latitude: profile.latitude,
    longitude: profile.longitude,
    openingHours: profile.openingHours ?? [],
    checkInTime: profile.checkInTime,
    checkOutTime: profile.checkOutTime,
    logoMediaId: profile.logoMediaId,
    heroMediaId: profile.heroMediaId,
  };
}

type Preview = { variants: unknown; altText: string | null } | null;

export function HotelForm({ profile }: { profile: HotelProfile }) {
  const router = useRouter();
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<'logo' | 'hero', Preview>>({
    logo: profile.logoMedia,
    hero: profile.heroMedia,
  });
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FieldValues, unknown, FieldValues>({
    resolver: formResolver(hotelProfileUpdateSchema) as never,
    defaultValues: toFormValues(profile),
  });
  const hours = useFieldArray({ control, name: 'openingHours' });
  useUnsavedChangesWarning(isDirty);

  const err = (name: string) => errors[name] as { message?: string } | undefined;

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const saved = await browserApi.patch<HotelProfile>('/admin/hotel', values);
      reset(toFormValues(saved));
      toast.success('Información del hotel guardada.');
      router.refresh();
    } catch (error) {
      setFormError(applyApiError(error, setError, FIELD_NAMES).message);
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <FormAlert message={formError} />

      <FormSection title="Datos generales">
        <TextField
          label="Nombre comercial"
          required
          error={err('name')}
          registration={register('name')}
        />
        <TextField
          label="Razón social"
          hint="Opcional."
          error={err('legalName')}
          registration={register('legalName')}
        />
        <TextField
          label="Número RNT"
          hint="Registro Nacional de Turismo. Opcional; se muestra en el pie de página."
          error={err('rntNumber')}
          registration={register('rntNumber')}
        />
        <TextAreaField
          className="md:col-span-2"
          label="Aviso ESCNNA"
          hint="Texto de prevención de explotación sexual de niños, niñas y adolescentes (Ley 679 de 2001). Opcional."
          rows={3}
          error={err('escnnaNotice')}
          registration={register('escnnaNotice')}
        />
        <TextAreaField
          className="md:col-span-2"
          label="Descripción corta"
          hint="Una o dos frases (máximo 300 caracteres)."
          rows={2}
          error={err('shortDescription')}
          registration={register('shortDescription')}
        />
        <TextAreaField
          className="md:col-span-2"
          label="Descripción completa"
          rows={6}
          error={err('description')}
          registration={register('description')}
        />
      </FormSection>

      <FormSection title="Imágenes">
        <Controller
          control={control}
          name="logoMediaId"
          render={({ field, fieldState }) => (
            <MediaField
              label="Logo"
              value={field.value as string | null}
              preview={previews.logo}
              error={fieldState.error?.message}
              onChange={(id, media) => {
                field.onChange(id);
                setPreviews((p) => ({ ...p, logo: media ?? null }));
              }}
            />
          )}
        />
        <Controller
          control={control}
          name="heroMediaId"
          render={({ field, fieldState }) => (
            <MediaField
              label="Imagen principal"
              hint="Se muestra en la portada del sitio."
              value={field.value as string | null}
              preview={previews.hero}
              error={fieldState.error?.message}
              onChange={(id, media) => {
                field.onChange(id);
                setPreviews((p) => ({ ...p, hero: media ?? null }));
              }}
            />
          )}
        />
      </FormSection>

      <FormSection title="Contacto">
        <TextField
          label="Teléfono"
          type="tel"
          inputMode="tel"
          error={err('phone')}
          registration={register('phone')}
        />
        <TextField
          label="Correo electrónico"
          type="email"
          inputMode="email"
          error={err('email')}
          registration={register('email')}
        />
        <p className="text-sm text-muted-foreground md:col-span-2">
          El número de WhatsApp y los mensajes predefinidos se editan en{' '}
          <Link href="/admin/whatsapp" className="text-primary underline underline-offset-4">
            WhatsApp
          </Link>
          .
        </p>
      </FormSection>

      <FormSection title="Ubicación">
        <TextField
          className="md:col-span-2"
          label="Dirección"
          error={err('address')}
          registration={register('address')}
        />
        <TextField
          label="Municipio"
          error={err('municipality')}
          registration={register('municipality')}
        />
        <TextField
          label="Departamento"
          error={err('department')}
          registration={register('department')}
        />
        <TextField
          label="Latitud"
          inputMode="decimal"
          hint="Ejemplo: 1.1494"
          error={err('latitude')}
          registration={register('latitude', { setValueAs: asNullableNumber })}
        />
        <TextField
          label="Longitud"
          inputMode="decimal"
          hint="Ejemplo: -76.6464"
          error={err('longitude')}
          registration={register('longitude', { setValueAs: asNullableNumber })}
        />
        <TextField
          className="md:col-span-2"
          label="Enlace del mapa"
          type="url"
          inputMode="url"
          hint="Enlace de Google Maps (https://…)."
          error={err('mapUrl')}
          registration={register('mapUrl')}
        />
        <TextAreaField
          className="md:col-span-2"
          label="Cómo llegar"
          rows={3}
          error={err('directions')}
          registration={register('directions')}
        />
        <TextAreaField
          className="md:col-span-2"
          label="Atractivos cercanos"
          rows={3}
          error={err('nearbyAttractions')}
          registration={register('nearbyAttractions')}
        />
      </FormSection>

      <FormSection title="Horarios">
        <TextField
          label="Hora de check-in"
          type="time"
          error={err('checkInTime')}
          registration={register('checkInTime', { setValueAs: asNullableString })}
        />
        <TextField
          label="Hora de check-out"
          type="time"
          error={err('checkOutTime')}
          registration={register('checkOutTime', { setValueAs: asNullableString })}
        />
        <div className="md:col-span-2">
          <p className="text-sm font-semibold">Horarios de atención</p>
          <p className="mb-2 text-xs text-muted-foreground">
            Por ejemplo: «Lunes a domingo» — «24 horas».
          </p>
          <ul className="flex flex-col gap-3">
            {hours.fields.map((row, index) => (
              <li key={row.id} className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <TextField
                  label={`Días (fila ${index + 1})`}
                  error={
                    (
                      errors.openingHours as unknown as
                        Record<number, Record<string, { message?: string }>> | undefined
                    )?.[index]?.days
                  }
                  registration={register(`openingHours.${index}.days`)}
                />
                <TextField
                  label={`Horas (fila ${index + 1})`}
                  error={
                    (
                      errors.openingHours as unknown as
                        Record<number, Record<string, { message?: string }>> | undefined
                    )?.[index]?.hours
                  }
                  registration={register(`openingHours.${index}.hours`)}
                />
                <Button
                  variant="ghost"
                  aria-label={`Quitar fila ${index + 1}`}
                  onClick={() => hours.remove(index)}
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() => hours.append({ days: '', hours: '' })}
          >
            <Plus aria-hidden="true" className="size-4" /> Agregar horario
          </Button>
        </div>
      </FormSection>

      <div className="sticky bottom-0 flex items-center gap-3 border-t border-border bg-background py-3">
        <Button type="submit" loading={isSubmitting}>
          Guardar cambios
        </Button>
        {isDirty ? (
          <span className="text-sm text-muted-foreground">Hay cambios sin guardar.</span>
        ) : null}
      </div>
    </form>
  );
}
