'use client';

import { BED_TYPES, roomTypeCreateSchema, roomTypeUpdateSchema } from '@hotel-bambu/shared';
import { Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Controller, useFieldArray, useForm, type FieldValues } from 'react-hook-form';
import { useToast } from '@/components/admin/feedback';
import {
  CheckboxField,
  FormAlert,
  FormSection,
  SelectField,
  TextAreaField,
  TextField,
} from '@/components/admin/fields';
import { useUnsavedChangesWarning } from '@/components/admin/hooks';
import { Button } from '@/components/admin/ui';
import { browserApi } from '@/lib/api/browser';
import { isApiError } from '@/lib/api/client';
import type { Amenity, RoomType } from '@/lib/api/types';
import { applyApiError } from '@/lib/forms/form-errors';
import { asNullableNumber, formResolver } from '@/lib/forms/resolver';
import { BED_TYPE_LABELS, PRICE_UNIT_LABELS, ROOM_TYPE_LABELS, toOptions } from '@/lib/labels';
import { RoomTypeImageList, toImageInput, type ImageRow } from './room-type-images';

const FIELD_NAMES = [
  'name',
  'slug',
  'type',
  'description',
  'capacity',
  'beds',
  'areaM2',
  'basePrice',
  'priceUnit',
  'taxesIncluded',
  'priceNotes',
  'amenityIds',
];

function toFormValues(room: RoomType | null): FieldValues {
  return {
    name: room?.name ?? '',
    slug: room?.slug ?? '',
    type: room?.type ?? 'COUPLE',
    description: room?.description ?? '',
    capacity: room?.capacity ?? 2,
    beds: room?.beds ?? [],
    areaM2: room?.areaM2 ?? null,
    basePrice: room?.basePrice ?? null,
    priceUnit: room?.priceUnit ?? 'PER_NIGHT',
    taxesIncluded: room?.taxesIncluded ?? true,
    priceNotes: room?.priceNotes ?? '',
    amenityIds: room?.amenityIds ?? [],
  };
}

type ErrorMap = Record<string, { message?: string } | undefined>;

export function RoomTypeForm({
  room,
  amenities: catalog,
}: {
  room: RoomType | null;
  amenities: Amenity[];
}) {
  // Only room equipment is assigned per room; hotel-wide amenities apply everywhere (ADR 0015).
  const amenities = catalog.filter((amenity) => amenity.scope === 'ROOM');
  const router = useRouter();
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  // Creation only: images chosen before the type exists, sent with the create call.
  const [newImages, setNewImages] = useState<ImageRow[]>([]);
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FieldValues, unknown, FieldValues>({
    resolver: formResolver(room ? roomTypeUpdateSchema : roomTypeCreateSchema) as never,
    defaultValues: toFormValues(room),
  });
  const beds = useFieldArray({ control, name: 'beds' });
  useUnsavedChangesWarning(isDirty || newImages.length > 0);
  const err = (name: string) => (errors as ErrorMap)[name];
  const bedError = (index: number, key: string) =>
    (errors.beds as unknown as Record<number, ErrorMap> | undefined)?.[index]?.[key];

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      if (room) {
        const saved = await browserApi.patch<RoomType>(`/admin/room-types/${room.id}`, values);
        reset(toFormValues(saved));
        toast.success('Tipo de habitación guardado.');
        router.refresh();
      } else {
        const created = await browserApi.post<RoomType>('/admin/room-types', {
          ...values,
          images: toImageInput(newImages),
        });
        reset(toFormValues(created));
        setNewImages([]);
        toast.success(
          newImages.length > 0
            ? 'Tipo de habitación creado como borrador con sus imágenes.'
            : 'Tipo de habitación creado como borrador. Ahora agregue sus imágenes.',
        );
        router.push(`/admin/room-types/${created.id}`);
      }
    } catch (error) {
      const { message } = applyApiError(error, setError, FIELD_NAMES);
      // `images` has no form field: surface its errors in the form alert.
      setFormError(
        isApiError(error) && error.details.some((d) => d.path.startsWith('images'))
          ? 'Revise las imágenes: alguna ya no existe en la biblioteca.'
          : message,
      );
    }
  });

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-6"
      aria-label="Datos del tipo de habitación"
    >
      <FormAlert message={formError} />
      <FormSection title="Información básica">
        <TextField label="Nombre" required error={err('name')} registration={register('name')} />
        <TextField
          label="Identificador en la URL (slug)"
          hint={
            room
              ? 'Si el tipo está publicado, el enlace anterior seguirá funcionando (redirección).'
              : 'Opcional: se genera a partir del nombre. Solo minúsculas, números y guiones.'
          }
          error={err('slug')}
          registration={register('slug', {
            setValueAs: (value: string) => (room ? value : value?.trim() ? value : undefined),
          })}
        />
        <SelectField
          label="Categoría"
          hint="Define la etiqueta pública y el filtro de «Habitaciones»."
          required
          options={toOptions(ROOM_TYPE_LABELS)}
          error={err('type')}
          registration={register('type')}
        />
        <TextField
          label="Capacidad máxima (personas)"
          type="number"
          inputMode="numeric"
          required
          error={err('capacity')}
          registration={register('capacity', { valueAsNumber: true })}
        />
        <TextAreaField
          className="md:col-span-2"
          label="Descripción"
          hint="Opcional. El primer párrafo se muestra en las tarjetas; sepárelos con una línea en blanco. Escriba solo datos reales."
          rows={6}
          error={err('description')}
          registration={register('description')}
        />
        <TextField
          label="Área (m²)"
          inputMode="decimal"
          hint="Opcional."
          error={err('areaM2')}
          registration={register('areaM2', { setValueAs: asNullableNumber })}
        />
      </FormSection>

      {room ? null : (
        <FormSection
          title="Imágenes"
          description="Opcional. Súbalas aquí o elíjalas de la galería; la portada es obligatoria para publicar."
        >
          <div className="md:col-span-2">
            <RoomTypeImageList
              rows={newImages}
              onChange={setNewImages}
              emptyText="Aún no hay imágenes. También puede agregarlas después de crear el tipo."
            />
          </div>
        </FormSection>
      )}

      <FormSection title="Camas">
        <div className="md:col-span-2">
          <ul className="flex flex-col gap-3">
            {beds.fields.map((row, index) => (
              <li key={row.id} className="grid items-end gap-3 sm:grid-cols-[1fr_8rem_auto]">
                <SelectField
                  label={`Tipo de cama ${index + 1}`}
                  options={BED_TYPES.map((value) => ({ value, label: BED_TYPE_LABELS[value] }))}
                  error={bedError(index, 'type')}
                  registration={register(`beds.${index}.type`)}
                />
                <TextField
                  label="Cantidad"
                  type="number"
                  inputMode="numeric"
                  error={bedError(index, 'count')}
                  registration={register(`beds.${index}.count`, { valueAsNumber: true })}
                />
                <Button
                  variant="ghost"
                  aria-label={`Quitar cama ${index + 1}`}
                  onClick={() => beds.remove(index)}
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
            onClick={() => beds.append({ type: 'DOUBLE', count: 1 })}
          >
            <Plus aria-hidden="true" className="size-4" /> Agregar cama
          </Button>
        </div>
      </FormSection>

      <FormSection
        id="tarifa"
        title="Tarifa informativa"
        description="Precio de referencia en pesos colombianos. Se muestra como «desde» con nota de confirmación por WhatsApp."
      >
        <TextField
          label="Tarifa (COP)"
          inputMode="numeric"
          hint="Solo números, sin puntos. Déjelo vacío si aún no se publica."
          error={err('basePrice')}
          registration={register('basePrice', { setValueAs: asNullableNumber })}
        />
        <SelectField
          label="Unidad"
          options={toOptions(PRICE_UNIT_LABELS)}
          error={err('priceUnit')}
          registration={register('priceUnit')}
        />
        <CheckboxField
          label="Impuestos incluidos"
          hint="Por defecto se publica el precio total con impuestos."
          registration={register('taxesIncluded')}
        />
        <TextAreaField
          className="md:col-span-2"
          label="Notas de tarifa"
          rows={2}
          error={err('priceNotes')}
          registration={register('priceNotes')}
        />
      </FormSection>

      <FormSection title="Comodidades incluidas">
        <Controller
          control={control}
          name="amenityIds"
          render={({ field }) => {
            const selected = new Set((field.value as string[]) ?? []);
            return (
              <fieldset className="md:col-span-2">
                <legend className="sr-only">Comodidades incluidas</legend>
                {amenities.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay comodidades de habitación. Créelas en «Comodidades» con el alcance
                    «Habitaciones».
                  </p>
                ) : null}
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {amenities.map((amenity) => (
                    <label key={amenity.id} className="flex min-h-6 items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="size-5 accent-(--primary)"
                        checked={selected.has(amenity.id)}
                        onChange={(event) => {
                          const next = new Set(selected);
                          if (event.target.checked) next.add(amenity.id);
                          else next.delete(amenity.id);
                          field.onChange([...next]);
                        }}
                      />
                      {amenity.name}
                      {!amenity.active ? (
                        <span className="text-muted-foreground"> (inactiva)</span>
                      ) : null}
                    </label>
                  ))}
                </div>
              </fieldset>
            );
          }}
        />
      </FormSection>

      <div className="sticky bottom-3 z-10 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white/95 px-4 py-3 shadow-md backdrop-blur-sm tab:px-5">
        <Button type="submit" loading={isSubmitting}>
          {room ? 'Guardar cambios' : 'Crear tipo de habitación'}
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
