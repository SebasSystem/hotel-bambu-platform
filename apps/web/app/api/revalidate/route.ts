import { revalidateTag } from 'next/cache';
import { handleRevalidate } from '@/lib/revalidate/handler';

// Never cached: every call must reach the handler.
export const dynamic = 'force-dynamic';

/**
 * On-demand revalidation (requirement 21, `docs/api.md`). Next.js 16 signature:
 * `revalidateTag(tag, profile)`; `{ expire: 0 }` expires the entry immediately so the next visit
 * renders fresh content (the single-argument form is deprecated).
 */
export function POST(request: Request): Promise<Response> {
  return handleRevalidate(request, {
    secret: process.env.REVALIDATE_SECRET,
    revalidate: (tag) => revalidateTag(tag, { expire: 0 }),
  });
}
