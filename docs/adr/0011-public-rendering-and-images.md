# 0011 — Public site rendering, caching and images

- Status: Accepted
- Date: 2026-11-04

## Context

The public site (requirements 4, 12.3, 15.4, 21) must show admin changes within seconds, answer a permanent redirect for renamed room slugs, and serve the media variants that the API already generated (AVIF/WebP, 640 and 960 px wide; almost every photo is a 960×1280 portrait). Production images are built without a running API (T8).

## Decision

1. **Render per request, cache the data.** Each public data loader (`apps/web/lib/public/api.ts`) calls `connection()` and then `fetch` with `next: { tags, revalidate }`. Pages render on demand. Their data comes from the Next.js Data Cache, tagged with the shared `CACHE_TAGS` and `roomCacheTag(slug)`.
   - The build does not need the API.
   - `permanentRedirect()` sends a real HTTP redirect for old slugs.
   - Rendering costs a few milliseconds per request and makes no API calls while the cache is warm.
2. **On-demand invalidation.** `POST /api/revalidate` compares `x-revalidate-secret` in constant time (SHA-256 + `timingSafeEqual`), validates the body with `revalidateRequestSchema`, and calls `revalidateTag(tag, { expire: 0 })`. This is the Next 16 two-argument form; `expire: 0` makes the next visit render fresh data. `revalidate` (1 h, promotions 60 s, room detail 5 min) only bounds staleness if a call is lost.
3. **Old slugs answer 308.** `permanentRedirect()` returns 308 Permanent Redirect, the method-preserving equivalent of 301 that search engines treat the same way. A literal 301 would need either an extra API lookup in `proxy.ts` on every room request or static redirects at build time, so we did not pursue it.
4. **Images: explicit `<picture>`, no runtime optimizer.** `components/site/picture.tsx` emits `<source type="image/avif">` and `<source type="image/webp">` with `srcset` built from the stored variants. It also sets intrinsic `width`/`height` against CLS, uses a blur + dominant-colour background as the placeholder, and applies `fetchpriority="high"` and eager loading only to the LCP image. `next/image` cannot express per-format sources from fixed variant URLs without a fake loader, and the variants already are the optimized files.
5. **Portrait art direction.** Mobile shows the hero full-bleed (portrait fits). Desktop uses a framed split hero (`object-position: 50% 40%`, about 0.9 aspect). Room cards are 4:5 and the gallery is 3:4. Nothing is stretched past 960 px of source.

## Consequences

- Admin edits show on the next request after the API's revalidation call. This was verified locally with a landing-section edit.
- Without `REVALIDATE_SECRET` the route answers 503 and content refreshes only when the TTL expires.
- On high-DPR desktop screens the hero is slightly soft (960 px source). Better photos fix this through content, not code.
