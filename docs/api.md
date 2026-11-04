# API reference (v1)

Base path `/api/v1`. JSON in and out. Input schemas live in `@hotel-bambu/shared` (`packages/shared/src/admin`, `auth`, `public`) and are strict: unknown properties → 400. Security design: [ADR 0008](adr/0008-auth-sessions-csrf.md). Variables: [configuration.md](configuration.md).

## Conventions

- **Errors** (all statuses): `{ statusCode, error, message, details?, requestId }`. `details` is `[{ path, message, code }]` for 400 (schema) and 422 (business rules, e.g. publication). Never a stack trace.
- **Statuses**: 400 invalid input, 401 no/expired session, 403 CSRF/origin rejected, 404, 409 conflict (unique slug, media in use, published room delete, duplicate upload → `mediaAssetId`), 413 too large, 422 rule violation, 429 rate limited, 503 storage not configured.
- **Caching**: `/public/*` GETs send `Cache-Control: public, max-age=60, stale-while-revalidate=300`; everything else `no-store`.
- **Ids**: UUIDv7 strings. Dates: ISO 8601 UTC. Money: whole COP integers (`basePrice`).
- **Media** in public responses: `{ id, altText, caption, width, height, blurDataUrl, dominantColor, variants: [{ width, height, format: 'avif'|'webp', url }] }` (variants sorted by width). Only `READY` assets with alt text are ever exposed.

## Auth and CSRF contract (for apps/web)

1. `POST /auth/login` `{ email, password }` → 200 `{ user, csrfToken, expiresAt }` + `Set-Cookie` session (`__Host-hb_session` in production, `hb_session` in dev; HttpOnly, SameSite=Lax, Path=/) and readable `hb_csrf`. Generic 401 on any failure; 429 when rate limited.
2. Browser calls go through the Next.js origin (`/api/v1/*` rewrite) so cookies are first-party. Server Components/Actions calling `API_INTERNAL_URL` directly must forward the incoming `cookie` header.
3. Every `POST/PUT/PATCH/DELETE` with a session must send `x-csrf-token: <csrfToken>` (from login, `GET /auth/me`, or the `hb_csrf` cookie). Browsers send `Origin`/`Sec-Fetch-Site` automatically; they must match `WEB_ORIGINS` / be same-origin, else 403.
4. `GET /auth/me` → `{ user, csrfToken, expiresAt }` or 401 (redirect to login).
5. `POST /auth/change-password` `{ currentPassword, newPassword }` → new session cookie + new `csrfToken` (all other sessions revoked). 422 with `details` on wrong current password or policy failure (12–128 chars, not one repeated char, not containing the email name, different from current).
6. `POST /auth/logout` → 204, cookies cleared, session deleted.

## Public (no session)

| Method | Path | Notes |
|---|---|---|
| GET | `/health` | `{ status, checks: { database } }`, 503 when down |
| GET | `/public/site` | `{ hotel{…, logo, hero}, socialLinks[], whatsappTemplates[{key, body, allowedVariables}], highlightedServices[], homeAmenities[], sections[] }` (enabled landing sections, ordered) |
| GET | `/public/rooms` | Published rooms: `{ slug, name, type, shortDescription, capacity, basePrice, currency, priceUnit, taxesIncluded, cover, amenities[{name, iconKey}] }` |
| GET | `/public/rooms/:slug` | Detail (+ `description, beds, areaM2, priceNotes, seoTitle, seoDescription, images[], promotions[], updatedAt`). Old slug of a published room → 200 `{ redirectTo: "<new-slug>" }` (web answers 301). Otherwise 404 |
| GET | `/public/amenities` | Active amenities |
| GET | `/public/services` | Active services (+ `highlighted`, `media`) |
| GET | `/public/gallery?category=` | Published items with publishable media `{ id, category, featured, media }` |
| GET | `/public/faq` | Published FAQ `{ id, question, answer, showOnHome }` |
| GET | `/public/policies` | Published policies |
| GET | `/public/promotions` | Published and in date (`startsAt <= now < endsAt`), hidden when tied to an unpublished room |
| POST | `/public/events` | `{ type: PAGE_VIEW|WHATSAPP_CLICK|ROOM_VIEW|MAP_CLICK|SOCIAL_CLICK, source?, entityId? }` → 204. Daily aggregate only. Send only with analytics consent |
| POST | `/public/consents` | `{ consentId, policyVersion, categories: { functional, analytics, marketing } }` → 204. No IP stored |

## Admin (session + CSRF)

| Resource | Endpoints |
|---|---|
| Dashboard | `GET /admin/dashboard`, `GET /admin/analytics/summary?days=30`, `GET /admin/audit-logs?page=&pageSize=` |
| Hotel | `GET`, `PATCH /admin/hotel` |
| WhatsApp | `GET /admin/whatsapp-templates`, `PATCH /admin/whatsapp-templates/:key` (`GENERAL`/`ROOM`/`PROMOTION`; only `allowedVariables` in `{{…}}`) |
| Rooms | `GET`, `POST /admin/rooms`; `PUT /admin/rooms/order` `{ ids }`; `GET`, `PATCH`, `DELETE /admin/rooms/:id`; `PATCH /admin/rooms/:id/status` `{ status }`; `PUT /admin/rooms/:id/images` `{ images: [{ mediaAssetId, isCover }] }` (full ordered set) |
| Amenities | `GET`, `POST /admin/amenities`; `PUT /admin/amenities/order`; `PATCH`, `DELETE /admin/amenities/:id` (409 while assigned to rooms) |
| Services | `GET`, `POST /admin/services`; `PUT /admin/services/order`; `PATCH`, `DELETE /admin/services/:id` |
| Promotions | `GET`, `POST /admin/promotions`; `PATCH`, `DELETE /admin/promotions/:id` |
| Media | `GET /admin/media?page=&pageSize=&missingAlt=true`; `GET /admin/media/:id`; `POST /admin/media` (multipart: fields `altText` (required), `caption`, `galleryCategory` **before** the `file` part); `PATCH /admin/media/:id` `{ altText, caption }`; `DELETE /admin/media/:id` (409 while used by a room/service/section/hotel) |
| Gallery | `GET`, `POST /admin/gallery`; `PUT /admin/gallery/order`; `PATCH`, `DELETE /admin/gallery/:id` (delete keeps the media) |
| Landing | `GET /admin/content`; `GET`, `PUT /admin/content/:key` (`HERO`, `ABOUT`, `ROOMS`, `SERVICES`, `GALLERY`, `LOCATION`, `FAQ`, `CONTACT`; partial body) |
| FAQ | `GET`, `POST /admin/faq`; `PUT /admin/faq/order`; `PATCH`, `DELETE /admin/faq/:id` |
| Policies | `GET`, `POST /admin/policies`; `PUT /admin/policies/order`; `PATCH`, `DELETE /admin/policies/:id` |
| Social links | `GET`, `POST /admin/social-links`; `PUT /admin/social-links/order`; `PATCH`, `DELETE /admin/social-links/:id` (https, host must match the platform) |

## Publication rules (requirement 10)

- Drafts/inactive/unpublished items never appear under `/public`.
- Publishing a room requires name, slug, short description, capacity ≥ 1 and a cover image that is `READY` with alt text (422 otherwise). A published room cannot be edited or re-imaged into an invalid state; it must be unpublished before deletion.
- Renaming the slug of a published room creates a `RoomSlugRedirect`; the old slug becomes reserved.
- Gallery items, section images and hotel logo/hero accept only `READY` media with alt text.
- Deleting media deletes its stored variants; failures are queued in `PendingStorageDeletion`.

## Revalidation (requirement 21)

After a committed admin mutation the API calls `POST ${WEB_INTERNAL_URL}/api/revalidate` with header `x-revalidate-secret` and body `{ tags: string[] }` (validate with `revalidateRequestSchema`). Tags (`CACHE_TAGS` / `roomCacheTag` in `@hotel-bambu/shared`): `site`, `rooms`, `room:<slug>`, `services`, `amenities`, `gallery`, `faq`, `policies`, `promotions`. Fire-and-forget: one retry after 1 s, then logged; the admin request never fails because of it.
