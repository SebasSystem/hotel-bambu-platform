import { isApiError } from '@/lib/api/client';
import { translateDetail, translateMessage } from './messages';

const STATUS_MESSAGES: Record<number, string> = {
  401: 'La sesión expiró. Inicie sesión de nuevo.',
  403: 'La solicitud fue rechazada por seguridad. Recargue la página e intente de nuevo.',
  404: 'El elemento ya no existe. Recargue la página.',
  409: 'La acción entra en conflicto con otros datos.',
  413: 'El archivo es demasiado grande.',
  422: 'La acción no cumple las reglas de publicación.',
  429: 'Demasiados intentos. Espere un momento e intente de nuevo.',
  503: 'El servicio no está disponible en este momento.',
};

const GENERIC = 'No se pudo completar la acción. Revise su conexión e intente de nuevo.';

/** Spanish, user-facing description of any thrown value (never internals). */
export function describeApiError(error: unknown): string {
  if (!isApiError(error)) return GENERIC;
  if (error.details.length > 0) {
    return [...new Set(error.details.map((detail) => translateDetail(detail)))].join(' ');
  }
  const raw = error.body.message;
  if (raw) {
    const translated = translateMessage(raw);
    if (translated !== raw) return translated;
  }
  return (
    STATUS_MESSAGES[error.status] ??
    (error.status >= 500 ? GENERIC : 'Revise los datos e intente de nuevo.')
  );
}

type SetError<TName extends string> = (
  name: TName,
  error: { type: string; message: string },
  options?: { shouldFocus: boolean },
) => void;

export interface AppliedApiError {
  /** Number of details attached to form fields. */
  fieldErrors: number;
  /** Message for a toast/alert: details that matched no field, or the general error. */
  message: string;
}

/**
 * Maps a 400/422 `details[]` response to react-hook-form fields (`path` like `beds.0.count`).
 * Only paths whose first segment is a known field are attached; the first one gets focus.
 */
export function applyApiError<TName extends string>(
  error: unknown,
  setError: SetError<TName>,
  fields: readonly NoInfer<TName>[],
): AppliedApiError {
  if (!isApiError(error) || error.details.length === 0) {
    return { fieldErrors: 0, message: describeApiError(error) };
  }
  const known = new Set<string>(fields);
  const leftovers: string[] = [];
  let fieldErrors = 0;
  for (const detail of error.details) {
    const root = detail.path.split('.')[0] ?? '';
    const message = translateDetail(detail);
    if (detail.path && known.has(root)) {
      // Nested paths (e.g. `beds.0.count`) are valid react-hook-form names too.
      setError(
        detail.path as TName,
        { type: 'server', message },
        { shouldFocus: fieldErrors === 0 },
      );
      fieldErrors += 1;
    } else {
      leftovers.push(message);
    }
  }
  const message = leftovers.length > 0 ? leftovers.join(' ') : 'Revise los campos marcados.';
  return { fieldErrors, message };
}
