# 0006 — Data model, seeds and operational scripts

- Status: Accepted (amended by [0015](0015-amenities-and-hero-slides.md): `Service` removed, `Amenity.scope` HOTEL/ROOM, `HeroSlide`; and by [0016](0016-room-types-and-single-sources.md): `RoomType` level, `NearbyPlace`, no `Promotion`, `WhatsAppTemplate`, per-room SEO fields or `EDITOR` role, `LandingSection` reduced to enable/order)
- Date: 2026-11-04

## Context

Requirement 14 lists the initial entities; 12.6–12.7 ask for integrity in the database (unique, foreign keys, `CHECK`), 15.5 defines the seed/script split, 16.1 and 17.5 constrain credentials and consent evidence, and 19.4 asks for a model that can later grow translations. The owner confirmed (2026-11-04): 16 rooms of individual and couple types, all with private bathroom, TV, fan and Wi-Fi; hotel features solar panels, water reserve and internet on all floors; no laundry.

## Decision

**Schema** (`apps/api/prisma/schema.prisma`, migration `20261104213307_init`):

| Area | Models |
|---|---|
| Admin & security | `AdminUser` (lowercase unique email, Argon2id `passwordHash`, `role`, `active`, `failedAttempts`, `lockedUntil`, `lastLoginAt`, `passwordChangedAt`), `Session` (SHA-256 `tokenHash` only, absolute `expiresAt`, `lastSeenAt` for idle expiry, optional keyed `ipHash`/`userAgentHash`), `AuditLog` |
| Hotel | `HotelProfile` singleton (contact, location, check-in/out, optional `rntNumber` and `escnnaNotice`, logo/hero media), `WhatsAppTemplate` (enum key, `{{variable}}` whitelist), `SocialLink` |
| Rooms | `Room` (`slug`, `RoomType`, `PublicationStatus`, capacity, `beds` JSON, `basePrice`, `priceUnit`, `taxesIncluded`, SEO), `RoomSlugRedirect`, `RoomImage` (one cover), `Amenity` + `RoomAmenity`, `Promotion` |
| Hotel services | ~~`Service`~~ removed by ADR 0015: hotel-wide features are `Amenity` rows with scope `HOTEL`. |
| Media | `MediaAsset` (random `storageKey`, magic-byte `mimeType`, SHA-256 `checksum` unique, dimensions, `variants` JSON, `blurDataUrl`, `dominantColor`, `altText`, `status`), `GalleryItem`, `PendingStorageDeletion` |
| Content | `LandingSection` (enum key), `Faq`, `HotelPolicy` |
| Privacy & metrics | `ConsentRecord` (random `consentId`, categories, policy version, timestamp; no IP, no user agent), `AnalyticsDailyCount` (aggregates only) |

Conventions:

- **IDs**: UUIDv7 (`@default(uuid(7)) @db.Uuid`) — stable, non-sequential in URLs, index-friendly. `HotelProfile.id` is the integer `1` with `CHECK (id = 1)`.
- **Time**: every timestamp is `timestamptz(3)` (UTC); display in `America/Bogota`. Every editable entity has `createdAt`/`updatedAt`.
- **Money**: `Room.basePrice` is an **integer number of Colombian pesos** plus `currency CHAR(3) = 'COP'` (CHECK). Deviation from 14's `Decimal(12,2)`: COP is quoted without cents, integers avoid Decimal serialization in JSON and are never floats. Change to `Decimal` with a migration if another currency is ever needed. Null hides the price.
- **Status**: rooms and promotions use `PublicationStatus` (`DRAFT`/`PUBLISHED`/`INACTIVE`); simpler content uses `published`/`enabled`/`active` booleans.
- **Database rules** Prisma cannot express are appended as SQL in the migration: singleton, slug format, capacity 1–50, non-negative price, positive area, `endsAt > startsAt`, lowercase admin email, hex dominant colour, `HH:MM` check-in/out, lat/lng ranges, and a partial unique index for one cover per room. `prisma migrate diff` shows no drift with them.
- **Icons**: controlled catalog `ICON_KEYS` (Lucide names) in `@hotel-bambu/shared`, validated by the API; no icon table, no uploaded SVG (16.5).
- **i18n (19.4)**: content columns hold the default locale (Spanish) with neutral names (`name`, `description`, not `nameEs`). When English is added, each translatable entity gets a sibling table (`RoomTranslation(roomId, locale, name, shortDescription, ...)`, unique `(roomId, locale)`) with fallback to the base columns. No JSON-per-field translations: they cannot be constrained or indexed.

**Seeds and scripts** (`apps/api/src/scripts`, run with `tsx` in development or `node dist/scripts/*.js` from a build):

- `db:seed:base` — idempotent upserts with `update: {}` (never overwrites admin edits): `HotelProfile` with only the name (all unknown fields null, listed as `TODO(hotel)` in code and `docs/pendientes-hotel.md`), 8 landing sections, 3 WhatsApp templates from 5.2, 4 confirmed amenities, 3 confirmed services. Address/phone/RNT seen in photos are **not** seeded.
- `db:seed:demo` — refuses when `NODE_ENV` or `APP_ENV` is `production`/`prod`, before connecting. 16 `[DEMO]` rooms (alternating couple/individual, numbering illustrative, `basePrice` null), all four amenities each, `[DEMO]` FAQ and policies. Rooms start `DRAFT`.
- `media:import` — manifest-driven; skips `discard` entries and exact duplicates (checksum), uploads AVIF+WebP variants, links room photos to demo rooms least-loaded first and publishes demo rooms that got a cover (publication rule), everything else to the gallery (published only if quality `ok` and no people). Re-runs skip existing checksums.
- `admin:create` — env one-shot (`ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`) or interactive hidden prompt; `--reset-password` resets, unlocks and revokes sessions. Policy: 12–128 characters, not one repeated character, not containing the email name. Argon2id via `@node-rs/argon2` (prebuilt binaries, no native build; m=19 MiB, t=2, p=1, OWASP minimum).

`sharp` 0.35 and `@node-rs/argon2` load on the Windows dev machine (unlike Tailwind's oxide binary), so no container wrapper is needed; both also ship Linux musl/glibc binaries for the production image.

## Consequences

- New room types need an enum migration (intended: types are a controlled list).
- The image pipeline (`src/modules/media/image-pipeline.ts`, `media-storage.ts`, `object-storage.ts`) is pure/port-based and is reused by the admin upload endpoint (T4).
- `S3_ENDPOINT` (default `http://localhost:9000`) and `S3_FORCE_PATH_STYLE` (default `true`) are new optional variables; `S3_ACCESS_KEY`/`S3_SECRET_KEY` are required by `media:import`.
