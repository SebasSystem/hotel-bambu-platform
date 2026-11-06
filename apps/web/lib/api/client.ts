import { CSRF_HEADER_NAME } from '@hotel-bambu/shared';

/** One validation issue from a 400/422 response (`docs/api.md`, Conventions). */
export interface ApiErrorDetail {
  path: string;
  message: string;
  code: string;
}

/** Error body of every API response (`{ statusCode, error, message, details?, requestId }`). */
export interface ApiErrorBody {
  statusCode?: number;
  error?: string;
  message?: string;
  details?: ApiErrorDetail[];
  requestId?: string;
  [extra: string]: unknown;
}

export class ApiError extends Error {
  readonly status: number;
  readonly details: ApiErrorDetail[];
  readonly body: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message ?? `Request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
    this.details = Array.isArray(body.details) ? body.details : [];
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
}

export interface ApiClientOptions {
  /** Absolute or same-origin base, e.g. `/api/v1` or `http://api:4000/api/v1`. */
  baseUrl: string;
  fetch?: typeof fetch;
  /** CSRF token for unsafe methods (ADR 0008). Omitted when it returns null/undefined. */
  getCsrfToken?: () => string | null | undefined;
  /** Extra headers per request (server side: the forwarded `cookie`). */
  headers?: () => HeadersInit | Promise<HeadersInit>;
  /** Called on 401 before the error is thrown (e.g. redirect to the login page). */
  onUnauthorized?: () => void;
}

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function buildUrl(baseUrl: string, path: string, query?: Record<string, QueryValue>): string {
  const url = `${baseUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  const search = params.toString();
  return search ? `${url}?${search}` : url;
}

async function readErrorBody(response: Response): Promise<ApiErrorBody> {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === 'object') return body as ApiErrorBody;
  } catch {
    // Non-JSON body (proxy error page, empty body): fall through.
  }
  return { statusCode: response.status };
}

/**
 * Small typed client for the REST API. One implementation for the browser (same-origin
 * `/api/v1` rewrite, CSRF from the session) and the server (`API_INTERNAL_URL` + forwarded cookie).
 */
export function createApiClient(options: ApiClientOptions) {
  const doFetch = options.fetch ?? ((...args: Parameters<typeof fetch>) => fetch(...args));

  async function request<T>(
    method: string,
    path: string,
    body?: unknown,
    requestOptions: RequestOptions = {},
  ): Promise<T> {
    const headers = new Headers(options.headers ? await options.headers() : undefined);
    headers.set('accept', 'application/json');
    let payload: BodyInit | undefined;
    if (body instanceof FormData) {
      payload = body;
    } else if (body !== undefined) {
      payload = JSON.stringify(body);
      headers.set('content-type', 'application/json');
    }
    if (UNSAFE_METHODS.has(method)) {
      const token = options.getCsrfToken?.();
      if (token) headers.set(CSRF_HEADER_NAME, token);
    }

    const response = await doFetch(buildUrl(options.baseUrl, path, requestOptions.query), {
      method,
      headers,
      body: payload,
      cache: 'no-store',
      credentials: 'same-origin',
      signal: requestOptions.signal,
    });

    if (!response.ok) {
      const errorBody = await readErrorBody(response);
      if (response.status === 401) options.onUnauthorized?.();
      throw new ApiError(response.status, errorBody);
    }
    if (response.status === 204) return undefined as T;
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  return {
    request,
    get: <T>(path: string, requestOptions?: RequestOptions) =>
      request<T>('GET', path, undefined, requestOptions),
    post: <T>(path: string, body?: unknown, requestOptions?: RequestOptions) =>
      request<T>('POST', path, body, requestOptions),
    put: <T>(path: string, body?: unknown, requestOptions?: RequestOptions) =>
      request<T>('PUT', path, body, requestOptions),
    patch: <T>(path: string, body?: unknown, requestOptions?: RequestOptions) =>
      request<T>('PATCH', path, body, requestOptions),
    delete: <T = void>(path: string, body?: unknown, requestOptions?: RequestOptions) =>
      request<T>('DELETE', path, body, requestOptions),
  };
}
