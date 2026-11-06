'use client';

import {
  DEFAULT_WHATSAPP_GREETING,
  buildWhatsAppMessage,
  hotelProfileUpdateSchema,
} from '@hotel-bambu/shared';
import { Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Controller, useFieldArray, useForm, useWatch, type FieldValues } from 'react-hook-form';
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
  'tagline',
  'shortDescription',
  'description',
  'address',
  'municipality',
  'department',
  'country',
  'mapUrl',
  'directions',
  'nearbyAttractions',
  'phone',
  'whatsappNumber',
  'whatsappGreeting',
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
  };
}

type Preview = { variants: unknown; altText: string | null } | null;

export function HotelForm({ profile }: { profile: HotelProfile }) {
  const router = useRouter();
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<Preview>(profile.logoMedia);
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
  const greeting = (useWatch({ control, name: 'whatsappGreeting' }) as string | undefined) ?? null;
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

      <FormSection id="datos" title="Datos generales">
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
        <TextField
          className="md:col-span-2"
          label="Lema"
          hint="Frase corta de la portada (máximo 160 caracteres)."
          error={err('tagline')}
          registration={register('tagline')}
        />
        <TextAreaField
          className="md:col-span-2"
          label="Descripción corta"
          hint="Una o dos frases para buscadores y redes (máximo 300 caracteres)."
          rows={2}
          error={err('shortDescription')}
          registration={register('shortDescription')}
        />
        <TextAreaField
          className="md:col-span-2"
          label="Sobre nosotros"
          hint="Texto de «Sobre nosotros» en el inicio. Separe los párrafos con una línea en blanco."
          rows={6}
          error={err('description')}
          registration={register('description')}
        />
      </FormSection>

      <FormSection
        id="imagenes"
        title="Imágenes"
        description="Las fotos de la portada se gestionan en «Contenido › Carrusel principal»."
      >
        <Controller
          control={control}
          name="logoMediaId"
          render={({ field, fieldState }) => (
            <MediaField
              label="Logo"
              value={field.value as string | null}
              preview={logoPreview}
              error={fieldState.error?.message}
              onChange={(id, media) => {
                field.onChange(id);
                setLogoPreview(media ?? null);
              }}
            />
          )}
        />
      </FormSection>

      <FormSection id="contacto" title="Contacto">
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
      </FormSection>

      <FormSection
        id="whatsapp"
        title="WhatsApp"
        description="Sin número, los botones del sitio no abren WhatsApp. Los mensajes están predefinidos; aquí solo se edita el saludo con el que empiezan."
      >
        <TextField
          label="Número de WhatsApp"
          hint="Con indicativo de país, por ejemplo 57 310 000 0000."
          type="tel"
          inputMode="tel"
          error={err('whatsappNumber')}
          registration={register('whatsappNumber')}
        />
        <TextField
          label="Saludo de los mensajes"
          hint={`Opcional. Por defecto: «${DEFAULT_WHATSAPP_GREETING}».`}
          error={err('whatsappGreeting')}
          registration={register('whatsappGreeting')}
        />
        <div className="text-sm text-muted-foreground md:col-span-2">
          <p className="font-semibold text-foreground">Vista previa</p>
          <p className="mt-1">{buildWhatsAppMessage({ kind: 'general' }, greeting)}</p>
          <p className="mt-1">
            {buildWhatsAppMessage({ kind: 'roomType', name: 'Habitación de pareja' }, greeting)}
          </p>
        </div>
      </FormSection>

      <FormSection id="ubicacion" title="Ubicación">
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
        <TextField label="País" error={err('country')} registration={register('country')} />
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

      <FormSection id="horarios" title="Horarios">
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

      <div className="sticky bottom-3 z-10 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white/95 px-4 py-3 shadow-md backdrop-blur-sm tab:px-5">
        <Button type="submit" loading={isSubmitting}>
          Guardar cambios
        </Button>
        {isDirty ? (
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-warn-fg">
            <span aria-hidden="true" className="size-2 rounded-full bg-gold" />
            Hay cambios sin guardar.
          </span>
        ) : null}
      </div>
    </form>
  );
}
