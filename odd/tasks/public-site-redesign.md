# Feature: public-site-redesign

Locator: `odd/tasks/public-site-redesign.md` · Engram mirror: `odd/public-site-redesign/tasks` · Branch: `feat/public-redesign` (from `feat/platform-v1`)

## Objective
Replace the current flat/basic public site design with a memorable, immersive, non-generic design grounded in real research of high-quality hotel websites (global, not local competitors), per requirements sections 6, 7 and 8.

## Problem / Why
Owner reviewed v1: design is too basic and flat. Root cause: Phase 0 skipped design research (7.2–7.4); art directions were not grounded in references.

## Scope (authorized)
- Research: award-level and boutique hotel sites worldwide + component/motion pattern references; screenshots analysed per template 7.3.
- Two art directions with real visual prototypes (screenshots) → owner chooses.
- Redesign public site (home + all public pages) per chosen direction, incl. motion system; respect perf budgets (fix font LCP issue), a11y, reduced motion.
- Out of scope: API/admin changes (unless a content field is required by the design — owner approval).

## Constraints
- Photos are 960×1280 portrait WhatsApp images; design must make them look premium (crops, frames, layouts that suit portrait).
- No invented hotel data; Spanish public copy; tests/e2e must stay green.

## Pivot 2026-11-05 (owner decision)
Owner rejected both R2 prototypes (A/B deleted, not committed). New design base: the mockup at github.com/Aleixein466/Hotel-Bambu (local clone `../hotel-bambu-aleixein`, static vanilla-JS prototype). Rebuild its design inside this platform: same or better look (typography DM Sans + Gilda Display, palette, logo, layout, components), real data from our API, real indexable routes. Owner decisions: reservations are OUT (no booking drawer, quick date search, calendar, availability block — CTAs go to WhatsApp); admin keeps platform modules, merges redundant ones, adopts mockup dashboard checklist and multi-slide hero; drop mockup occupancy chart, revenue KPI, Configuración/Usuarios placeholders. Also: dependency version + vulnerability audit, SEO. Delivery strategy: ask-on-risk (default); work-unit commit per task on `feat/public-redesign`.

## Tasks
- [x] R1 Design research (`docs/research/`) — kept as reference
- [x] R1b Admin UX + amenity model research
- [x] R1c Admin visual references
- [x] R1v Research validation
- [~] R2 Art-direction prototypes — superseded by pivot (rejected, deleted)
- [x] D0 Capture mockup (all public views + admin, desktop/mobile, scratchpad only) and extract design spec: tokens (colors, type scale, spacing, radii, shadows), logo SVG, components, motion → `docs/design/mockup-design-spec.md`
- [ ] D1 Design system port in apps/web: tokens, self-hosted fonts (fix all-fonts preload via global-error), logo component, base UI components
- [ ] D2 Public pages rebuilt per mockup with real data: home (no quick search), rooms catalogue + type filter, room detail (no availability), gallery + filters, contact/location; restyle services, FAQ, policies, legal; WhatsApp CTAs
- [ ] D3 Data model adjustments: amenity/service merge (Wi-Fi → CONNECTIVITY service, TV merge, categories + charge flag) with migration + seeds; multi-slide hero (DB+API+admin); gallery category mapping
- [ ] D4 Admin restyle to mockup design: renamed nav ("Servicios del hotel", "Equipamiento de habitaciones"), dashboard "Antes de publicar" checklist
- [ ] D5 Dependency versions + vulnerability audit (pnpm audit, latest patched versions), fix + verify
- [ ] D6 SEO: meta descriptions, OG/Twitter, Hotel JSON-LD, sitemap/robots, canonical, perf budgets (JS ≤ 170 KB)
- [ ] D7 Quality: unit + e2e + axe + Lighthouse green; visual comparison vs mockup captures
- [ ] R7 Cleanup at feature close: delete ALL screenshots (third-party refs, own captures, mockup captures) — never commit them

## Progress / evidence
- R1/R1b/R1c/R1v done (see git 11c79a5).
- R2 superseded 2026-11-05: prototypes and root layout split removed from working tree; `next build` OK after removal (note: build without loading `.env.example`, its NODE_ENV breaks `/_global-error` prerender).
- D0 done 2026-11-05 (route: delegated writer; trigger: broad reading + capture). Mockup run locally (vite :5180, killed by port after; port verified free). 37 captures (1440 + 390: all public views, 3 room filters, admin Resumen/Habitaciones/Calendario/Contenido, mobile menu, scrolled header, hover nav/amenity/room card, lightbox, toast, excluded booking drawer) in the session scratchpad `mockup/` only, not in any repo. Spec: `docs/design/mockup-design-spec.md` (tokens with styles.css line refs, logo SVG variants + favicon, components, per-page layout, 23 defects, exclusions with replacement CTAs, data mapping, 6 owner questions Q1-Q6).
- Admin comparison (explorer, 2026-11-05): mockup admin = Resumen/Habitaciones/Calendario/Contenido + 2 placeholders; platform = 14 modules; redundancies Wi-Fi (Amenity+Service, `seeds/base-data.ts:63,79`) and TV.

## Next step
D1 design system port in apps/web per `docs/design/mockup-design-spec.md` §1-3 (tokens, self-hosted fonts, BrandMark, base components). Open owner questions Q1-Q6 in spec §8 (Q1 logo ownership, Q5 RoomType labels block D2 copy, not D1).
