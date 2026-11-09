'use client';

import { changePasswordSchema, type ChangePasswordInput } from '@hotel-bambu/shared';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useToast } from '@/components/admin/feedback';
import { FormAlert, PasswordField } from '@/components/admin/fields';
import { Button, Card } from '@/components/admin/ui';
import { browserApi, setCsrfToken } from '@/lib/api/browser';
import type { SessionInfo } from '@/lib/api/types';
import { applyApiError } from '@/lib/forms/form-errors';
import { formResolver } from '@/lib/forms/resolver';

export function ChangePasswordForm() {
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: formResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      // The API rotates the session: new cookie + new CSRF token, other sessions revoked.
      const session = await browserApi.post<SessionInfo>('/auth/change-password', values);
      setCsrfToken(session.csrfToken);
      reset();
      toast.success('Contraseña actualizada. Las demás sesiones se cerraron.');
    } catch (error) {
      const result = applyApiError(error, setError, ['currentPassword', 'newPassword']);
      if (result.fieldErrors === 0) setFormError(result.message);
    }
  });

  return (
    <Card className="max-w-xl">
      <form
        onSubmit={onSubmit}
        noValidate
        className="flex flex-col gap-4"
        aria-labelledby="password-heading"
      >
        <h2 id="password-heading" className="text-lg">
          Cambiar contraseña
        </h2>
        <FormAlert message={formError} />
        <PasswordField
          label="Contraseña actual"
          autoComplete="current-password"
          required
          error={errors.currentPassword}
          registration={register('currentPassword')}
        />
        <PasswordField
          label="Nueva contraseña"
          autoComplete="new-password"
          required
          hint="Entre 12 y 128 caracteres. Use una frase larga; no repita un solo carácter ni incluya su correo."
          error={errors.newPassword}
          registration={register('newPassword')}
        />
        <div>
          <Button type="submit" loading={isSubmitting}>
            Cambiar contraseña
          </Button>
        </div>
      </form>
    </Card>
  );
}
