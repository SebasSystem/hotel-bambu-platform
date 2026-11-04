import { describe, expect, it, vi } from 'vitest';
import { ApiError, createApiClient } from './client';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function setup(response: Response, overrides: Partial<Parameters<typeof createApiClient>[0]> = {}) {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(response);
  const client = createApiClient({
    baseUrl: 'http://api.test/api/v1',
    fetch: fetchMock,
    getCsrfToken: () => 'csrf-123',
    ...overrides,
  });
  const lastCall = () => {
    const [url, init] = fetchMock.mock.calls.at(-1) ?? [];
    return { url: String(url), init: init ?? {}, headers: new Headers(init?.headers) };
  };
  return { client, fetchMock, lastCall };
}

describe('createApiClient', () => {
  it('sends the CSRF header on unsafe methods only', async () => {
    const { client, lastCall } = setup(jsonResponse(200, { ok: true }));
    await client.get('/admin/faq');
    expect(lastCall().headers.has('x-csrf-token')).toBe(false);

    for (const method of ['post', 'put', 'patch', 'delete'] as const) {
      const ctx = setup(jsonResponse(200, {}));
      await ctx.client[method]('/admin/faq', { question: 'x' });
      expect(ctx.lastCall().headers.get('x-csrf-token')).toBe('csrf-123');
    }
  });

  it('serialises JSON bodies, builds query strings and never caches', async () => {
    const { client, lastCall } = setup(jsonResponse(200, { id: '1' }));
    const result = await client.post<{ id: string }>('/admin/faq', { question: '¿Hay wifi?' });
    expect(result).toEqual({ id: '1' });
    expect(lastCall().url).toBe('http://api.test/api/v1/admin/faq');
    expect(lastCall().init.method).toBe('POST');
    expect(lastCall().init.body).toBe(JSON.stringify({ question: '¿Hay wifi?' }));
    expect(lastCall().headers.get('content-type')).toBe('application/json');
    expect(lastCall().init.cache).toBe('no-store');

    const q = setup(jsonResponse(200, []));
    await q.client.get('/admin/media', { query: { page: 2, missingAlt: true, skip: undefined } });
    expect(q.lastCall().url).toBe('http://api.test/api/v1/admin/media?page=2&missingAlt=true');
  });

  it('sends FormData without forcing a content type', async () => {
    const { client, lastCall } = setup(jsonResponse(201, { id: 'm1' }));
    const form = new FormData();
    form.append('altText', 'Fachada');
    await client.post('/admin/media', form);
    expect(lastCall().init.body).toBe(form);
    expect(lastCall().headers.has('content-type')).toBe(false);
    expect(lastCall().headers.get('x-csrf-token')).toBe('csrf-123');
  });

  it('adds extra headers such as the forwarded cookie', async () => {
    const { client, lastCall } = setup(jsonResponse(200, {}), {
      headers: () => ({ cookie: 'hb_session=abc' }),
    });
    await client.get('/auth/me');
    expect(lastCall().headers.get('cookie')).toBe('hb_session=abc');
  });

  it('returns undefined for 204 responses', async () => {
    const { client } = setup(new Response(null, { status: 204 }));
    await expect(client.delete('/admin/faq/1')).resolves.toBeUndefined();
  });

  it('calls onUnauthorized and throws ApiError on 401', async () => {
    const onUnauthorized = vi.fn();
    const { client } = setup(
      jsonResponse(401, { statusCode: 401, error: 'Unauthorized', message: 'No session' }),
      { onUnauthorized },
    );
    const error = await client.get('/auth/me').catch((e: unknown) => e);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(401);
  });

  it('exposes status, message and validation details of error responses', async () => {
    const body = {
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation failed',
      details: [{ path: 'question', message: 'Too small', code: 'too_small' }],
      requestId: 'r1',
    };
    const { client } = setup(jsonResponse(400, body));
    const error = (await client.post('/admin/faq', {}).catch((e: unknown) => e)) as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
    expect(error.message).toBe('Validation failed');
    expect(error.details).toEqual(body.details);
    expect(error.body).toEqual(body);
  });

  it('tolerates non-JSON error bodies', async () => {
    const { client } = setup(new Response('Bad gateway', { status: 502 }));
    const error = (await client.get('/admin/faq').catch((e: unknown) => e)) as ApiError;
    expect(error.status).toBe(502);
    expect(error.details).toEqual([]);
  });

  it('omits the CSRF header when no token is available', async () => {
    const { client, lastCall } = setup(jsonResponse(200, {}), { getCsrfToken: () => null });
    await client.post('/auth/login', { email: 'a@b.co', password: 'x' });
    expect(lastCall().headers.has('x-csrf-token')).toBe(false);
  });
});
