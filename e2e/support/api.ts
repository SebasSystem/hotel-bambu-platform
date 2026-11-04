import { request as playwrightRequest, type APIRequestContext } from '@playwright/test';

export const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
export const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@example.test';
export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'Bambu-local-dev-2026!';

/**
 * Admin API session through the Next.js origin (same `/api/v1` rewrite the browser uses).
 * Playwright's request context sends no `Origin`, so the CSRF layer checks the token only.
 */
export interface AdminApi {
  context: APIRequestContext;
  csrf: string;
  get<T>(path: string): Promise<T>;
  send<T = unknown>(
    method: 'POST' | 'PATCH' | 'PUT' | 'DELETE',
    path: string,
    data?: unknown,
  ): Promise<T>;
  upload<T>(
    path: string,
    fields: Record<string, string>,
    file: { name: string; mimeType: string; buffer: Buffer },
  ): Promise<T>;
  dispose(): Promise<void>;
}

export async function adminApi(): Promise<AdminApi> {
  const context = await playwrightRequest.newContext({ baseURL: BASE_URL });
  const login = await context.post('/api/v1/auth/login', {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  if (!login.ok()) throw new Error(`Admin login failed: ${login.status()} ${await login.text()}`);
  const { csrfToken } = (await login.json()) as { csrfToken: string };

  const parse = async <T>(
    response: Awaited<ReturnType<APIRequestContext['get']>>,
    label: string,
  ) => {
    if (!response.ok())
      throw new Error(`${label} failed: ${response.status()} ${await response.text()}`);
    return (response.status() === 204 ? undefined : await response.json()) as T;
  };

  return {
    context,
    csrf: csrfToken,
    async get<T>(path: string) {
      return parse<T>(await context.get(`/api/v1${path}`), `GET ${path}`);
    },
    async send<T>(method: 'POST' | 'PATCH' | 'PUT' | 'DELETE', path: string, data?: unknown) {
      const response = await context.fetch(`/api/v1${path}`, {
        method,
        data,
        headers: { 'x-csrf-token': csrfToken },
      });
      return parse<T>(response, `${method} ${path}`);
    },
    async upload<T>(
      path: string,
      fields: Record<string, string>,
      file: { name: string; mimeType: string; buffer: Buffer },
    ) {
      // Fields must precede the file part (docs/api.md, Media).
      const response = await context.post(`/api/v1${path}`, {
        headers: { 'x-csrf-token': csrfToken },
        multipart: { ...fields, file },
      });
      return parse<T>(response, `POST ${path}`);
    },
    async dispose() {
      await context.post('/api/v1/auth/logout', { headers: { 'x-csrf-token': csrfToken } });
      await context.dispose();
    },
  };
}

/** Polls a public page until `check` passes: on-demand revalidation is asynchronous (ADR 0011). */
export async function eventually(
  check: () => Promise<boolean>,
  timeoutMs = 20_000,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await check()) return true;
    await new Promise((resolve) => setTimeout(resolve, 750));
  }
  return false;
}
