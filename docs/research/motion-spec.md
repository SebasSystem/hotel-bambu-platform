# Motion specification — redesign directions A and B (req. 8.5)

Status: research deliverable for feature `public-site-redesign` (req. 7.4.4, 8.5). Written 2026-11-04. It covers **both** candidate directions from [`art-direction-briefs.md`](./art-direction-briefs.md). After the owner picks a direction (ADR, req. 7.4.5), the chosen column becomes the approved list and the other one is archived.

`docs/design/motion-spec.md` is the **v1 baseline** (shipped motion for the v1 site). It stays valid until the direction is chosen. From then on this file supersedes it.

## Stack and rules (unchanged from req. 8.1 and 8.3)

- CSS first. GSAP + ScrollTrigger (+ SplitText, DrawSVG) through `@gsap/react` `useGSAP`, code-split per client component, never in the root layout. No Motion, no Three.js/R3F. Lenis only where the table says "optional", and only after the R2 prototype measures INP and long tasks.
- Every GSAP timeline sits inside `gsap.matchMedia()` with `(prefers-reduced-motion: no-preference)`. CSS animations sit inside `@media (prefers-reduced-motion: no-preference)`.
- Start states are applied only after hydration (`.js-motion` on `<html>`), so the HTML shows the final content with no JS.
- Animate only `transform`, `opacity`, `clip-path` and `stroke-dashoffset`. No `filter: blur` animation (costly on mid-range Android).
- The LCP element is never hidden or delayed by an animation. In both directions the hero **image** paints immediately. Only the headline lines animate, and only once the fonts are ready or after a 300 ms cap.
- Anything that moves by itself for more than 5 s has a visible, labelled pause button (WCAG 2.2.2).
- Reference device: mid-range Android, 4× CPU throttle, slow 4G. Budget: no long task > 50 ms caused by animation code. INP ≤ 200 ms.
- Mobile = `(max-width: 767px)` or `(pointer: coarse)`. Pointer-follow and hover effects require `(hover: hover) and (pointer: fine)`.

## Tokens

The v1 tokens stay (`--duration-fast` 180 ms, `--duration-base` 320 ms, `--duration-slow` 600 ms, `--duration-slower` 900 ms, `--duration-reveal` 1100 ms, `--ease-standard`, `--ease-out-soft`, `--ease-in-out-soft`, `--reveal-y`). The redesign adds the following. GSAP equivalents are the standard Penner curves.

| Token | Value | GSAP equivalent | Used by |
|---|---|---|---|
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | — | UI state (both) |
| `--ease-out-soft` | `cubic-bezier(0.22, 1, 0.36, 1)` | `power4.out` (quint-like). The v1 doc labels it `power3.out`, which is slightly off. | Entrances (both) |
| `--ease-out-ink` | `cubic-bezier(0.33, 1, 0.68, 1)` | `power3.out` | A: line reveals, plate reveals |
| `--ease-out-sign` | `cubic-bezier(0.25, 1, 0.5, 1)` | `power4.out` | B: stacked letters, tag tilt |
| `--ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | `expo.out` | B: clip-path expand |
| `--ease-in-out-soft` | `cubic-bezier(0.65, 0, 0.35, 1)` | `power2.inOut` | Cross-fades, scrub (both) |
| `--ease-linear` | `linear` | `none` | Marquee, scrub-linked draws |
| `--duration-ink` | `1000ms` | — | A: headline lines, plate reveals |
| `--duration-draw` | `1200ms` | — | A: bamboo strokes, service illustrations |
| `--duration-sign` | `650ms` | — | B: stacked letter rows |
| `--duration-snap` | `450ms` | — | B: tag tilt, stamp hover |
| `--stagger-lines` | `80ms` (A) / `60ms` (B) | `stagger` | Line and row reveals |
| `--marquee-speed` | `40s` per loop | — | B: facts strip |
| `--reveal-clip` | `inset(0 0 100% 0)` | — | Plate reveal start state (A) |

Mobile shortens every duration by about 25 %: `--duration-ink` 750 ms, `--duration-draw` 900 ms, `--duration-sign` 500 ms.

## Direction A — "Cuaderno de Mocoa" ("ink settling")

| # | Component | Trigger | Duration | Easing | Mobile | `prefers-reduced-motion: reduce` | Library |
|---|---|---|---|---|---|---|---|
| A1 | Hero headline, line-mask reveal | First paint, after `document.fonts.ready` (300 ms cap) | `--duration-ink`, stagger `--stagger-lines` | `--ease-out-ink` | Same, 750 ms. Headline sits below the plate, not over it. | Static text, no mask | GSAP SplitText (`type: "lines"`, `mask: "lines"`) |
| A2 | Hero diptych plates | None (LCP) | — | — | Single plate, static | Static | — |
| A3 | Plate reveal (Lámina) site-wide | Plate enters viewport (20 %), once | `--duration-ink` | `--ease-out-ink` | Same, 750 ms | Visible, no clip | CSS `clip-path` + inner `scale 1.12 → 1`, IntersectionObserver |
| A4 | Declaración band, word scrub | Scroll through the band | Scrub (`scrub: 0.5`) | `--ease-linear` | Same, shorter range | All words at full ink | GSAP ScrollTrigger, or CSS `animation-timeline: view()` where supported |
| A5 | Bamboo divider stroke | Divider enters viewport, once | `--duration-draw` | `--ease-out-ink` | Same, 900 ms | Drawn statically | CSS `stroke-dashoffset` |
| A6 | Notas de campo illustrations draw | Each card enters viewport, once | `--duration-draw`, stagger 150 ms | `--ease-out-ink` | Same, one at a time | Drawn statically | CSS `stroke-dashoffset` (or GSAP DrawSVG if paths need sequencing) |
| A7 | Room index pointer preview | Hover or focus on a row | `quickTo` 400 ms | `power3.out` | **Off**: inline plates in each row | Preview shows in a fixed position, no follow | GSAP `quickTo` |
| A8 | Sobre nosotros sticky (optional) | Scroll through section | Cross-fade `--duration-slower` | `--ease-in-out-soft` | No sticky: stacked | No sticky, stacked, static | CSS `position: sticky` + opacity |
| A9 | Header hide/show + solid paper | Scroll down > 80 px / up | `--duration-base` | `--ease-standard` | Same | Instant state change, no hide | CSS + IntersectionObserver |
| A10 | Cómo llegar route line | Section enters viewport, once | `--duration-draw` | `--ease-out-ink` | Same | Drawn statically | CSS `stroke-dashoffset` |
| A11 | Lightbox open/close | Click | `--duration-base` | `--ease-out-soft` | Same | Opacity only, `--duration-fast` | `<dialog>` + CSS |
| A12 | Buttons, links, focus | Hover/focus | `--duration-fast` | `--ease-standard` | — | Colour only | CSS |

Not approved for A: pinning (except the optional CSS sticky), marquee, horizontal pinned gallery, Lenis (re-evaluate only if the prototype feels stiff), cursor effects beyond A7, counters.

## Direction B — "Letrero y Madera" ("sign switching on")

| # | Component | Trigger | Duration | Easing | Mobile | `prefers-reduced-motion: reduce` | Library |
|---|---|---|---|---|---|---|---|
| B1 | Hero stacked letters rise per row | First paint, after fonts ready (300 ms cap) | `--duration-sign`, stagger `--stagger-lines` | `--ease-out-sign` | Same, 500 ms | Static | GSAP SplitText (`type: "lines"`, `mask: "lines"`) |
| B2 | Sign-green accent "switches on" | After B1 ends, once | 2-step flicker over 400 ms | `steps(2)` | Same | **Off**: accent shown on | CSS `@keyframes` (opacity) |
| B3 | Hero plate and green edge glow | None (LCP) | — | — | Static | Static | CSS `box-shadow` (no animation) |
| B4 | Franja de datos marquee | Auto, while in viewport | `--marquee-speed` per loop | `--ease-linear` | **Static**, stacked lines | Static, stacked | CSS `@keyframes` translateX, paused off-screen, **pause button** |
| B5 | Escalera pinned clip-path expand | Scroll through section | Scrub (`scrub: 0.6`), 3 steps | `--ease-out-expo` per step | **No pin**: stacked plate + steps | No pin, full plate, static | GSAP ScrollTrigger (`pin`, `scrub`) |
| B6 | Gallery horizontal pinned strip | Scroll through section | Scrub (`scrub: 1`) | `--ease-linear` | Native `scroll-snap` carousel | Static grid | GSAP ScrollTrigger (desktop) / CSS scroll-snap (mobile) |
| B7 | Sello CTA rotation | Hover/focus | 6 s per turn while hovered | `--ease-linear` | No rotation | No rotation | CSS `@keyframes` rotate |
| B8 | Room card tag tilt | Hover/focus | `--duration-snap` | `--ease-out-sign` | Tag rests at −2°, no motion | Rests at −2°, no motion | CSS transform |
| B9 | Sign rail section label | Section change | `--duration-base` | `--ease-standard` | Top progress label, text swap only | Text swap only | CSS + IntersectionObserver |
| B10 | Header transparent → sand on paper sections | Section change | `--duration-base` | `--ease-standard` | Same | Instant | CSS + IntersectionObserver |
| B11 | Sello FAB appears | Hero leaves viewport | `--duration-base` | `--ease-out-soft` | Same | Instant | CSS |
| B12 | Buttons, links, focus | Hover/focus | `--duration-fast` | `--ease-standard` | — | Colour only | CSS |

Optional for B: Lenis with `pointer: fine` only and `syncTouch: false`, driven from the GSAP ticker. Approve it only if the R2 prototype keeps INP ≤ 200 ms and no long task > 50 ms on the reference device.

Not approved for B: parallax portrait columns (Aceternity parallax grid) unless the prototype shows spare budget after B4–B6, cursor effects, counters, 3D.

## Budget check per direction

| | A | B |
|---|---|---|
| Scroll-driven systems | 1 (A4 scrub) + optional sticky | 3 (B4 marquee, B5 pin, B6 pin) |
| GSAP plugins | ScrollTrigger, SplitText (DrawSVG optional) | ScrollTrigger, SplitText |
| Auto-moving content | None | Marquee (pause button required) |
| Risk on mid-range Android | Low | Medium: each pinned system needs a mobile-off switch |

## Acceptance (R2 prototype)

- A Playwright run with `reducedMotion: 'reduce'` shows every section in its final state.
- With JS disabled, all text and images are visible.
- Lighthouse mobile on the prototype: LCP element is the hero image or H1, CLS < 0.1, TBT not worse than the v1 baseline (see `art-direction-briefs.md` §v1 LCP baseline).
