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

## Media originals

Original hotel photos live in `assets-source/` and are **never committed** (see requirements 15.1).
