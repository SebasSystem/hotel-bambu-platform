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

### Owner decisions 2026-11-05 (resolve spec §8 Q1-Q6)
- Q1/Q2: the mockup bamboo mark and the wordmark "Hotel Bambú" / "PLAZA · MOCOA" are approved as the logo ("use the design, logo and all").
- Reservations OUT: every "Consultar estadía" CTA opens WhatsApp through the existing `whatsAppLink` logic; the "Prototipo UX/UI" banner is not ported.
- Defaults for D2-D4 (recorded, implemented later): Q3 fact stack derived from data (published rooms count + highlighted services); Q4 admin KPIs become content-readiness KPIs; Q5 RoomType labels INDIVIDUAL "Individual", COUPLE "Pareja", TWIN "Doble", FAMILY "Familiar"; Q6 gallery uses the platform categories with Spanish labels.

## Tasks
- [x] R1 Design research (`docs/research/`) — kept as reference
- [x] R1b Admin UX + amenity model research
- [x] R1c Admin visual references
- [x] R1v Research validation
- [~] R2 Art-direction prototypes — superseded by pivot (rejected, deleted)
- [x] D0 Capture mockup (all public views + admin, desktop/mobile, scratchpad only) and extract design spec: tokens (colors, type scale, spacing, radii, shadows), logo SVG, components, motion → `docs/design/mockup-design-spec.md`
- [x] D1 Design system port in apps/web: tokens, self-hosted fonts (fix all-fonts preload via global-error), logo component, base UI components
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
- D1 done 2026-11-05 (route: delegated writer; trigger: 2+ non-trivial files). Tokens v1.0 in `docs/design/tokens.json` mirrored by `apps/web/styles/tokens.css` (legacy bamboo/sand/ink names kept as aliases until D2/D4) with WCAG contrast pairs tested (muted `#5F6862`, focus ring green on light / gold on dark). Fonts DM Sans (variable) + Gilda Display 400 via next/font, Fraunces/Manrope removed; home preloads exactly 2 woff2 (DM Sans 37 KB, Gilda 13 KB), no Google CDN. `BrandLogo`, new favicon `app/icon.svg` + `app/apple-icon.tsx`; `components/ui/` (button classes, Eyebrow, SectionHeading, Chip/FilterChip, StatusPill, Card); new sticky Header (underline nav, MobileMenu with focus trap, Escape, backdrop, inert background) and charcoal 4-column Footer. RED→GREEN: tokens/contrast, BrandLogo (5), MobileMenu (7). Checks: typecheck, lint, 236 unit tests, build all green; visual captures 1440/390 in scratchpad `d1/`.

- D2 implemented 2026-11-05, box left unchecked: not committed yet, and 4 e2e specs fail on the host (route: delegated writer; trigger: 2+ non-trivial files). Home in mockup order: `HeroCarousel` (N slides from `heroImages`: hero, then featured gallery and room covers until D3; 5.5 s autoplay, `aria-pressed` pause, prev/next, swipe, "01 / 03" index, reduced motion starts paused, focus holds rotation, no controls for one slide, inactive slides `inert`, controls clear of the FAB, slide 1 `priority`); intro + fact stack (`lib/public/facts.ts`: published room count + highlighted services, `minmax(96px,auto)` column); deep-green rooms band with the first published room; amenity cards; sand services panel; 4-tile gallery strip with category labels; image CTA panel (WhatsApp, or rooms when no number). Rooms: toolbar chips Individual/Pareja/Doble/Familiar only for present types (`?tipo=`, `aria-current`, live count), mockup room cards. Room detail: sticky photo column with thumbnails and lightbox, breadcrumb on its own line, detail blocks (description, capacity/beds/area, equipment, rate, schedule, promotions), ROOM WhatsApp CTA, no availability block, footer. Gallery: platform categories with Spanish labels (`lib/public/gallery.ts`, `?categoria=`, legacy enum values accepted), masonry with fixed 3/4, 4/5 and 1/1 tiles (no letterboxing), portalled `Lightbox` (focus trap, Escape, backdrop, arrows, closes on route change, unmounted when closed, focus returns after `inert` is released). Contact, location, services, FAQ, policies, legal, 404 and error restyled. Mobile: footer padded for the FAB. Header brand link renamed to start with the visible wordmark (axe label-content-name-mismatch on every page). Removed unused components (about-story, gallery-grid, section) and 9 unused legacy aliases (bamboo-100/300/500/600, cane-500/700, sand-50, ink-600, error-600). The rest stay: admin (D4), `components/consent`, `components/legal`.
- D2 RED→GREEN: rooms filters/labels (3), facts (3), gallery filters (3), carousel reducer (5), `HeroCarousel` (6), `PhotoGallery` lightbox (4). A browser-only bug (focus returned while `<main>` was still inert) was caught by e2e, reproduced in unit (RED), fixed (GREEN). Checks: typecheck OK; lint OK; 260 unit tests pass; `next build` OK (without `.env.example`); host e2e with `channel: 'msedge'` (temporary config, deleted): 40 passed / 4 failed. axe found no serious or critical violations on any public page (desktop and mobile). New e2e: room type chips, gallery lightbox. The 4 failures (admin FAQ, consent map, whatsapp ×2) all fail in the "public page changed after admin edit" revalidation poll, before any markup assertion. Captures at 1440 and 390 are in the scratchpad `d2/`.
- Deviations: images use the existing `Picture` (API AVIF/WebP variants, explicit srcset/sizes, priority on LCP) rather than `next/image`, per ADR 0011 (no runtime optimizer). Hover does not pause the full-bleed carousel, because it would almost never run; focus does pause it. Room cards use a 1:1 crop instead of 4:3 to suit the portrait photos.
- Data gaps for D3: multi-slide hero model; hero video (`heroVideoMedia` not in the public API); landscape or ≥1440 px hero photos (the current 960×1280 photos are upscaled); empty hotel profile in the dev DB (no WhatsApp, address, municipality, coordinates, about text, check-in/out), so those sections stay hidden; no room prices; only 5 gallery photos (2 categories).

## Next step
Owner/parent review of D2 captures; resolve the e2e revalidation environment (or confirm it fails on the base too); work-unit commit for D2; then D3.
