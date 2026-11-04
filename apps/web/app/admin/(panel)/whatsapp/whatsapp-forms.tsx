'use client';

import {
  buildWhatsAppUrl,
  hotelProfileUpdateSchema,
  templateVariables,
  whatsAppPhoneSchema,
  whatsAppTemplateUpdateSchema,
} from '@hotel-bambu/shared';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm, useWatch, type FieldValues } from 'react-hook-form';
import { useToast } from '@/components/admin/feedback';
import { FormAlert, TextAreaField, TextField } from '@/components/admin/fields';
import { Badge, Button, Card } from '@/components/admin/ui';
import { browserApi } from '@/lib/api/browser';
import type { WhatsAppTemplate } from '@/lib/api/types';
import { applyApiError } from '@/lib/forms/form-errors';
import { formResolver } from '@/lib/forms/resolver';

/** Fills `{{variable}}` with a visible sample so the preview link can be tested. */
export function sampleMessage(body: string): string {
  return body.replace(/\{\{\s*([a-zA-Z_]+)\s*\}\}/g, (_, name: string) => `[${name}]`);
}

function previewUrl(number: string | null | undefined, message: string): string | null {
  const digits = (number ?? '').replace(/[\s+\-.()]/g, '');
  if (!whatsAppPhoneSchema.safeParse(digits).success) return null;
  return buildWhatsAppUrl(digits, message);
}

const numberSchema = hotelProfileUpdateSchema.pick({ whatsappNumber: true });

export function WhatsAppNumberForm({ number }: { number: string | null }) {
  const router = useRouter();
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FieldValues, unknown, FieldValues>({
    resolver: formResolver(numberSchema) as never,
    defaultValues: { whatsappNumber: number ?? '' },
  });
  const current = useWatch({ control, name: 'whatsappNumber' }) as string;
  const link = previewUrl(current, '');

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await browserApi.patch('/admin/hotel', values);
      reset({ whatsappNumber: values.whatsappNumber ?? '' });
      toast.success('Número de WhatsApp guardado.');
      router.refresh();
    } catch (error) {
      setFormError(applyApiError(error, setError, ['whatsappNumber']).message);
    }
  });

  return (
    <Card>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Número</h2>
        <FormAlert message={formError} />
        <TextField
          label="Número de WhatsApp"
          type="tel"
          inputMode="tel"
          placeholder="57 300 123 4567"
          hint="Con el indicativo del país (57 para Colombia). Se guardan solo los dígitos."
          error={errors.whatsappNumber as { message?: string } | undefined}
          registration={register('whatsappNumber')}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" loading={isSubmitting}>
            Guardar número
          </Button>
          {link ? (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary underline underline-offset-4"
            >
              Probar el enlace
            </a>
          ) : null}
        </div>
      </form>
    </Card>
  );
}

export function TemplateForm({
  template,
  number,
}: {
  template: WhatsAppTemplate;
  number: string | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FieldValues, unknown, FieldValues>({
    resolver: formResolver(whatsAppTemplateUpdateSchema) as never,
    defaultValues: { label: template.label, body: template.body },
  });
  const body = (useWatch({ control, name: 'body' }) as string) ?? '';
  const unknown = [...new Set(templateVariables(body))].filter(
    (v) => !template.allowedVariables.includes(v),
  );
  const link = previewUrl(number, sampleMessage(body));

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await browserApi.patch(`/admin/whatsapp-templates/${template.key}`, values);
      reset(values);
      toast.success('Plantilla guardada.');
      router.refresh();
    } catch (error) {
      setFormError(applyApiError(error, setError, ['label', 'body']).message);
    }
  });

  return (
    <Card>
      <form
        onSubmit={onSubmit}
        noValidate
        className="flex flex-col gap-4"
        aria-label={`Plantilla ${template.label}`}
      >
        <FormAlert message={formError} />
        <TextField
          label="Nombre de la plantilla"
          required
          error={errors.label as { message?: string } | undefined}
          registration={register('label')}
        />
        <TextAreaField
          label="Mensaje"
          required
          rows={4}
          hint="Puede usar las variables permitidas entre llaves dobles, por ejemplo {{roomName}}."
          error={errors.body as { message?: string } | undefined}
          registration={register('body')}
        />
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Variables permitidas:</span>
          {template.allowedVariables.length === 0 ? <span>ninguna</span> : null}
          {template.allowedVariables.map((variable) => (
            <Badge key={variable}>{`{{${variable}}}`}</Badge>
          ))}
        </div>
        {unknown.length > 0 ? (
          <p role="alert" className="text-sm font-semibold text-destructive">
            Variables no permitidas: {unknown.join(', ')}
          </p>
        ) : null}
        <div className="rounded-sm bg-muted p-3 text-sm">
          <p className="font-semibold">Vista previa</p>
          <p className="mt-1 whitespace-pre-line">{sampleMessage(body)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
            Guardar plantilla
          </Button>
          {link ? (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary underline underline-offset-4"
            >
              Probar en WhatsApp
            </a>
          ) : (
            <span className="text-sm text-muted-foreground">
              Configure el número para probar el enlace.
            </span>
          )}
        </div>
      </form>
    </Card>
  );
}
