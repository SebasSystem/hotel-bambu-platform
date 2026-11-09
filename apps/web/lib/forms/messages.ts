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
  // Password policy (API `PASSWORD_POLICY_MESSAGES`): admin users and change password.
  'Password does not meet the policy.': 'La contraseña no cumple la política.',
  'Password must have at least 12 characters.': 'Use al menos 12 caracteres.',
  'Password must have at most 128 characters.': 'Use como máximo 128 caracteres.',
  'Password must not be a single repeated character.':
    'La contraseña no puede ser un solo carácter repetido.',
  'Password must not contain the email name.':
    'La contraseña no puede contener el nombre del correo.',
  'New password must differ from the current one.':
    'La nueva contraseña debe ser distinta de la actual.',
};

/**
 * Spanish copy for the `code` some API errors carry (403 `PERMISSION_DENIED`, admin users and
 * roles `ADMIN_USER_ERRORS`). A code wins over the English message.
 */
const CODE_MESSAGES: Record<string, string> = {
  PERMISSION_DENIED: 'No tiene permiso para realizar esta acción.',
  SELF_ROLE_CHANGE: 'No puede cambiar su propio rol.',
  SELF_DEACTIVATION: 'No puede desactivar su propia cuenta.',
  ROLE_NOT_FOUND: 'El rol elegido ya no existe. Recargue la página.',
  SYSTEM_ROLE_IMMUTABLE: 'El rol Administrador no se puede modificar ni eliminar.',
  LAST_ADMINISTRATOR: 'Debe quedar al menos un usuario activo con el rol Administrador.',
  EMAIL_TAKEN: 'Ya existe un usuario con ese correo.',
  ROLE_NAME_TAKEN: 'Ya existe un rol con ese nombre.',
  ROLE_IN_USE: 'El rol todavía tiene usuarios. Asígneles otro rol antes de eliminarlo.',
};

export function translateCode(code: unknown): string | undefined {
  return typeof code === 'string' ? CODE_MESSAGES[code] : undefined;
}

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
