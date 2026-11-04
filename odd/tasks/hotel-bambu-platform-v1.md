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
- [ ] T1 Phase 0: media inventory, video analysis, identity/tokens, art direction, motion spec, ADRs, pending list — delegated (image reading)
- [ ] T2 Phase 1: monorepo base, web + api skeletons, shared package, Docker dev (Postgres, MinIO), CI — delegated writer
- [ ] T3 Phase 2a: Prisma schema, migrations, seeds base/demo, admin:create, media:import — delegated writer
- [ ] T4 Phase 2b: API modules (auth, hotel, rooms, promotions, services, media, gallery, content, faq, policies, social, audit, revalidation) — delegated writer
- [ ] T5 Phase 2c: admin panel UI — delegated writer
- [ ] T6 Phase 3: public site — delegated writer
- [ ] T7 Phase 4: security, consent, legal, SEO, a11y, perf, e2e tests — delegated writer
- [ ] T8 Production Docker + Cloudflare/VPS deploy guide — delegated writer

## Acceptance criteria
See `docs/requirements.md` section 27 (excluding production-only items owned by the owner).

## Progress / evidence
- T0: repo created, 46 photos + 2 videos copied, RDD status off.

## Next step
T1.
