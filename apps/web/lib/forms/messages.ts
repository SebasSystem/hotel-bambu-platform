import type { z } from 'zod';

/**
 * Spanish copy for validation messages. The shared schemas (and the API) speak English; the
 * admin panel shows Spanish. Default Zod issues go through `spanishErrorMap`; custom messages
 * written inside the shared schemas or returned by the API go through `translateMessage`.
 */
const KNOWN_MESSAGES: Record<string, string> = {
  'Use HH:MM (24h)': 'Use el formato HH:MM (24 horas).',
  'URL host does not match the platform': 'La URL no corresponde a la red social elegida.',
  'endsAt must be after startsAt': 'La fecha de fin debe ser posterior a la de inicio.',
  'Only one cover image': 'Solo puede haber una imagen principal.',
  'Images must be unique': 'Cada imagen solo puede agregarse una vez.',
  'Ids must be unique': 'El orden contiene elementos repetidos.',
  'WhatsApp phone must be 8–15 digits with country code, no symbols':
    'Use entre 8 y 15 dígitos con el indicativo del país (por ejemplo 573001234567).',
  'Current password is incorrect.': 'La contraseña actual no es correcta.',
  'Slug is already in use.': 'Ese identificador (slug) ya está en uso.',
  'Media is not READY or has no alt text.':
    'La imagen debe estar procesada y tener texto alternativo.',
  'Invalid email or password.': 'Correo o contraseña incorrectos.',
  'This image was already uploaded.': 'Esta imagen ya estaba en la biblioteca.',
  'A record with the same unique value already exists.': 'Ya existe un registro con ese valor.',
  'Validation failed': 'Revise los campos marcados.',
  'Name is required.': 'El nombre es obligatorio.',
  'Slug is required.': 'El identificador (slug) es obligatorio.',
  'Short description is required.': 'La descripción corta es obligatoria.',
  'Capacity must be at least 1.': 'La capacidad debe ser al menos 1.',
  'A processed cover image with alternative text is required.':
    'Se necesita una imagen principal procesada y con texto alternativo.',
};

export function translateMessage(message: string): string {
  return KNOWN_MESSAGES[message] ?? message;
}

type Issue = Parameters<z.core.$ZodErrorMap>[0];

function sizeLimit(issue: Issue, kind: 'min' | 'max'): string | undefined {
  const raw =
    kind === 'min'
      ? (issue as { minimum?: unknown }).minimum
      : (issue as { maximum?: unknown }).maximum;
  const limit = Number(raw);
  const origin = (issue as { origin?: string }).origin;
  if (origin === 'string') {
    if (kind === 'min')
      return limit <= 1 ? 'Este campo es obligatorio.' : `Use al menos ${limit} caracteres.`;
    return `Use como máximo ${limit} caracteres.`;
  }
  if (origin === 'number' || origin === 'int') {
    return kind === 'min' ? `El valor mínimo es ${limit}.` : `El valor máximo es ${limit}.`;
  }
  if (origin === 'array' || origin === 'set') {
    return kind === 'min' ? `Agregue al menos ${limit}.` : `Agregue como máximo ${limit}.`;
  }
  if (origin === 'date')
    return kind === 'min' ? 'La fecha es demasiado temprana.' : 'La fecha es demasiado tardía.';
  return undefined;
}

/** Per-parse Zod error map (lower priority than messages written in the schema). */
export const spanishErrorMap: z.core.$ZodErrorMap = (issue) => {
  switch (issue.code) {
    case 'too_small':
      return sizeLimit(issue, 'min');
    case 'too_big':
      return sizeLimit(issue, 'max');
    case 'invalid_type': {
      if (issue.input === undefined || issue.input === null || issue.input === '') {
        return 'Este campo es obligatorio.';
      }
      if (issue.expected === 'number' || issue.expected === 'int')
        return 'Ingrese un número válido.';
      if (issue.expected === 'date') return 'Ingrese una fecha válida.';
      return 'Valor no válido.';
    }
    case 'invalid_format': {
      const format = (issue as { format?: string }).format;
      if (format === 'email') return 'Ingrese un correo electrónico válido.';
      if (format === 'url') return 'Ingrese una URL válida que empiece por https://';
      if (format === 'uuid') return 'Seleccione un elemento válido.';
      if (format === 'regex') return 'El formato no es válido.';
      return 'El formato no es válido.';
    }
    case 'invalid_value':
      return 'Seleccione una opción válida.';
    case 'not_multiple_of':
      return 'Ingrese un número entero.';
    case 'unrecognized_keys':
      return 'El formulario envió campos no permitidos.';
    case 'invalid_union':
      return 'Revise este valor.';
    default:
      return undefined;
  }
};

/** Spanish text for an API `details[]` entry (codes come from Zod on the server). */
export function translateDetail(detail: { message: string; code: string }): string {
  const known = KNOWN_MESSAGES[detail.message];
  if (known) return known;
  switch (detail.code) {
    case 'too_small':
      return /expected string/i.test(detail.message) && />=1\b/.test(detail.message)
        ? 'Este campo es obligatorio.'
        : 'El valor es demasiado corto o pequeño.';
    case 'too_big':
      return 'El valor es demasiado largo o grande.';
    case 'invalid_type':
      return 'Este campo es obligatorio o tiene un tipo no válido.';
    case 'invalid_format':
      return 'El formato no es válido.';
    case 'invalid_value':
      return 'Seleccione una opción válida.';
    default:
      return detail.message;
  }
}
