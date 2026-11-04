# Hotel Bambú Plaza — Platform

Public website and admin panel for Hotel Bambú Plaza (Colombia).

Source of truth: [docs/requirements.md](docs/requirements.md). Decisions: [docs/adr](docs/adr). Pending hotel data: [docs/pendientes-hotel.md](docs/pendientes-hotel.md).

## Stack

pnpm workspaces + Turborepo monorepo:

| Path                 | What                                                                          |
| -------------------- | ----------------------------------------------------------------------------- |
| `apps/web`           | Next.js 16 (App Router, Tailwind CSS v4 tokens) — public site and `/admin`    |
| `apps/api`           | NestJS 12 on Fastify, REST under `/api/v1`, Prisma 7 + PostgreSQL             |
| `packages/shared`    | Zod schemas and pure utilities shared by web and api (WhatsApp links, slugs)  |
| `docker-compose.yml` | Local PostgreSQL 18 and S3-compatible storage (RustFS) with a bucket init job |

Versions and the reasons behind them: [ADR 0005](docs/adr/0005-tooling.md).

## Quickstart

Prerequisites: Node.js 24 (`.nvmrc`), pnpm 11 (`corepack enable`), Docker with Compose.

```bash
pnpm install
cp .env.example .env          # local defaults; edit if ports clash
pnpm db:up                    # postgres + storage (+ bucket "hotel-media")
pnpm dev                      # web on :3000, api on :4000
```

- Web: http://localhost:3000
- API health: http://localhost:4000/api/v1/health (also through the web proxy: http://localhost:3000/api/v1/health)
- Storage console: http://localhost:9001 (keys `S3_ACCESS_KEY` / `S3_SECRET_KEY` from `.env`)

The single root `.env` is read by Docker Compose, the API and Next.js. Never commit it.

## Scripts (root)

| Script                                       | Does                                                           |
| -------------------------------------------- | -------------------------------------------------------------- |
| `pnpm dev`                                   | Runs every app in watch mode (Turborepo)                       |
| `pnpm build`                                 | Builds shared, api (`prisma generate` + `nest build`) and web  |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | ESLint, `tsc --noEmit`, Vitest in every package                |
| `pnpm format` / `pnpm format:check`          | Prettier write / check                                         |
| `pnpm db:up` / `pnpm db:down`                | Start / stop the Docker services (data stays in named volumes) |

Prisma commands run from the API package, e.g. `pnpm --filter @hotel-bambu/api prisma migrate dev`.

## Data (database, seeds, admin, media)

Scripts live in the API package: run them as `pnpm --filter @hotel-bambu/api <script>`. Model and seed rules: [ADR 0006](docs/adr/0006-data-model.md).

| Script              | Environments        | Does                                                                                                     |
| ------------------- | ------------------- | -------------------------------------------------------------------------------------------------------- |
| `db:migrate`        | local               | `prisma migrate dev` (then `db:generate`: Prisma 7 no longer generates or seeds automatically)           |
| `db:migrate:deploy` | staging, production | Applies pending migrations only                                                                          |
| `db:seed:base`      | all (idempotent)    | Hotel profile (name only, rest `TODO(hotel)`), landing sections, WhatsApp templates, amenities, services |
| `db:seed:demo`      | local, staging      | 16 `[DEMO]` rooms, demo FAQ and policies. Refuses when `NODE_ENV` or `APP_ENV` is `production`           |
| `media:import`      | local, staging      | Processes `assets-source/photos` per `docs/assets/assets-manifest.json`, uploads variants, links media   |
| `admin:create`      | all                 | Creates an admin, interactively or one-shot with `ADMIN_EMAIL` + `ADMIN_PASSWORD`                        |

First run on a fresh database:

```bash
pnpm db:up
pnpm --filter @hotel-bambu/api db:migrate
pnpm --filter @hotel-bambu/api db:seed:base
pnpm --filter @hotel-bambu/api db:seed:demo
pnpm --filter @hotel-bambu/api media:import   # needs S3_ACCESS_KEY / S3_SECRET_KEY (S3_ENDPOINT defaults to http://localhost:9000)
pnpm --filter @hotel-bambu/api admin:create   # prompts for email and password (min 12 characters)
```

- Order matters: `db:seed:demo` needs the amenity catalog from `db:seed:base`; `media:import` attaches room photos to the demo rooms and publishes the ones that get a cover image.
- `media:import` skips `discard` photos and photos already imported (SHA-256), strips EXIF/GPS, and writes AVIF + WebP variants (640/960/1280/1920, never upscaled) under random keys. Re-running it is safe.
- One-shot admin: `ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a long passphrase' pnpm --filter @hotel-bambu/api admin:create`, then clear it from your shell history. There are no default credentials. Add `-- --reset-password` to reset an existing admin (unlocks it and revokes its sessions).
- From a build (e.g. inside the API container): `node dist/scripts/admin-create.js` (also `seed-base`, `seed-demo`, `media-import`).
- `sharp` and `@node-rs/argon2` use prebuilt binaries and run on Windows, macOS and Linux hosts; no container is needed for these scripts.

## API

REST under `/api/v1` (endpoint list: [docs/api.md](docs/api.md)). Public reads under `/public/*`, admin CRUD under `/admin/*` behind a server-side session cookie and a CSRF token ([ADR 0008](docs/adr/0008-auth-sessions-csrf.md)). Every environment variable: [docs/configuration.md](docs/configuration.md).

- `pnpm --filter @hotel-bambu/api test` runs unit tests and, when `DATABASE_URL` points to a reachable PostgreSQL, integration tests against a separate `hotel_test` database (created and migrated automatically; the dev database is never touched). Without `DATABASE_URL` they are skipped locally; in CI (`CI=true`) they are mandatory.
- Admin mutations are written to `AuditLog` and ask Next.js to revalidate cache tags (`POST ${WEB_INTERNAL_URL}/api/revalidate`); failures are logged and never fail the request.

## Admin panel

`/admin` (Spanish UI): login, dashboard, hotel info, rooms (order, publish, images), amenities, services, promotions, media library, gallery, landing sections, FAQ, policies, social links, WhatsApp number and templates, account. Architecture and conventions: [docs/admin-panel.md](docs/admin-panel.md).

### Web dev in a Linux container (Windows hosts with Application Control)

Some Windows hosts block Tailwind's native `oxide` binary, so `next dev` / `next build` hang on the host. The `web` Compose profile runs Next.js in Linux instead (repo bind-mounted, `node_modules` and `.next` in named volumes); the API keeps running on the host and is reached at `host.docker.internal:4000`.

```bash
pnpm db:up                                        # postgres + storage
pnpm --filter @hotel-bambu/api dev                # API on the host, :4000
docker compose --profile web up web               # Next.js dev on http://localhost:3000 (first start installs deps)
WEB_COMMAND=build docker compose --profile web run --rm --no-deps web   # production build check
```

- Overrides: `WEB_API_INTERNAL_URL` (default `http://host.docker.internal:4000`), `WEB_PORT` (default `3000`).
- File watching uses polling (`WATCHPACK_POLLING`) because bind mounts from Windows do not deliver file events.
- Lint, typecheck and Vitest run fine on the host (`pnpm lint`, `pnpm typecheck`, `pnpm test`).
- After changing dependencies, restart the container (it runs `pnpm install --frozen-lockfile` on start). To reset its Linux modules, stop it and run `docker volume rm hotel-bambu_web-root-modules hotel-bambu_web-app-modules hotel-bambu_web-shared-modules hotel-bambu_web-next` (avoid `down -v`: it also deletes the database and storage volumes).

## Media originals

Original hotel photos live in `assets-source/` and are **never committed** (see requirements 15.1).
