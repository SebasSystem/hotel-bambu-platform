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
- [ ] R1 Design research: references, pattern catalogue, analysis per 7.3 → `docs/research/` — delegated (web + screenshots)
- [ ] R2 Two art directions as coded prototypes + screenshots → owner decision
- [ ] R3 Redesign implementation: design tokens/typography update, layout system, components
- [ ] R4 Home narrative + motion system (GSAP/CSS, optional Lenis per research)
- [ ] R5 Inner pages (rooms, room detail, services, gallery, location, FAQ, policies, contact)
- [ ] R6 Quality: e2e + axe + Lighthouse budgets green, screenshots review

## Next step
R1.
