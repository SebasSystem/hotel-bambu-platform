# 0001 — Modular monolith (Next.js web + NestJS API)

- Status: Accepted
- Date: 2026-11-04

## Context

Small hotel (16 rooms), one admin team, low traffic, content-heavy public site plus an admin panel (req. 1, 12). Requirements 12.1 and 25 already favour a modular monolith over microservices and Next.js over Astro + Next.js.

## Decision

- Monorepo (pnpm workspaces + Turborepo): `apps/web` (Next.js App Router: public site SSG/ISR + `/admin`), `apps/api` (NestJS on Fastify, REST + OpenAPI), `packages/*` for shared Zod schemas, tokens and config.
- The API is a **modular monolith**: one deployable, NestJS modules per domain (auth, hotel, rooms, promotions, services, media, gallery, content, faq, policies, social, audit, revalidation). Modules talk through their public services only; no cross-module repository access.
- PostgreSQL + Prisma (inside `apps/api`); object storage S3-compatible (MinIO in dev) for media (ADR 0002).
- Browser talks to the API through Next.js same-origin proxy (`/api/*` rewrite) for simple cookies/CSRF (req. 12.4); cache invalidation by tags via a protected `/api/revalidate` (req. 21).

## Consequences

- One API process, one DB, one web process: simple local Docker, simple VPS deploy.
- Module boundaries keep a later extraction possible but it is not planned.
- Two TypeScript apps to build and version; shared schemas avoid drift.
