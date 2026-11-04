# 0005 — Phase 1 tooling and version choices

- Status: Accepted
- Date: 2026-11-04

## Context

Requirement 0.1.2 asks to install the latest stable, compatible version of each library, checked against official docs at install time, and to record deviations from `docs/requirements.md` (0.1.8). Phase 1 (section 26) sets up the monorepo, both apps, Prisma, Docker dev services and CI.

## Decision

| Area | Choice | Notes |
|---|---|---|
| Runtime | Node.js 24 LTS (`.nvmrc`), pnpm 11 (`packageManager`), Turborepo 2.11 | |
| TypeScript | **6.0.x**, not 7.0 | TS 7 (native compiler) is `latest`, but `typescript-eslint` 8.72 supports `<6.1` and `@nestjs/cli` 12 pins `~6.0.2`. Revisit when both support 7. |
| Web | Next.js 16.4 (App Router, Turbopack), React 19.3, Tailwind CSS 4.3 via `@tailwindcss/postcss` | Tokens mirrored from `docs/design/tokens.json` into `apps/web/styles/tokens.css` (`@theme`); a Vitest test fails on drift. Fonts via `next/font/google` (self-hosted at build). |
| Proxy | `next.config.ts` rewrites `/api/v1/*` to `API_INTERNAL_URL` | Scoped to `/api/v1` so Next route handlers such as `/api/revalidate` never reach the API (req. 12.4, 21). |
| API | **NestJS 12.3** + Fastify adapter, ESM (`"type": "module"`, `module: nodenext`) | Nest 12 packages are ESM-only; the requirements' "11.x / `platform-fastify` ≥ 11.1.11" floor is satisfied. `@nestjs/config` 12 validates env with a Zod schema through `validationSchema` (Standard Schema). Logging: `nestjs-pino` (pretty in development, JSON otherwise, cookie/authorization redacted). Headers: `@fastify/helmet`. |
| ORM | **Prisma 7.10** (`prisma.config.ts`, `prisma-client` generator with ESM output in `src/generated/prisma`, `@prisma/adapter-pg`) | npm `latest` points to `8.0.0-rc.*`, a release candidate, so the latest **stable** 7.x is used. Re-evaluate 8.x once it is GA. |
| Tests | **Vitest 5** everywhere; API uses `unplugin-swc` | Nest 12 defaults new ESM projects to Vitest; SWC emits decorator metadata that Nest DI needs (esbuild cannot). |
| Lint/format | ESLint 10 flat config (root `eslint.config.js`, `typescript-eslint`, `eslint-config-prettier`); `apps/web` adds `eslint-config-next` (core-web-vitals + typescript); Prettier 3 | Some plugins bundled by `eslint-config-next` do not list ESLint 10 in their peer ranges yet; Next.js documents ESLint 10 support since 16.4, so `pnpm-workspace.yaml` allows that peer. No separate `packages/config`: one root config is enough. |
| Env | One root `.env` (from `.env.example`) read by Docker Compose, the API (`envFilePath`) and Next (`@next/env`) | Production injects real environment variables. |
| PostgreSQL | `postgres:18.6-alpine` | Latest stable major; 18+ images mount data at `/var/lib/postgresql`. |
| Object storage (dev) | **RustFS 1.0.4** (`rustfs/rustfs`) + `amazon/aws-cli` init job, instead of MinIO | MinIO stopped publishing container images (Docker Hub repository removed, quay.io requires auth) and its community repo is archived. RustFS is an Apache-2.0, S3-compatible server; the app only talks S3 (`S3_*` variables), so the provider stays swappable (ADR 0002 unchanged in substance). |
| Supply chain | pnpm 11 defaults kept: `minimumReleaseAge` and blocked lifecycle scripts | Only `prisma`, `@prisma/engines` and `@swc/core` may run install scripts (`allowBuilds`). Nest packages pinned to 12.3.2 / config 12.0.1 because 12.3.3 / 12.1.0 were published the same day and fall inside the release-age window. |

## Consequences

- Requirement 12.9/24 mention MinIO for local development; the dev service is RustFS until a maintained MinIO image exists. Production storage is decided in the deploy task (T8): any S3-compatible provider works.
- Requirement 25 lists TypeScript 5.x and Nest 11.x as references; versions above are newer stable releases, as 0.1.2 requires.
- Upgrading TS to 7 or Prisma to 8 needs a new ADR entry.
