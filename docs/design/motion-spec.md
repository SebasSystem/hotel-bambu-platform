# Motion specification (req. 8.5)

> **v1 baseline.** This is the motion shipped with the v1 site. It is **superseded** by [`docs/research/motion-spec.md`](../research/motion-spec.md) (directions A and B) as soon as the owner chooses a redesign direction. Until then it describes current behaviour.

Baseline: **CSS first, GSAP + ScrollTrigger (+ SplitText) via `@gsap/react` `useGSAP`** for scroll-linked work. **No Lenis, no Motion, no Three.js/R3F by default** (ADR 0004). Admin panel: shadcn/ui + CSS transitions only.

Note: req. 8.5 names `docs/research/motion-spec.md`; this phase places it under `docs/design/` with the other design deliverables.

## Tokens

From [`tokens.json`](./tokens.json) → CSS variables:

| Token | Value | Use |
|---|---|---|
| `--duration-fast` | 180ms | hovers, focus, small state changes |
| `--duration-base` | 320ms | header, menus, accordions |
| `--duration-slow` | 600ms | fade-up reveals |
| `--duration-slower` | 900ms | image cross-fades |
| `--duration-reveal` | 1100ms | hero title lines |
| `--ease-standard` | `cubic-bezier(0.2,0,0,1)` | UI state |
| `--ease-out-soft` | `cubic-bezier(0.22,1,0.36,1)` (GSAP `power3.out`) | entrances |
| `--ease-in-out-soft` | `cubic-bezier(0.65,0,0.35,1)` (GSAP `power2.inOut`) | cross-fades, scrub |
| stagger | 0.04s / 0.08s | lines, cards |
| `--reveal-y` | 1.5rem | fade-up distance |

## Approved animations (Direction A)

| Component | Trigger | Duration / easing | Mobile | `prefers-reduced-motion: reduce` | Library |
|---|---|---|---|---|---|
| Hero title reveal (whole title, one mask) | first paint | rise 1100ms, out-soft | same, shorter (800ms) | text shown static | CSS keyframes (D6: GSAP SplitText removed, it cost ~32 KB of JS on the home) |
| Hero image cross-fade (desktop split, 2–3 photos) | auto every 6s | slower 900ms, in-out-soft | single image, no rotation | single static image | CSS (opacity) + pause button (WCAG 2.2.2) |
| Header transparent → solid + blur | scroll > 24px | base 320ms, standard | same | instant state change | CSS + IntersectionObserver |
| Section fade-up | element enters viewport (15%) | slow 600ms, out-soft, `--reveal-y` | same | none, content visible | CSS (`animation-timeline: view()` where supported) with IO fallback |
| Room cards staggered entrance | grid enters viewport | slow 600ms, stagger 0.08 | stagger 0.04 | none | CSS + IO |
| Room card image hover (second photo / scale 1.03) | hover/focus-visible | base 320ms, standard | not applied (no hover) | no scale, instant swap | CSS |
| Sticky "Sobre nosotros" (text advances, image swaps) | scroll through section | scrub, image cross-fade in-out-soft | **no pin**: stacked text + image | no pin, stacked static | GSAP ScrollTrigger |
| Bamboo line/leaf draws itself (section kicker) | enters viewport | slower 900ms, out-soft | same | drawn statically | CSS `stroke-dashoffset` |
| Gallery | user swipe/scroll | native | `scroll-snap` carousel | native, no smooth | CSS scroll-snap (no pin) |
| Lightbox open/close | click | base 320ms, out-soft | same | fade only (opacity, fast) | CSS / dialog element |
| WhatsApp FAB appear | after hero leaves viewport | base 320ms | same | instant | CSS |
| Buttons, links, focus | hover/focus | fast 180ms, standard | — | color only | CSS |

Not approved for v1: pinned horizontal gallery, parallax layers, cursor effects, counters (no real data to count yet besides 16 rooms), map route reveal (map is consent-gated).

## Rules (from 8.3, enforced)

1. Content is fully rendered in HTML; animation start states are applied only after JS hydrates (`.js-motion` class on `<html>`), so no-JS shows everything.
2. Animate only `transform`, `opacity`, `clip-path` (SplitText masks) and `stroke-dashoffset`.
3. The LCP element (hero image / H1) is never hidden waiting for animation; the hero image is not animated in.
4. `gsap.matchMedia()` with `(prefers-reduced-motion: no-preference)` gates every GSAP timeline; CSS animations wrapped in `@media (prefers-reduced-motion: no-preference)`.
5. `useGSAP` scope for cleanup; `ScrollTrigger.refresh()` after images that change layout load.
6. Any auto-moving content > 5 s has a visible, labelled pause control.
7. Reference device: mid-range Android, CPU 4× throttle, Fast 3G — target no long tasks > 50 ms from animation code.
8. GSAP loaded only in client components that need it (code-split), not in the root layout.
