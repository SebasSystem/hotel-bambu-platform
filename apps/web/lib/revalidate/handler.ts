import { createHash, timingSafeEqual } from 'node:crypto';
import { REVALIDATE_SECRET_HEADER, revalidateRequestSchema } from '@hotel-bambu/shared';

/** Constant-time comparison; hashing first makes lengths equal so length is not leaked either. */
export function secretsMatch(received: string, expected: string): boolean {
  const a = createHash('sha256').update(received).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b) && received.length === expected.length;
}

export interface RevalidateOptions {
  /** `REVALIDATE_SECRET` (shared with the API). */
  secret: string | undefined;
  revalidate: (tag: string) => void;
}

const json = (status: number, body: unknown) => Response.json(body, { status });

/**
 * `POST /api/revalidate` (requirement 21): the API sends `{ tags }` with the shared secret after
 * each committed admin mutation. 401 bad/missing secret, 400 invalid body, 503 not configured.
 */
export async function handleRevalidate(
  request: Request,
  { secret, revalidate }: RevalidateOptions,
): Promise<Response> {
  if (!secret) return json(503, { error: 'Revalidation is not configured' });

  const received = request.headers.get(REVALIDATE_SECRET_HEADER) ?? '';
  if (!secretsMatch(received, secret)) return json(401, { error: 'Unauthorized' });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }
  const parsed = revalidateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return json(400, {
      error: 'Invalid body',
      details: parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  const tags = [...new Set(parsed.data.tags)];
  for (const tag of tags) revalidate(tag);
  return json(200, { revalidated: tags, now: Date.now() });
}
