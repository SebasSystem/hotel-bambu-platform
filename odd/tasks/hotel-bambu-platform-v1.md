# Feature: hotel-bambu-platform-v1

Locator: `odd/tasks/hotel-bambu-platform-v1.md` · Engram mirror: `odd/hotel-bambu-platform-v1/tasks`

## Objective
Build the Hotel Bambú Plaza web platform (public site + admin panel) per `docs/requirements.md`, phases 0–4, dockerized and ready for the owner to deploy on a VPS behind Cloudflare.

## Problem / Why
The hotel has no digital presence. Visitors must find, understand and contact the hotel via WhatsApp. Staff must edit all content without code.

## Scope (authorized)
- Phase 0: media inventory (46 photos, 2 videos), identity proposal, art direction, motion spec, ADRs, pending-data list.
- Phase 1: pnpm + Turborepo monorepo, Next.js web, NestJS (Fastify) api, PostgreSQL + Prisma, MinIO, Docker dev, CI.
- Phase 2: data model, seeds (base/demo), admin:create, media:import, auth/sessions/CSRF/rate limit, content modules, audit, revalidation, admin panel.
- Phase 3: public site (home narrative, rooms, services, gallery, location, FAQ, policies, contact, WhatsApp, footer).
- Phase 4: security headers, cookie consent, legal pages, SEO + JSON-LD, a11y, performance budgets, tests.
- Production: Dockerfiles + `docker-compose.prod.yml` + deploy guide for VPS + Cloudflare.
- Out of scope: domain, hosting provisioning, real deploy (owner does it), English translation.

## Known hotel data (from owner, 2026-11-04)
- Name: **Hotel Bambú Plaza** (Colombia).
- 16 rooms, types: individual and couple. All rooms: private bathroom, TV, fan, Wi-Fi.
- Hotel features: solar panels, water reserve, internet on all floors. No laundry.
- WhatsApp, rates, check-in/out, policies, social, RNT, address: unknown → `TODO(hotel)`, editable in admin.

## Constraints
- Do not invent hotel data, reviews or awards (`TODO(hotel)` + `docs/pendientes-hotel.md`).
- Original media never versioned (`assets-source/` is gitignored).
- Artifacts (code, docs, UI copy defaults) in English except public site copy, which is Spanish (target audience: Colombia).
- Verify library versions against official docs at install time.
- Receipt-driven review: OFF (global) → ordinary checks only.

## Delivery
- Strategy: `single-pr` style local feature branch `feat/platform-v1`; owner creates remote and pushes.
- Work-unit commits per task (Conventional Commits, no AI attribution per user rule).

## Tasks
- [x] T0 Bootstrap repo, copy assets to `assets-source/`, requirements to `docs/requirements.md` — inline
- [x] T1 Phase 0: media inventory, video analysis, identity/tokens, art direction, motion spec, ADRs, pending list — delegated (image reading) — commit 2a79f07
- [x] T2 Phase 1: monorepo base, web + api skeletons, shared package, Docker dev (Postgres, RustFS S3 — MinIO images no longer published, ADR 0005), CI — delegated writer — commit bff1b40. Known env issue: Windows App Control blocks Tailwind oxide binary → web dev/build hang on host; works in Linux containers.
- [x] T3 Phase 2a: Prisma schema (20 tables), migration init, seeds base/demo (16 rooms), admin:create (argon2id), media:import (36 assets, EXIF stripped, AVIF/WebP) — delegated writer — commit b595f48
- [x] T4 Phase 2b: API modules (auth, hotel, rooms, promotions, services, media, gallery, content, faq, policies, social, audit, revalidation) — delegated writer — commit 9a8973c (api 103 tests, shared 36)
- [x] T5 Phase 2c: admin panel UI (18 routes, proxy.ts guard, web dev container profile) — delegated writer — commit 98871b3. Polish note for T7: admin sidebar not full-height on long pages.
- [x] T6 Phase 3: public site (home narrative, rooms, services, gallery, location, FAQ, policies, contact, WhatsApp, revalidation) — delegated writer — commit d61c100 (web 144 tests; screenshots reviewed)
- [x] T7 Phase 4: security, consent, legal, SEO, a11y, perf, e2e tests — delegated writer — commit 9d37d17 (partial: e2e 41/41, axe 0 violations; Lighthouse room-detail LCP 3.6 s and home JS 193 KB over budget — font weight (Fraunces SOFT axis) is a design call)
- [x] T8 Production Docker + Cloudflare/VPS deploy guide — delegated writer — commit dff3e55. Owner decision: classic ingress (Caddy + Cloudflare Origin CA, Full strict, ufw only Cloudflare IPs) primary; Tunnel optional profile. Prod-like stack verified, backup/restore drill row counts matched (22 tables).

## Acceptance criteria
See `docs/requirements.md` section 27 (excluding production-only items owned by the owner).

## Progress / evidence
- T0: repo created, 46 photos + 2 videos copied, RDD status off.
- T1: 46 photos inventoried (42 unique; 45 are 960×1280 WhatsApp-compressed), videos 480p portrait → not used in v1 (ADR 0004). Palette bamboo-700 #1D6247 primary, sand-50 bg; Fraunces + Manrope. Photos reveal (unconfirmed): Mocoa, Putumayo; Calle 8 # 7-10; phone 310 679 8260; RNT 232175 → pending hotel confirmation.

## Next step
Owner: push to remote, confirm hotel data (docs/pendientes-hotel.md), legal review, deploy per deploy/README.md. Open decision: Fraunces SOFT axis vs room-detail LCP 3.6 s.
