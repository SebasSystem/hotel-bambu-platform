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
| `pnpm e2e`                                   | Playwright + axe in the official Playwright image (see below)  |
| `pnpm lighthouse`                            | Lighthouse CI budgets (`lighthouserc.json`) in the same image  |

Prisma commands run from the API package, e.g. `pnpm --filter @hotel-bambu/api prisma migrate dev`.

## Data (database, seeds, admin, media)

Scripts live in the API package: run them as `pnpm --filter @hotel-bambu/api <script>`. Model and seed rules: [ADR 0006](docs/adr/0006-data-model.md).

| Script              | Environments        | Does                                                                                                                                                                                                            |
| ------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `db:migrate`        | local               | `prisma migrate dev` (then `db:generate`: Prisma 7 no longer generates or seeds automatically)                                                                                                                  |
| `db:migrate:deploy` | staging, production | Applies pending migrations only                                                                                                                                                                                 |
| `db:seed:base`      | all (idempotent)    | Hotel profile (owner-approved facts, plus default check-in 15:00 / check-out 12:00, written only into empty fields), landing sections, amenities, default guest policies and FAQ (created only when none exist) |
| `db:seed:demo`      | local, staging      | The two confirmed room types (no description or rate), one `[DEMO]` room per type without rooms (room data only). Refuses when `NODE_ENV` or `APP_ENV` is `production`                                          |
| `media:import`      | local, staging      | Processes `assets-source/photos` per `docs/assets/assets-manifest.json`, uploads variants, links media                                                                                                          |
| `media:variants`    | all (idempotent)    | Adds the variant widths existing media lack (after the width list changes), derived from each photo's widest stored variant; `--dry-run` only lists them                                                        |
| `admin:create`      | all                 | Creates an admin, interactively or one-shot with `ADMIN_EMAIL` + `ADMIN_PASSWORD`                                                                                                                               |

First run on a fresh database:

```bash
pnpm db:up
pnpm --filter @hotel-bambu/api db:migrate
pnpm --filter @hotel-bambu/api db:seed:base
pnpm --filter @hotel-bambu/api db:seed:demo
pnpm --filter @hotel-bambu/api media:import   # needs S3_ACCESS_KEY / S3_SECRET_KEY (S3_ENDPOINT defaults to http://localhost:9000)
pnpm --filter @hotel-bambu/api admin:create   # prompts for email and password (min 12 characters)
```

- Default guest content (`apps/api/src/seeds/default-content.ts`): eight published policies (check-in/out, guest registration, minors, cancellations, payment, VAT for non-residents, pets, smoke-free), eight FAQ built from the profile times and address. They are editable starting texts, not legal advice: the hotel reviews them in /admin. A re-run never overwrites an edit; it creates policies/FAQ only when the table is empty.
- One-off convergence: `db:seed:base` deletes policies and FAQ whose title/question starts with `[DEMO]` (left by earlier demo seeds) before creating the defaults. No other table is touched; `[DEMO]` rooms stay until the hotel replaces them in /admin.
- Order matters: `db:seed:demo` needs the amenity catalog from `db:seed:base`; `media:import` attaches room photos to the room types that have `[DEMO]` rooms and publishes the types (and their demo rooms) that get a cover image.
- `media:import` skips `discard` photos and photos already imported (SHA-256), strips EXIF/GPS, and writes AVIF + WebP variants (480/640/750/960/1280/1920, never upscaled) under random keys. Re-running it is safe.
- `media:variants` brings media uploaded before a width was added up to date: it renders only the missing smaller widths from the widest stored variant (originals are not kept), uploads them next to the existing files, updates `MediaAsset.variants` and, when `WEB_INTERNAL_URL` + `REVALIDATE_SECRET` are set, revalidates the public pages. Existing files are never rewritten, so the immutable cache stays valid. Run it once after deploying a new width (production: `node dist/scripts/media-variants.js` in the API container).
- One-shot admin: `ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a long passphrase' pnpm --filter @hotel-bambu/api admin:create`, then clear it from your shell history. There are no default credentials. Add `-- --reset-password` to reset an existing admin (unlocks it and revokes its sessions).
- From a build (e.g. inside the API container): `node dist/scripts/admin-create.js` (also `seed-base`, `seed-demo`, `media-import`, `media-variants`).
- `sharp` and `@node-rs/argon2` use prebuilt binaries and run on Windows, macOS and Linux hosts; no container is needed for these scripts.

## API

REST under `/api/v1` (endpoint list: [docs/api.md](docs/api.md)). Public reads under `/public/*`, admin CRUD under `/admin/*` behind a server-side session cookie and a CSRF token ([ADR 0008](docs/adr/0008-auth-sessions-csrf.md)). Every environment variable: [docs/configuration.md](docs/configuration.md).

- `pnpm --filter @hotel-bambu/api test` runs unit tests and, when `DATABASE_URL` points to a reachable PostgreSQL, integration tests against a separate `hotel_test` database (created and migrated automatically; the dev database is never touched). Without `DATABASE_URL` they are skipped locally; in CI (`CI=true`) they are mandatory.
- Admin mutations are written to `AuditLog` and ask Next.js to revalidate cache tags (`POST ${WEB_INTERNAL_URL}/api/revalidate`); failures are logged and never fail the request.

## Admin panel

`/admin` (Spanish UI): login, dashboard, hotel info (with the WhatsApp number and greeting), room types (order, publish, images), rooms (number, type, status), amenities, nearby places, media library, gallery, landing content (hero slides, section order), FAQ, policies, social links, account. Architecture and conventions: [docs/admin-panel.md](docs/admin-panel.md).

### Web dev in a Linux container (Windows hosts with Application Control)

Some Windows hosts block Tailwind's native `oxide` binary, so `next dev` / `next build` hang on the host. The `web` Compose profile runs Next.js in Linux instead (repo bind-mounted, `node_modules` and `.next` in named volumes); the API keeps running on the host and is reached at `host.docker.internal:4000`.

```bash
pnpm db:up                                        # postgres + storage
pnpm --filter @hotel-bambu/api dev                # API on the host, :4000
docker compose --profile web up web               # Next.js dev on http://localhost:3000 (first start installs deps)
WEB_COMMAND=build docker compose --profile web run --rm --no-deps web   # production build check
```

- On-demand revalidation: start the API with `WEB_INTERNAL_URL=http://localhost:3000` and the same `REVALIDATE_SECRET` (≥ 32 chars) that the `web` container receives (Compose passes `REVALIDATE_SECRET` through). Public site: [docs/public-site.md](docs/public-site.md).
- Overrides: `WEB_API_INTERNAL_URL` (default `http://host.docker.internal:4000`), `WEB_PORT` (default `3000`).
- File watching uses polling (`WATCHPACK_POLLING`) because bind mounts from Windows do not deliver file events.
- Lint, typecheck and Vitest run fine on the host (`pnpm lint`, `pnpm typecheck`, `pnpm test`).
- After changing dependencies, restart the container (it runs `pnpm install --frozen-lockfile` on start). To reset its Linux modules, stop it and run `docker volume rm hotel-bambu_web-root-modules hotel-bambu_web-app-modules hotel-bambu_web-shared-modules hotel-bambu_web-next` (avoid `down -v`: it also deletes the database and storage volumes).

## Quality checks: e2e, accessibility, performance

The Playwright suite (`e2e/`) and Lighthouse CI run inside `mcr.microsoft.com/playwright` (Compose profile `e2e`, host network). They run against a **production build** of the web and a running API:

```bash
pnpm db:up
pnpm --filter @hotel-bambu/api build && pnpm --filter @hotel-bambu/api start   # API :4000, with WEB_INTERNAL_URL + REVALIDATE_SECRET
WEB_COMMAND=start docker compose --profile web up -d web                       # next build + next start on :3000
pnpm e2e            # Playwright + axe; HTML report in e2e/test-results/report
pnpm lighthouse     # budgets: LCP ≤ 2.5 s, CLS ≤ 0.1, TBT ≤ 300 ms, JS ≤ 170 KB; reports in e2e/test-results/lighthouse
```

- The tests log in with `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` (default: the local dev admin). They temporarily set a WhatsApp number or coordinates when these are missing, and restore every change.
- On an empty database (CI), the global setup publishes one room type with a synthetic cover image and one published room.
- CI (`.github/workflows/ci.yml`, job `e2e`): Postgres and storage from Compose, API and web on the runner, `pnpm e2e` (blocking), `pnpm lighthouse` (non-blocking), reports uploaded as artifacts.

## Security, privacy and SEO

- Security headers, CSP and threat model: [docs/security.md](docs/security.md).
- Dependency audit, supply-chain settings (`allowBuilds`, `minimumReleaseAge`, `trustPolicy`) and update policy: [docs/security/dependency-audit-2026-11.md](docs/security/dependency-audit-2026-11.md). Never run `npx <name>` for a binary that is not in the workspace; use `pnpm exec`.
- Cookie consent, legal pages and SEO: [docs/public-site.md](docs/public-site.md).
- Legal checklist before publishing: [docs/legal-checklist.md](docs/legal-checklist.md). **The legal texts are templates: a lawyer must review them.**
- Deployment flags: `SITE_URL`, `SITE_INDEXABLE` (opt-in indexing) and `LEGAL_APPROVED` ([docs/configuration.md](docs/configuration.md)).

## Production deployment

Production runs from `docker-compose.prod.yml` on a single VPS behind Cloudflare. Caddy is the primary ingress, with a Cloudflare Origin certificate and a firewall that admits only Cloudflare; Cloudflare Tunnel is the alternative. Media is stored in Cloudflare R2. Migrations run as a one-shot job, and backups run daily.

- Step-by-step guide, go-live checklist and restore drill: [deploy/README.md](deploy/README.md).
- Decision record: [ADR 0014](docs/adr/0014-production-deployment.md).
- Shortcuts: `make help` on the VPS, or `pnpm prod:config|build|up|down|ps|logs|backup` from a workstation. All of them read `deploy/.env.production`, created from `deploy/env.production.example`.
- CI builds the production images on every push (job `docker-images`); nothing is pushed to a registry.

## Media originals

Original hotel photos live in `assets-source/` and are **never committed** (see requirements 15.1).
