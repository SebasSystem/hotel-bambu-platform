import { describe, expect, it, vi } from 'vitest';
import { handleRevalidate, secretsMatch } from './handler';

const SECRET = 'x'.repeat(40);

function request(body: unknown, secret?: string, raw?: string) {
  const headers = new Headers({ 'content-type': 'application/json' });
  if (secret !== undefined) headers.set('x-revalidate-secret', secret);
  return new Request('http://localhost/api/revalidate', {
    method: 'POST',
    headers,
    body: raw ?? JSON.stringify(body),
  });
}

describe('secretsMatch', () => {
  it('compares in constant time, including different lengths', () => {
    expect(secretsMatch(SECRET, SECRET)).toBe(true);
    expect(secretsMatch('short', SECRET)).toBe(false);
    expect(secretsMatch(`${SECRET}y`, SECRET)).toBe(false);
  });
});

describe('handleRevalidate', () => {
  it('answers 401 without the secret header and revalidates nothing', async () => {
    const revalidate = vi.fn();
    const response = await handleRevalidate(request({ tags: ['site'] }), {
      secret: SECRET,
      revalidate,
    });
    expect(response.status).toBe(401);
    expect(revalidate).not.toHaveBeenCalled();
  });

  it('answers 401 with a wrong secret', async () => {
    const revalidate = vi.fn();
    const response = await handleRevalidate(request({ tags: ['site'] }, 'nope'), {
      secret: SECRET,
      revalidate,
    });
    expect(response.status).toBe(401);
    expect(revalidate).not.toHaveBeenCalled();
  });

  it('answers 503 when the server has no secret configured', async () => {
    const revalidate = vi.fn();
    const response = await handleRevalidate(request({ tags: ['site'] }, ''), {
      secret: undefined,
      revalidate,
    });
    expect(response.status).toBe(503);
    expect(revalidate).not.toHaveBeenCalled();
  });

  it('answers 400 for invalid JSON or an invalid body', async () => {
    const revalidate = vi.fn();
    const options = { secret: SECRET, revalidate };
    expect((await handleRevalidate(request(null, SECRET, '{oops'), options)).status).toBe(400);
    expect((await handleRevalidate(request({ tags: [] }, SECRET), options)).status).toBe(400);
    expect((await handleRevalidate(request({ tags: ['Bad Tag'] }, SECRET), options)).status).toBe(
      400,
    );
    expect(
      (await handleRevalidate(request({ tags: ['site'], extra: 1 }, SECRET), options)).status,
    ).toBe(400);
    expect(revalidate).not.toHaveBeenCalled();
  });

  it('revalidates every unique tag and answers 200', async () => {
    const revalidate = vi.fn();
    const response = await handleRevalidate(
      request({ tags: ['rooms', 'room:pareja-101', 'rooms'] }, SECRET),
      { secret: SECRET, revalidate },
    );
    expect(response.status).toBe(200);
    expect(revalidate.mock.calls.map(([tag]) => tag)).toEqual(['rooms', 'room:pareja-101']);
    expect(await response.json()).toMatchObject({ revalidated: ['rooms', 'room:pareja-101'] });
  });
});
