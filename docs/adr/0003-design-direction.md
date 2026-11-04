# 0003 — Design direction and identity v0.1

- Status: Proposed — **pending hotel approval** (req. 26 Phase 0 exit, 28.2)
- Date: 2026-11-04

## Context

The hotel has no brand manual; its only asset is a green sign with "HOTEL / Bambú" and bamboo leaves. The photo set is portrait, phone-quality and shows a simple, clean urban hotel in Mocoa (`docs/assets/photo-inventory.md`). Req. 6 asks for a token-based identity derived from the sign; req. 7.4 asks for two art directions and a chosen one.

## Decision

- Identity per `docs/design/identity.md`: primary `bamboo-700 #1D6247` derived from the sign's sampled hue (~152°), sand backgrounds `#F7F3EA`/`#EEE7D8`, decorative cane `#C9A55C`; all text pairs checked against WCAG AA.
- Typography: **Fraunces** (display, SOFT axis) + **Manrope** (text/UI), via `next/font/google`.
- Logo: original bamboo-stalk isotype + wordmark (`docs/design/logo*.svg`), outlined, two flat colours.
- Art direction **A "Refugio sereno"** as default (`docs/design/art-direction.md`): framed photos, split hero on desktop, calm motion. Direction B "Selva viva" is kept as an option for when better photography exists.
- All values flow through `docs/design/tokens.json` → Tailwind v4 `@theme` → shadcn/ui semantic variables.

## Consequences

- Changing the brand later is a token/SVG swap, not a component rewrite.
- If the hotel rejects the proposal, only tokens, logo files and this ADR change.
- Direction A hides resolution limits of current photos; a later switch to B depends on new photo material.
