'use client';

import { loginSchema, type LoginInput } from '@hotel-bambu/shared';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FormAlert, TextField } from '@/components/admin/fields';
import { Button } from '@/components/admin/ui';
import { anonymousBrowserApi, setCsrfToken } from '@/lib/api/browser';
import { isApiError } from '@/lib/api/client';
import type { SessionInfo } from '@/lib/api/types';
import { describeApiError } from '@/lib/forms/form-errors';
import { formResolver } from '@/lib/forms/resolver';

export function LoginForm({
  next,
  onAuthenticated,
}: {
  next: string;
  /** Test seam; defaults to a full navigation so the new cookie reaches the server. */
  onAuthenticated?: (next: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: formResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      const session = await anonymousBrowserApi.post<SessionInfo>('/auth/login', values);
      setCsrfToken(session.csrfToken);
      if (onAuthenticated) onAuthenticated(next);
      else window.location.assign(next);
    } catch (err) {
      // Generic message for any credential failure (no account enumeration, ADR 0008).
      setError(
        isApiError(err) && err.status === 401
          ? 'Correo o contraseña incorrectos.'
          : describeApiError(err),
      );
      setFocus('password');
    }
  });

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-4"
      aria-label="Iniciar sesión"
    >
      <FormAlert message={error} />
      <TextField
        label="Correo electrónico"
        type="email"
        autoComplete="username"
        inputMode="email"
        required
        error={errors.email}
        registration={register('email')}
      />
      <TextField
        label="Contraseña"
        type="password"
        autoComplete="current-password"
        required
        error={errors.password}
        registration={register('password')}
      />
      <Button type="submit" loading={isSubmitting} className="w-full">
        Ingresar
      </Button>
    </form>
  );
}
