import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { ApiError } from '@/lib/api/client';
import { applyApiError, describeApiError } from './form-errors';
import { spanishErrorMap, translateMessage } from './messages';

describe('applyApiError', () => {
  it('maps 400/422 details to known form fields and reports the rest', () => {
    const setError = vi.fn();
    const error = new ApiError(422, {
      message: 'Validation failed',
      details: [
        { path: 'currentPassword', message: 'Current password is incorrect.', code: 'custom' },
        { path: 'beds.0.count', message: 'Too big', code: 'too_big' },
        { path: 'unknownField', message: 'Nope', code: 'custom' },
      ],
    });

    const result = applyApiError(error, setError, ['currentPassword', 'beds']);

    expect(setError).toHaveBeenCalledWith(
      'currentPassword',
      { type: 'server', message: 'La contraseña actual no es correcta.' },
      { shouldFocus: true },
    );
    expect(setError).toHaveBeenCalledWith(
      'beds.0.count',
      { type: 'server', message: expect.any(String) },
      { shouldFocus: false },
    );
    expect(setError).toHaveBeenCalledTimes(2);
    expect(result.fieldErrors).toBe(2);
    expect(result.message).toContain('Nope');
  });

  it('returns a Spanish message for errors without details', () => {
    const setError = vi.fn();
    const result = applyApiError(
      new ApiError(409, { message: 'Slug is already in use.' }),
      setError,
      ['slug'],
    );
    expect(setError).not.toHaveBeenCalled();
    expect(result.fieldErrors).toBe(0);
    expect(result.message).toBe('Ese identificador (slug) ya está en uso.');
  });

  it('describes unknown failures without leaking internals', () => {
    expect(describeApiError(new Error('boom'))).toBe(
      'No se pudo completar la acción. Revise su conexión e intente de nuevo.',
    );
    expect(describeApiError(new ApiError(403, {}))).toMatch(/recargue la página/i);
    expect(describeApiError(new ApiError(429, {}))).toMatch(/demasiados intentos/i);
  });
});

describe('Spanish validation messages', () => {
  it('translates default Zod issues', () => {
    const schema = z.strictObject({
      name: z.string().trim().min(1).max(5),
      capacity: z.int().min(1),
      email: z.email(),
    });
    const result = schema.safeParse(
      { name: '', capacity: Number.NaN, email: 'x' },
      { error: spanishErrorMap },
    );
    const messages = Object.fromEntries(
      (result.error?.issues ?? []).map((issue) => [issue.path.join('.'), issue.message]),
    );
    expect(messages).toEqual({
      name: 'Este campo es obligatorio.',
      capacity: 'Ingrese un número válido.',
      email: 'Ingrese un correo electrónico válido.',
    });
  });

  it('translates known custom messages and keeps unknown ones', () => {
    expect(translateMessage('Use HH:MM (24h)')).toBe('Use el formato HH:MM (24 horas).');
    expect(translateMessage('Something else')).toBe('Something else');
  });
});

describe('describeApiError: permissions and admin users', () => {
  it('explains a 403 PERMISSION_DENIED in Spanish', () => {
    const error = new ApiError(403, {
      statusCode: 403,
      error: 'Forbidden',
      message: 'You do not have permission to perform this action.',
      code: 'PERMISSION_DENIED',
    });
    expect(describeApiError(error)).toBe('No tiene permiso para realizar esta acción.');
  });

  it('keeps the security message for a 403 without a code (CSRF/Origin)', () => {
    expect(describeApiError(new ApiError(403, { message: 'Invalid CSRF token' }))).toBe(
      'La solicitud fue rechazada por seguridad. Recargue la página e intente de nuevo.',
    );
  });

  it.each([
    ['SELF_ROLE_CHANGE', 422, 'No puede cambiar su propio rol.'],
    ['SELF_DEACTIVATION', 422, 'No puede desactivar su propia cuenta.'],
    ['ROLE_NOT_FOUND', 422, 'El rol elegido ya no existe. Recargue la página.'],
    ['SYSTEM_ROLE_IMMUTABLE', 422, 'El rol Administrador no se puede modificar ni eliminar.'],
    ['LAST_ADMINISTRATOR', 409, 'Debe quedar al menos un usuario activo con el rol Administrador.'],
    ['EMAIL_TAKEN', 409, 'Ya existe un usuario con ese correo.'],
    ['ROLE_NAME_TAKEN', 409, 'Ya existe un rol con ese nombre.'],
    ['ROLE_IN_USE', 409, 'El rol todavía tiene usuarios. Asígneles otro rol antes de eliminarlo.'],
  ])('translates %s', (code, status, expected) => {
    expect(describeApiError(new ApiError(status, { message: 'English text', code }))).toBe(
      expected,
    );
  });

  it('translates the password policy details', () => {
    const error = new ApiError(422, {
      message: 'Password does not meet the policy.',
      details: [
        {
          path: 'password',
          message: 'Password must have at least 12 characters.',
          code: 'too_short',
        },
        {
          path: 'password',
          message: 'Password must not contain the email name.',
          code: 'contains_email',
        },
      ],
    });
    expect(describeApiError(error)).toBe(
      'Use al menos 12 caracteres. La contraseña no puede contener el nombre del correo.',
    );
  });
});
