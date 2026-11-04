# Configuration (environment variables)

All configuration comes from environment variables. In development a single root `.env` (copied from `.env.example`) is read by Docker Compose, the API, the scripts and Next.js; real environment variables always win. Production injects real variables (never a committed file). The API validates its variables at startup (`apps/api/src/config/env.ts`) and refuses to start when they are invalid.

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

## Docker Compose (development)

`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT`, `S3_PORT`, `S3_CONSOLE_PORT`, plus the `S3_*` keys above (see `docker-compose.yml`). Defaults are local-only placeholders.

## Web (consumed by apps/web)

| Variable | Notes |
|---|---|
| `API_INTERNAL_URL` | Where Next.js rewrites `/api/v1/*` and fetches server-side (e.g. `http://localhost:4000`). |
| `REVALIDATE_SECRET` | Same value as the API's; the `/api/revalidate` route handler must compare it in constant time. |

## Tests and CI

| Variable | Notes |
|---|---|
| `DATABASE_URL` | When set, API integration tests create and migrate a separate `hotel_test` database on the same server. |
| `CI` | `true` makes integration tests mandatory (fail instead of skip without a database). Turborepo passes `DATABASE_URL` and `CI` through to `test`. |
