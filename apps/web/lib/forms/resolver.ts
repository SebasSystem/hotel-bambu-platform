import { zodResolver } from '@hookform/resolvers/zod';
import type { FieldErrors, FieldValues, Resolver } from 'react-hook-form';
import type { z } from 'zod';
import { spanishErrorMap, translateMessage } from './messages';

function translateErrors(errors: unknown): void {
  if (!errors || typeof errors !== 'object') return;
  for (const value of Object.values(errors as Record<string, unknown>)) {
    if (!value || typeof value !== 'object') continue;
    const entry = value as { message?: unknown; ref?: unknown };
    if (typeof entry.message === 'string') entry.message = translateMessage(entry.message);
    // Nested objects/arrays (e.g. beds.0.count); skip DOM refs.
    for (const [key, nested] of Object.entries(entry)) {
      if (key !== 'ref' && nested && typeof nested === 'object') translateErrors({ nested });
    }
  }
}

/**
 * zodResolver with Spanish messages: default Zod issues use `spanishErrorMap`, custom English
 * messages from the shared schemas are translated afterwards. Submit handlers receive the parsed
 * schema output (transforms applied: `''` → `null`, dates coerced, etc.).
 */
export function formResolver<S extends z.ZodType>(
  schema: S,
): Resolver<z.input<S> & FieldValues, unknown, z.output<S> & FieldValues> {
  const base = zodResolver(schema as never, {
    error: spanishErrorMap as never,
  }) as unknown as Resolver<FieldValues, unknown, FieldValues>;
  const resolver: Resolver<FieldValues, unknown, FieldValues> = async (
    values,
    context,
    options,
  ) => {
    const result = await base(values, context, options);
    translateErrors(result.errors as FieldErrors);
    return result;
  };
  return resolver as unknown as Resolver<
    z.input<S> & FieldValues,
    unknown,
    z.output<S> & FieldValues
  >;
}

/** `setValueAs` helpers for inputs whose empty value means "no value". */
export const asNullableNumber = (value: unknown) =>
  value === '' || value === null || value === undefined ? null : Number(value);
export const asNullableString = (value: unknown) =>
  value === '' || value === undefined ? null : (value as string | null);
