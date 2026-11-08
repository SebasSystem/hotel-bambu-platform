'use client';

import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { Controller, useForm, useWatch, type FieldValues } from 'react-hook-form';
import type { z } from 'zod';
import { browserApi } from '@/lib/api/browser';
import { applyApiError } from '@/lib/forms/form-errors';
import { asNullableString, formResolver } from '@/lib/forms/resolver';
import { useConfirm, useToast } from './feedback';
import { CheckboxField, FormAlert, SelectField, TextAreaField, TextField } from './fields';
import { useAction, useUnsavedChangesWarning } from './hooks';
import { MediaField, type MediaPreview } from './media-picker';
import { ReorderButtons, moveItem } from './reorder-buttons';
import { Button, EmptyState, cx, panelClasses } from './ui';

export interface FieldConfig {
  name: string;
  label: string;
  hint?: string;
  kind: 'text' | 'textarea' | 'url' | 'checkbox' | 'select' | 'media' | 'custom';
  required?: boolean;
  rows?: number;
  options?: readonly { value: string; label: string }[];
  /** Select: empty option label; the empty value is sent as null. */
  emptyOption?: string;
  /** Full-width in the two-column grid. */
  wide?: boolean;
  /** Media: problems of the chosen image, shown under the preview (e.g. a small hero photo). */
  mediaWarnings?: (media: { width: number | null; height: number | null }) => string[];
  /** Custom: renders a controlled value (full width); `values` are the current form values. */
  render?: (control: {
    value: unknown;
    onChange: (value: unknown) => void;
    values: FieldValues;
    error?: string;
  }) => ReactNode;
}

export interface ResourceManagerProps<T extends { id: string }> {
  endpoint: string;
  items: T[];
  /** Singular noun for buttons and messages, e.g. "pregunta". */
  noun: string;
  createSchema: z.ZodType;
  updateSchema: z.ZodType;
  fields: readonly FieldConfig[];
  emptyValues: FieldValues;
  toFormValues: (item: T) => FieldValues;
  itemLabel: (item: T) => string;
  renderSummary: (item: T) => ReactNode;
  /** Boolean fields toggled from the list (PATCH { [name]: !value }). */
  toggles?: readonly { name: keyof T & string; on: string; off: string }[];
  reorderable?: boolean;
  /** Preview data for media fields of an item. */
  mediaPreview?: (item: T | null, field: string) => MediaPreview | null;
  deleteDescription?: string;
  /** Extra inline controls before the toggles (e.g. a publish switch). */
  renderActions?: (item: T) => ReactNode;
  /** Label of the add button; defaults to "Agregar <noun>". */
  addLabel?: string;
  /** Text when the list is empty. */
  emptyText?: string;
}

/**
 * Generic list + inline form for simple admin resources (FAQ, policies, social links, amenities,
 * rooms, nearby places). Validation reuses the shared Zod schemas; the API stays the authority.
 */
export function ResourceManager<T extends { id: string }>(props: ResourceManagerProps<T>) {
  const { items, noun, endpoint, reorderable, toggles = [] } = props;
  const [editing, setEditing] = useState<T | 'new' | null>(null);
  const { run, busy } = useAction();
  const confirm = useConfirm();

  const move = (from: number, to: number) => {
    const ids = moveItem(items, from, to).map((item) => item.id);
    void run('order', () => browserApi.put(`${endpoint}/order`, { ids }), 'Orden actualizado.');
  };

  const remove = async (item: T) => {
    const ok = await confirm({
      title: `¿Eliminar ${noun}?`,
      description:
        props.deleteDescription ?? `«${props.itemLabel(item)}» se eliminará definitivamente.`,
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (!ok) return;
    await run(`delete:${item.id}`, () => browserApi.delete(`${endpoint}/${item.id}`), 'Eliminado.');
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button onClick={() => setEditing('new')} disabled={editing === 'new'}>
          <Plus aria-hidden="true" className="size-4" /> {props.addLabel ?? `Agregar ${noun}`}
        </Button>
      </div>

      {editing === 'new' ? (
        <div className={cx(panelClasses, 'p-5 tab:p-6')}>
          <ResourceForm {...props} item={null} onDone={() => setEditing(null)} />
        </div>
      ) : null}

      {items.length === 0 ? (
        <EmptyState>{props.emptyText ?? 'Todavía no hay elementos.'}</EmptyState>
      ) : null}

      <ul className="flex flex-col gap-2.5">
        {items.map((item, index) => (
          <li key={item.id} className={cx(panelClasses, 'p-4 tab:px-5')}>
            {editing !== 'new' && editing?.id === item.id ? (
              <ResourceForm {...props} item={item} onDone={() => setEditing(null)} />
            ) : (
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">{props.renderSummary(item)}</div>
                <div className="flex flex-wrap items-center gap-2">
                  {props.renderActions?.(item)}
                  {toggles.map((toggle) => {
                    const value = Boolean(item[toggle.name]);
                    return (
                      <Button
                        key={toggle.name}
                        variant="secondary"
                        size="sm"
                        aria-pressed={value}
                        loading={busy === `${toggle.name}:${item.id}`}
                        onClick={() =>
                          void run(
                            `${toggle.name}:${item.id}`,
                            () =>
                              browserApi.patch(`${endpoint}/${item.id}`, { [toggle.name]: !value }),
                            'Cambios guardados.',
                          )
                        }
                      >
                        {value ? toggle.on : toggle.off}
                      </Button>
                    );
                  })}
                  {reorderable ? (
                    <ReorderButtons
                      index={index}
                      count={items.length}
                      label={props.itemLabel(item)}
                      onMove={move}
                      disabled={busy !== null}
                    />
                  ) : null}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditing(item)}
                    aria-label={`Editar ${props.itemLabel(item)}`}
                  >
                    <Pencil aria-hidden="true" className="size-4" /> Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void remove(item)}
                    loading={busy === `delete:${item.id}`}
                    aria-label={`Eliminar ${props.itemLabel(item)}`}
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResourceForm<T extends { id: string }>({
  item,
  onDone,
  endpoint,
  noun,
  createSchema,
  updateSchema,
  fields,
  emptyValues,
  toFormValues,
  mediaPreview,
}: ResourceManagerProps<T> & { item: T | null; onDone: () => void }) {
  const toast = useToast();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<string, MediaPreview | null>>({});
  const form = useForm<FieldValues, unknown, FieldValues>({
    resolver: formResolver(item ? updateSchema : createSchema) as never,
    defaultValues: item ? toFormValues(item) : emptyValues,
  });
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = form;
  useUnsavedChangesWarning(isDirty);
  // Custom fields may depend on other fields (e.g. room amenities on the chosen type).
  const watchedValues = useWatch({ control });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      if (item) await browserApi.patch(`${endpoint}/${item.id}`, values);
      else await browserApi.post(endpoint, values);
    } catch (error) {
      const result = applyApiError(
        error,
        setError,
        fields.map((f) => f.name),
      );
      setFormError(result.message);
      return;
    }
    toast.success(item ? 'Cambios guardados.' : `Se agregó ${noun}.`);
    router.refresh();
    onDone();
  });

  const errorOf = (name: string) => errors[name] as { message?: string } | undefined;

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-4"
      aria-label={item ? `Editar ${noun}` : `Nuevo: ${noun}`}
    >
      <FormAlert message={formError} />
      <div className="grid gap-5 md:grid-cols-2">
        {fields.map((field) => {
          const wide = field.wide || field.kind === 'textarea' ? 'md:col-span-2' : undefined;
          switch (field.kind) {
            case 'custom':
              return (
                <div key={field.name} className="md:col-span-2">
                  <Controller
                    control={control}
                    name={field.name}
                    render={({ field: controlled, fieldState }) => (
                      <>
                        {field.render?.({
                          value: controlled.value,
                          onChange: controlled.onChange,
                          values: watchedValues,
                          error: fieldState.error?.message,
                        })}
                      </>
                    )}
                  />
                </div>
              );
            case 'textarea':
              return (
                <TextAreaField
                  key={field.name}
                  className={wide}
                  label={field.label}
                  hint={field.hint}
                  required={field.required}
                  rows={field.rows}
                  error={errorOf(field.name)}
                  registration={register(field.name)}
                />
              );
            case 'checkbox':
              return (
                <CheckboxField
                  key={field.name}
                  label={field.label}
                  hint={field.hint}
                  error={errorOf(field.name)}
                  registration={register(field.name)}
                />
              );
            case 'select':
              return (
                <SelectField
                  key={field.name}
                  className={wide}
                  label={field.label}
                  hint={field.hint}
                  required={field.required}
                  options={field.options ?? []}
                  placeholder={field.emptyOption}
                  error={errorOf(field.name)}
                  registration={register(
                    field.name,
                    field.emptyOption !== undefined ? { setValueAs: asNullableString } : undefined,
                  )}
                />
              );
            case 'media':
              return (
                <div key={field.name} className="md:col-span-2">
                  <Controller
                    control={control}
                    name={field.name}
                    render={({ field: controlled, fieldState }) => (
                      <MediaField
                        label={field.label}
                        hint={field.hint}
                        value={controlled.value as string | null}
                        preview={
                          field.name in previews
                            ? previews[field.name]
                            : (mediaPreview?.(item, field.name) ?? null)
                        }
                        error={fieldState.error?.message}
                        warnings={field.mediaWarnings}
                        onChange={(id, media) => {
                          controlled.onChange(id);
                          setPreviews((p) => ({
                            ...p,
                            [field.name]: media
                              ? {
                                  variants: media.variants,
                                  altText: media.altText,
                                  width: media.width,
                                  height: media.height,
                                }
                              : null,
                          }));
                        }}
                      />
                    )}
                  />
                </div>
              );
            default:
              return (
                <TextField
                  key={field.name}
                  className={wide}
                  label={field.label}
                  hint={field.hint}
                  required={field.required}
                  type={field.kind === 'url' ? 'url' : 'text'}
                  inputMode={field.kind === 'url' ? 'url' : undefined}
                  error={errorOf(field.name)}
                  registration={register(field.name)}
                />
              );
          }
        })}
      </div>
      <div className="flex flex-wrap gap-2 border-t border-line pt-4">
        <Button type="submit" loading={isSubmitting}>
          {item ? 'Guardar cambios' : 'Agregar'}
        </Button>
        <Button variant="secondary" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
