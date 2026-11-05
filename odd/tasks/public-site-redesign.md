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

## Tasks
- [x] R1 Design research: references, pattern catalogue, analysis per 7.3 → `docs/research/` — delegated (web + screenshots)
- [x] R1b Admin UX + amenity logic research (industry taxonomy: hotel facilities vs room amenities; admin patterns) → `docs/research/amenity-model.md`, `admin-ux.md` — delegated. Verified bug: Wi-Fi seeded as room Amenity AND "Internet en todos los pisos" as hotel Service (duplicate).
- [x] R1c Admin visual references (real screenshots: dashboards, hotel software, Dribbble/Behance) → update `admin-ux.md` — delegated
- [x] R1v Independent validation of research completeness (req 7.2–7.4 + owner asks: global hotel sites, Dribbble/Behance/Awwwards/Pinterest-if-accessible, component/animation demos, admin references, screenshots exist + cited, moodboards per direction, amenity model sources). Gaps fixed before presenting to owner — delegated read-only verifier
- [ ] R2 Two art directions as coded prototypes + screenshots → owner decision
- [ ] R3 Redesign implementation: design tokens/typography update, layout system, components
- [ ] R4 Home narrative + motion system (GSAP/CSS, optional Lenis per research)
- [ ] R5 Inner pages (rooms, room detail, services, gallery, location, FAQ, policies, contact)
- [ ] R5b Amenity model fix (migration, API, seeds) per R1b — scope extension approved by owner 2026-11-04
- [ ] R5c Admin panel UI/UX redesign per R1b — scope extension approved by owner 2026-11-04
- [ ] R7 Cleanup at feature close: delete ALL screenshots: third-party (docs/research/refs/, scratchpad refs/ and refs-admin/) and own v1/prototype captures (scratchpad root public-*.png, admin-*.png, t7-*.png, prototype captures) — owner instruction 2026-11-04; never commit them (gitignored)
- [ ] R6 Quality: e2e + axe + Lighthouse budgets green, screenshots review

## Progress / evidence
- R1/R1b/R1c done; R1v first pass GAPS (9) → fixed → second pass COMPLETE (contrast ratios independently recomputed, React Bits license verified, Lighthouse data consistent). Minor items closed inline.
- Measured: v1 room-detail LCP element is the room photo; fonts (146 KB preloaded) contribute via bandwidth. Only 1 Mocoa hotel has its own site (Lighthouse 34).

## Next step
R2 prototypes of directions A and B → owner decision.
