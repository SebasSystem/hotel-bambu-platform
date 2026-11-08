# Owner review — phase A (site, admin and seed fixes)

## Objective
Apply the owner's review of the redesigned site and admin (2026-11-08) so the owner can verify it before phase B.

## Problem / why
The owner reviewed the running site and admin and reported spacing, CTA, naming, seed-content and admin-media issues. Phase B (optional reservations module + users/roles/permissions) starts only after the owner approves phase A.

## Scope (authorized)
Phase A only. Out of scope until approval: reservations, users/roles/permissions (phase B).

## Evidence
- Code verification (explorer, 2026-11-08): room count is dynamic (published `Room` rows; the 16 are leftover rows, data not code); hero pixelation is source photos (45/46 are 960×1280 portrait, variants never upscale) — no code fix; carousel has no code bug (API was down during the test); WhatsApp FAB exists but `whatsappNumber` is empty; ESCNNA not seeded; media picker cannot upload; amenities attach to `RoomType` only; page-header spacing lives in `components/site/page-header.tsx` plus a copy in the room detail page.
- Research (2026-11-08, sources in the Engram mirror): WhatsApp is the main conversion path without a booking engine; facts strip below the rooms; social icons + `sameAs`; "Información para huéspedes" for rules + FAQ (keep "políticas" for legal pages); Ley 1336/2009 + Res. 3840/2009 (physical code posting mandatory; web notice good practice under art. 7 / num. 10); Decreto 1377/2013 arts. 13 and 15 for legal pages; per-room features instead of new room types (Cloudbeds, Sirvoy, OPERA); upload-in-form media UX (Shopify pattern).

## Decisions
- CTAs stay dynamic from the hotel profile: WhatsApp primary when a valid number exists, phone always shown when present. Desktop header: WhatsApp button + `tel:` link; mobile: header call icon + floating WhatsApp button. No hardcoded numbers (the owner fills WhatsApp in admin).
- Home order: hero → rooms → facts strip → location → about → reviews → guest-info summary → gallery → closing CTA. RNT stays in the footer (removed from the strip).
- Rules + FAQ page renamed "Información para huéspedes" at `/informacion-para-huespedes`; `/politicas-del-hotel` answers 301; `/preguntas-frecuentes` redirects to the new path in one hop.
- ESCNNA: keep (legal basis above); short notice in the footer, full text on the guest-info page; seeded default text.
- Seed: base seed gets realistic default policies, FAQ and ESCNNA (no `[DEMO]` markers, idempotent, only into empty data); the client edits them later. Legal documents keep the draft banner until a lawyer approves (`LEGAL_APPROVED`).
- Per-room differences: room-level amenity overrides on `Room`, shown publicly as "en algunas habitaciones"; no new room type unless the price differs.
- Admin media: upload inside the picker (drag & drop, multiple, alt text per file), reused by the logo, hero slides and room types; room types accept images during creation.
- Hero photos: no code change; the owner needs landscape photos ≥ 1920 px (admin already warns).

## Tasks
- [x] A1 Header CTA (WhatsApp + phone, dynamic) and floating WhatsApp button behaviour; mobile call icon.
- [x] A2 Home: section order (facts strip after rooms, RNT out of the strip), guest-info summary top spacing.
- [x] A3 Footer social links as icons with accessible names (+ text where space allows); `sameAs` unchanged.
- [x] A4 Inner-page header spacing (shared PageHeader + room detail copy) and smaller room detail title.
- [x] A5 Rename to "Información para huéspedes" (route, nav, 301s, sitemap, SEO copy, admin labels, tests, docs).
- [x] A6 Seed: real default policies, FAQ, ESCNNA; demo seed keeps only room data; legal docs complete per Decreto 1377 arts. 13/15.
- [x] A7 Admin scrollbar: one scroll area, thin overlay-style scrollbar visible on hover/scroll.
- [x] A8 Admin media: upload in the picker (multi, drag & drop, alt text), logo + hero slides + room types; images during room-type creation.
- [ ] A9 Room-level amenity overrides (schema, API, admin, public "en algunas habitaciones").
- [x] A10 Verify hero carousel with the API running; respect the HERO section toggle.

## Acceptance criteria
Each task: behaviour visible in the running site/admin, unit tests where a deterministic RED exists, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm --filter web build` green; host e2e for touched flows.

## Delivery
Branch `feat/owner-review-phase-a` from `feat/public-redesign`. Strategy: ask-on-risk. Forecast ~1,500–2,000 authored lines (A8, A9 largest).

## Progress / evidence
Route A1–A5: delegated direct (one bounded writer; 5 tasks touching 2+ non-trivial files each).

| Task | Commit | RED → GREEN | Notes |
|------|--------|-------------|-------|
| A1 | `55cd1ec` | `cta.test.ts` (`phoneContact`) + new `header.test.tsx`: 4 failing → 14 passing | Desktop: "Escribir por WhatsApp" + `tel:` (icon < 1280 px, number ≥ 1280 px, new `wide` breakpoint); phone-only → phone button; phones: call icon + FAB. FAB offset 24 px, layout footer clearance 91 px. e2e `whatsapp.spec.ts` updated. |
| A2 | `e2b1fc9` | `trust.test.ts` (no RNT): 1 failing → 7 passing | Order hero → rooms → facts → location → about → reviews → summary → gallery → CTA; strip border removed; summary uses full `section` padding; RNT verified in footer (`footer.tsx`, screenshot). Section order covered by e2e only. |
| A3 | `d9cc74c` | new `social-links.test.tsx`: import failure → 3 passing | Inline SVG marks, name "Instagram de {hotel}", visible label; `sameAs` untouched. |
| A4 | `4a86709` | No meaningful unit RED (visual spacing); e2e "compact inner-page headers" added (1440×900, 390×844) — passing | Shared `Breadcrumbs`; new `--text-page-title` / `--text-display-room` tokens (`--text-display-page` kept: `tokens.test.ts` mirrors `docs/design/tokens.json`); room gallery 52vh on phones. |
| A5 | `20dff21` | `redirects.test.ts`, `sitemap.test.ts`, `page-seo.test.ts`: 5 failing → passing | `/informacion-para-huespedes`; `/politicas-del-hotel` and `/preguntas-frecuentes` → 301 in one hop (curl on host build). Header label "Huéspedes" (width), full name in mobile menu/footer/home. `routes.policies` key kept (consent analytics map). |
| A6 | `838b715` | `default-content.spec.ts` (import failure → 5 passing); `api.integration.spec.ts` seed defaults + re-run/no-overwrite/[DEMO] cleanup (2 failing → 31 passing); `escnna.test.ts` (import failure → 4); `legal-documents.test.tsx` (2 failing → 4) | Route A6–A10: delegated writer. Base seed: 8 published policies, 8 FAQ (times/address from the profile), ESCNNA notice (355 chars), check-in 15:00 / check-out 12:00 into empty fields; policies/FAQ created only when none exist; one-off delete of `[DEMO]` policies/FAQ. Demo seed keeps room data only. Footer shows the first ESCNNA sentence + link to `#aviso-escnna`; home summary lists the first 4 policy titles. Legal: data policy adds processing description, responsible area, procedure heading, database validity; privacy notice adds optional sensitive data section and phone. Local seed: `demoRowsRemoved: 8`, re-run `kept`/`0`; public API shows 8 policies, 8 FAQ, no `[DEMO]`. |
| A7 | `85e5750` | No meaningful unit RED (visual CSS). Static Playwright harness with `styles/admin.css`: computed `scrollbar-width: thin`, document thumb rgba(38,49,43,0.16) at rest → 0.42 on hover; sidebar rgba(255,255,255,0.1) → 0.32 on hover (headless Chromium does not paint scrollbars in screenshots) | `styles/admin.css` imported only by `app/admin/layout.tsx`, scoped with `html:has([data-admin-shell])` and `.admin-scroll`; `useScrollingFlag` sets `data-scrolling` while scrolling (900 ms); transition only without reduced motion; forced-colors keeps system scrollbars; WebKit fallback. Live admin check pending (login needs the :3000 origin). |
| A8 | (this commit) | API integration "creates a draft room type with its images in one call" (400 → 422/201 after the change; 32 passing); new `media-upload.test.ts` (import failure → 8 passing); new `media-picker.test.tsx` (9 failing → 9 passing: upload tab default on empty library, alt text required, format rejected, single auto-select, multiple "Agregar (2)", single keeps one file, `MediaField` buttons/warnings); new `room-type-form.test.tsx` (1 failing → 3 passing) | Route: delegated writer (2+ non-trivial files). Shared `useMediaUploads`/`MediaUploader` (`components/admin/media-uploader.tsx`, logic in `lib/admin/media-upload.ts`): drag & drop + file input, per-file alt text (shared `altTextSchema`), JPG/PNG/WebP ≤ 15 MB, status "Subiendo… / Procesando… / Subida", 409 duplicate reuses the stored asset, polls `GET /admin/media/:id` until `READY` (the API answers `READY` synchronously today). Per-file byte progress not shown: the shared `fetch` client has no upload progress (XHR would bypass its CSRF/401 handling). Picker tabs "Subir archivos"/"Elegir de la galería" (ARIA tabs, arrow keys); `MediaField` "Subir imagen"/"Elegir de la galería", preview with "Reemplazar"/"Quitar" and warnings (hero ≥ 1920 px / portrait). Room types: `POST /admin/room-types` accepts `images` (same `roomTypeImageListSchema` as the PUT, nested create = atomic; ADR 0016 addendum); new page has an "Imágenes" section; explicit "Usar como portada", removing the cover hands it to the first image. Library upload card uses the same uploader (multi, caption, gallery category). ~1,600 added lines (uploader, picker rewrite, ~420 test lines): one coherent behaviour, not split. Live admin upload not exercised (login needs the :3000 origin). `docs/api.md` (outside the edit surface) still lists `POST /admin/room-types` without `images`. |
| A10 | `01671dd` | `site.test.ts` `homeHeroSlides` (2 failing → 16 passing); `readiness.test.ts` wording + 1920 px threshold (2 failing → 15 passing) | Public API returns 4 hero slides and the host build renders a 4-slide carousel (read path verified). Admin create/activate not exercised (no admin credentials; login from :3100 fails the Origin check). Revalidation: the web container has `REVALIDATE_SECRET` empty, so `POST :3000/api/revalidate` answers 503; admin changes reach the home only after the 3600 s TTL until the container is recreated with the secret (user decision: Docker). Disabled `HERO` drops the photos, H1 kept (admin section form has no HERO switch, so it is reachable only via the API). Readiness title "Información para huéspedes sin textos de ejemplo"; `HERO_MIN_WIDTH` 1600 → 1920 and clearer hero-slides help; unused `SiteIcon` import removed (lint 0 warnings). |

Checks (2026-11-08): `pnpm typecheck` ok; `pnpm lint` ok (1 pre-existing warning, `blocks.tsx` unused `SiteIcon`); `pnpm test` ok (web 403, api 144, shared 47); `pnpm --filter @hotel-bambu/web build` ok (fails only when `.env.example` is sourced: its NODE_ENV breaks `/_global-error` prerender); Prettier check ok on changed files.
e2e (host build on :3100 against the host API, Playwright chromium 1248 installed): 50 passed, 7 failed — all environmental: admin login/consent evidence (origin is :3000), WhatsApp specs (API revalidates `WEB_INTERNAL_URL`=:3000, the stale container; the seeded hotel has no WhatsApp number).

Pending:
- A10: "Resumen de políticas" lives in `app/admin/(panel)/content/section-form.tsx` (not `lib/labels.ts`) and in `e2e/tests/admin.spec.ts`; outside the A6–A10 edit surface, not renamed. `docs/admin-panel.md` still says "≥1600 px" (outside the edit surface).
- A10: recreate the web container with `REVALIDATE_SECRET` (same value as the API) so admin edits revalidate the site immediately.
- A6/A7: live admin check of the scrollbar and of the seeded content in the admin lists (needs a login on the :3000 origin).
- Re-run `whatsapp.spec.ts`, `admin.spec.ts` and the consent map spec against the web container once it is restarted with this branch (user decision: Docker).
- Admin section toggle label "Resumen de políticas" (`lib/labels.ts`) and readiness "Políticas y preguntas reales" (`lib/admin/readiness.ts`) are outside the A5 edit surface.
- Native review not run by the writer (parent owns RDD assess/consent).

## Next step
Parent: RDD assess on `838b715..HEAD`, owner check of A6, A7 and A10, then A8 and A9.
