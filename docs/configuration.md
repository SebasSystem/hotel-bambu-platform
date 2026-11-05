# Configuration (environment variables)

All configuration comes from environment variables. In development a single root `.env` (copied from `.env.example`) is read by Docker Compose, the API, the scripts and Next.js; real environment variables always win. Production injects real variables (never a committed file). On the VPS, they come from `deploy/.env.production`, created from [deploy/env.production.example](../deploy/env.production.example) (see [deploy/README.md](../deploy/README.md)). The API validates its variables at startup (`apps/api/src/config/env.ts`) and refuses to start when they are invalid.

## API — core

| Variable | Default | Notes |
|---|---|---|
| `NODE_ENV` | `development` | `development`, `test` or `production`. Production enforces the secrets below and Secure cookies. |
| `API_HOST` | `0.0.0.0` | Listen address. |
| `API_PORT` | `4000` | Listen port. |
| `LOG_LEVEL` | `info` | `fatal`…`trace`. JSON logs outside development; cookies, CSRF and revalidation headers are redacted. |
| `DATABASE_URL` | — (required) | `postgresql://user:pass@host:5432/db?schema=public`. |

## API — HTTP, proxies and limits

| Variable | Default | Notes |
|---|---|---|
| `TRUST_PROXY` | `false` | Fastify `trustProxy`: `false` (API exposed directly), `true` (trust all hops — only behind a proxy that overwrites `X-Forwarded-For`), a hop count (`1` for one reverse proxy) or a comma list of proxy IPs/CIDRs. Determines the client IP used by rate limits. |
| `TRUST_CLOUDFLARE` | `false` | `true` reads the client IP from `CF-Connecting-IP`. Enable **only** when the origin accepts traffic exclusively from Cloudflare (firewall / Authenticated Origin Pulls); otherwise clients can spoof the header. |
| `WEB_ORIGINS` | `http://localhost:3000` | Comma list of browser origins allowed to send unsafe requests (CSRF Origin check). Production: the public site origin(s), e.g. `https://www.example.com,https://example.com`. |
| `BODY_LIMIT_BYTES` | `1048576` | Max JSON body (1 MiB). |
| `UPLOAD_MAX_BYTES` | `15728640` | Max uploaded image (15 MiB). |
| `RATE_LIMIT_DEFAULT_PER_MINUTE` | `300` | Per IP, every route. |
| `RATE_LIMIT_LOGIN_PER_MINUTE` | `10` | Per IP on `POST /auth/login` (plus 10 / 15 min per IP+account and account lockout). |
| `RATE_LIMIT_PUBLIC_WRITE_PER_MINUTE` | `60` | Per IP on `POST /public/events` and `/public/consents`. |
| `RATE_LIMIT_UPLOAD_PER_MINUTE` | `30` | Per IP on `POST /admin/media`. |

## API — sessions and login

| Variable | Default | Notes |
|---|---|---|
| `SESSION_SECRET` | dev-only placeholder | **Required in production**, ≥ 32 random characters (`openssl rand -base64 48`). Keys the CSRF HMAC and session metadata hashes. Rotating it invalidates CSRF tokens (admins log in again). |
| `SESSION_IDLE_MINUTES` | `120` | Idle expiry. |
| `SESSION_ABSOLUTE_HOURS` | `12` | Absolute expiry (also the cookie `Max-Age`). |
| `COOKIE_SECURE` | `true` in production, else `false` | Secure cookies use the `__Host-hb_session` name. Set `true` locally only when serving over https. |
| `LOGIN_MAX_ATTEMPTS` | `5` | Consecutive failures before the account locks. |
| `LOGIN_LOCK_MINUTES` | `15` | Lock duration. |

## API — object storage (S3-compatible, ADR 0005)

| Variable | Default | Notes |
|---|---|---|
| `S3_ENDPOINT` | `http://localhost:9000` | RustFS in development; any S3 provider in production. |
| `S3_REGION` | `us-east-1` | |
| `S3_BUCKET` | `hotel-media` | |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` | — | Required for uploads, deletes and `media:import`. Without them the API starts but uploads answer 503. |
| `S3_FORCE_PATH_STYLE` | `true` | Path-style URLs (RustFS/MinIO). |
| `S3_PUBLIC_URL` | `http://localhost:9000/hotel-media` | Public base URL of the bucket or CDN; variant URLs are `${S3_PUBLIC_URL}/<key>`. |

## API — Next.js revalidation (requirement 21)

| Variable | Default | Notes |
|---|---|---|
| `WEB_INTERNAL_URL` | unset (disabled) | Internal URL of the Next.js server, e.g. `http://web:3000`. The API calls `POST ${WEB_INTERNAL_URL}/api/revalidate` after admin mutations. |
| `REVALIDATE_SECRET` | — | ≥ 32 characters, shared with the web, sent as `x-revalidate-secret`. Required in production when `WEB_INTERNAL_URL` is set. |

## Scripts

| Variable | Used by | Notes |
|---|---|---|
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | `admin:create` | One-shot creation; clear them from the shell history afterwards. |
| `APP_ENV` | `db:seed:demo` | `production`/`prod` blocks demo seeding (as does `NODE_ENV=production`). |
| `MEDIA_SOURCE_DIR`, `MEDIA_MANIFEST` | `media:import` | Override the photo folder and manifest path. |

## Docker Compose (production, `docker-compose.prod.yml`)

| Variable | Notes |
|---|---|
| `COMPOSE_PROFILES` | `caddy` (primary ingress) or `tunnel` (alternative), plus `backup`; add `storage` only for self-hosted RustFS instead of R2. |
| `SITE_HOST` / `SITE_REDIRECT_HOST` | Canonical host served by Caddy and the host redirected to it. |
| `ORIGIN_CERT_DIR` | Host folder with the Cloudflare Origin CA `origin.pem` + `origin.key`. |
| `MEDIA_HOST` | Media hostname served by Caddy (self-hosted storage only). |
| `TUNNEL_TOKEN` | Cloudflare Tunnel token (`tunnel` profile). |
| `BACKUP_HOST_DIR`, `BACKUP_HOUR`, `BACKUP_RETENTION_DAYS` | Local dump folder, daily hour (`TZ`) and retention. |
| `BACKUP_S3_URI`, `BACKUP_S3_ENDPOINT`, `BACKUP_S3_REGION`, `BACKUP_S3_ACCESS_KEY`, `BACKUP_S3_SECRET_KEY` | Optional off-site copy of every dump (private bucket). |
| `BACKUP_MEDIA` | `true` mirrors the media bucket into the backup folder. |
| `IMAGE_TAG` | Tag of the locally built images (default `latest`). |

The API's `DATABASE_URL` is built from `POSTGRES_USER`, `POSTGRES_PASSWORD` and `POSTGRES_DB`. Use a hex-only password. `API_INTERNAL_URL` (`http://api:4000`) and `WEB_INTERNAL_URL` (`http://web:3000`) are fixed by the compose file.

## Docker Compose (development)

`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT`, `S3_PORT`, `S3_CONSOLE_PORT`, plus the `S3_*` keys above (see `docker-compose.yml`). Defaults are local-only placeholders.

## Web (consumed by apps/web)

| Variable | Notes |
|---|---|
| `API_INTERNAL_URL` | Where Next.js rewrites `/api/v1/*` and fetches server-side (e.g. `http://localhost:4000`). |
| `REVALIDATE_SECRET` | Same value as the API's. `POST /api/revalidate` compares it in constant time; 401 wrong/missing, 400 invalid body, 503 when unset (content then refreshes only by TTL). See [ADR 0011](adr/0011-public-rendering-and-images.md). |
| `SITE_URL` | Public origin, e.g. `https://www.example.com` (default `http://localhost:3000`). Used for canonical URLs, Open Graph, `sitemap.xml` and JSON-LD. An `https://` value also adds `upgrade-insecure-requests` to the CSP. |
| `SITE_INDEXABLE` | `true` lets search engines index the site. Any other value (default) answers `noindex` on every page and `Disallow: /` in `robots.txt`. **Set `true` only in production**; staging stays unset. |
| `S3_PUBLIC_URL` | Same value as the API's. Its origin is the only external image source allowed by the CSP (`img-src`). |
| `LEGAL_APPROVED` | `true` once the hotel and its lawyer approved the legal texts. Until then `/legal/*` shows a draft banner, stays `noindex` and is left out of the sitemap ([legal-checklist.md](legal-checklist.md)). |
| `LEGAL_EFFECTIVE_DATE` | `YYYY-MM-DD` effective date printed in the legal documents. |

These flags are read per request, so changing them needs a restart, not a rebuild. `NODE_ENV=production` (every `next build`/`next start`) adds HSTS; see [security.md](security.md).

## End-to-end and Lighthouse (`pnpm e2e`, `pnpm lighthouse`)

| Variable | Default | Notes |
|---|---|---|
| `E2E_BASE_URL` | `http://localhost:3000` | Web origin under test (production build, `WEB_COMMAND=start`). |
| `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` | local dev admin | Admin used by setup and the FAQ test. Tests restore every change they make. |

## Tests and CI

| Variable | Notes |
|---|---|
| `DATABASE_URL` | When set, API integration tests create and migrate a separate `hotel_test` database on the same server. |
| `CI` | `true` makes integration tests mandatory (fail instead of skip without a database). Turborepo passes `DATABASE_URL` and `CI` through to `test`. |
