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
