# Pattern catalogue — public site redesign

Status: research deliverable R1. Patterns observed in the references ([`design-references.md`](./design-references.md)) and in component and motion sources, rated for Hotel Bambú Plaza: a small 16-room, budget-friendly hotel in Mocoa whose photos are 960×1280 portrait phone shots of interiors.

**Fit:** High = adopt in either direction · Med = adopt in one direction or with care · Low = avoid or defer.
**Stack assumptions:** Next.js 16 App Router, Tailwind 4 tokens, GSAP 3.15 + ScrollTrigger (+ SplitText) via `useGSAP`, all already in the repo; Lenis optional. Rules from req. 8.3 and `docs/design/motion-spec.md` apply to every row: reduced-motion gate, no-JS-visible content, transform/opacity/clip-path only, LCP never animated in.

---

## 1. Hero

| Pattern | Where seen | Fit | Implementation notes | Perf / a11y risk |
|---|---|---|---|---|
| **Portrait diptych hero**: two 3:4 images edge to edge filling a 16:10 viewport, logo or headline across the seam | Paradero (desktop fold) | **High**. Turns two 960×1280 photos into a 1440-wide hero with no upscaling: each half is 720 px wide, 0.75× the source width. | CSS grid `grid-cols-2`, `h-[100svh]`, `object-cover`. Headline centred over the gutter with a light scrim gradient (≥4.5:1 checked on the darkest crop). Mobile: stack two plates or show one. Pick photos with matching light (#9 corridor + #11 room, or #13 stairs + #37 lounge). | LCP = first image. Give it `priority`/`fetchpriority=high` and preload only one image. Second image `loading=eager` but lower priority. |
| **Framed inset hero**: image inset with margin, logo above, circular CTA "bubbles" | Silena | **High**. The frame hides softness, and the margins carry the sand colour. | `p-[clamp(1rem,4vw,4.5rem)]` around the image. The circles are 120–180 px `rounded-full` links overlapping the frame corner. Circle text must be ≥ 14 px bold, contrast checked. | The circles must be real `<a>` with visible focus. Avoid covering the image's focal point. |
| **Giant wordmark over the image**: name ≈ 6–9 vw centred at the top, place name as caps under it | Odisej | **Med**. Works only with a calm top area in the photo. The portrait sign photo #35 or the corridor #9 could work on mobile. | Logo/wordmark as inline SVG (the logo is already outlined, so no font dependency for LCP). | Text over a busy photo needs a scrim. Check 3:1 for large text. |
| **Illustration-only hero**: no photo, hand-drawn figure plus one positioning sentence | Ett Hem | **Med**. Honest and memorable for a hotel with weak photos, but delays "show me the room". Best as the *about* opener, not the hero. | Single inline SVG, ≤ 15 KB, `stroke-dashoffset` draw on load (reduced motion: static). | An SVG LCP is cheap. Needs an `aria-hidden` illustration plus a real H1. |
| **Typographic statement hero**: one long display sentence, small photo beside or below | Silena ("48 rooms. A restaurant."), Odisej bands | **High** as a *second* beat. Use factual statements: "16 habitaciones. Paneles solares. Reserva de agua. En el corazón de Mocoa." | Text-only LCP (fast). SplitText lines with a mask reveal after `document.fonts.ready` (max 300 ms wait). | Never hide H1 text before JS. Start state applied via `.js-motion`. |
| Full-bleed background **video** hero | Juvet, Les Roches Rouges, Hoshinoya, Mashpi | **Low** (ADR 0004: no usable video). Hoshinoya shows the cost: a spinner over a dark gradient for several seconds. | — | Large LCP and data cost. Spinner preloaders violate req. 8.3. |
| Booking-engine bar in the hero (dates/guests) | Mashpi, Les Roches Rouges, Casa Cook | **Low**. There is no booking engine. Copy the *idea*: a persistent 1-line conversion bar, "Escríbenos por WhatsApp · Respuesta en horario de recepción", with no fake date fields. | — | Fake form fields would mislead (17.6). |

## 2. Typography

| Pattern | Where seen | Fit | Implementation notes | Perf / a11y risk |
|---|---|---|---|---|
| **Oversized centred serif statements on colour bands** (≈ 90–120 px, 3–5 words per line) | Odisej | **High** | `font-size: clamp(2.75rem, 7.5vw, 8rem); line-height: .95; text-wrap: balance`. Limit to 1–2 per page. | Fine. Keep real text, not images. |
| **Light, airy large sans statement** (≈ 64 px light) | Silena "Features" | Med | Needs a light sans weight. Adds a font weight, so only in direction B if the family is variable. | Thin weights below 300 fail legibility on low-DPI screens. |
| **Wide-tracked uppercase labels and kickers** (`letter-spacing .2–.3em`, 11–13 px) plus outline pill CTAs | Habitas, Silena ("FEATURES"), Juvet ("OPPDAG") | **High** | Token `--tracking-label: .22em`. Use the same family as body (no new font). | Uppercase body text hurts reading, so use it only for labels. |
| **Condensed display caps** for headings and nav | Les Roches Rouges, Casa Cook | Med (direction B) | A condensed axis (Instrument Sans `wdth 75`) or a dedicated condensed family. | Extra font file. Condensed caps at small sizes reduce legibility. |
| **Monospace "typewriter" body** for location and room details | Casa Cook (location cards) | Low–Med | Crafted, ledger feel ("Calle 8 # 7-10 · Mocoa, Putumayo"). It would be a third family, so use it only if it replaces one. | Mono body text is slower to read. Keep it to metadata. |
| **Italic serif accents** inside sans or serif headlines ("descanso *de verdad*") | Common on editorial sites (Odisej uses a soft serif display) | **High** (direction A) | Load one italic style only. Instrument Serif Italic latin ≈ 22 KB. | Low. |
| **Numbered section markers** ("01 — Habitaciones") | Odisej (room list numbers in pills), editorial sites | **High** | Use CSS counters or data. Tabular figures. | Use `aria-hidden` on the decorative numbers. |

## 3. Layout and composition

| Pattern | Where seen | Fit | Implementation notes | Perf / a11y risk |
|---|---|---|---|---|
| **Staggered photo pair**: two portrait images of different sizes, vertically offset | Odisej (rooms intro), Silena (about) | **High**. This is the natural home for portrait photos on desktop. | 12-col grid: image A `col-span-5`, image B `col-start-7 col-span-4 mt-[20vh]`. Optional parallax on B only (`yPercent: -10`, scrub). | Parallax is off on touch and reduced motion. |
| **Numbered room index**: full-width rows (name, one-line pitch, number pill). Hover reveals the photo; mobile shows inline photos. | Odisej ("Classic / Superior / Deluxe Room") | **High**. Suits 2–4 room *types* better than a card grid of 2. | `<ol>` of links. On hover/focus, a fixed-size portrait preview follows the pointer (GSAP `quickTo`) or slides in at the right. Mobile: each row shows its 3:4 photo. | The hover preview must also work on `:focus-visible`. Content must not depend on hover. |
| **Tall cards with caps title plus outline pill CTA**, horizontally scrollable | Habitas | Med–High (rooms on mobile, gallery) | `scroll-snap-type: x mandatory`, `overflow-x: auto`, cards `w-[78vw] max-w-[420px] aspect-[3/4]`. Visible prev/next buttons for desktop and keyboard users. | Hidden overflow traps keyboard users if the cards are not focusable. Add buttons. |
| **Split statement plus image** (text centred in the left half, tall image right, bleeding to the edge) | Habitas ("A Kingdom of Wonders"), Les Roches Rouges | **High** | `grid-cols-2`. The image column bleeds to the viewport edge (`mr-[calc(50%-50vw)]`). | Fine. |
| **Sticky storytelling**: text column scrolls while a pinned image column swaps frames | Requirement 8.2. Common on award hotel sites (Silena stack: GSAP + ScrollTrigger + Barba) | **High** (desktop), stacked on mobile | Pin the media column with CSS `position: sticky` (cheaper than GSAP pin). Cross-fade images keyed to step `IntersectionObserver` or `ScrollTrigger` `onToggle`. | Sticky inside `overflow:hidden` parents breaks. Reduced motion: no cross-fade, just the stacked layout. |
| **Organic section edge** (wave or curved band edge between colours) | Odisej (olive band with double wave) | Med. For Bambú, use a **bamboo node notch** (a straight edge with a small node bump) rather than a wave. | Inline SVG `<path>` at section boundaries, `fill: currentColor`, `aria-hidden`. | Negligible. |
| **Hand-drawn wayfinding illustrations as a section**: icons plus handwritten labels connected by lines | Les Roches Rouges ("Réception", "Spa 2e étage") | **High** for services (solar, water reserve, internet on every floor, reception). | 4–6 single-stroke SVGs (commission or draw in-house to the bamboo stroke style). Labels as real text, not baked in. Draw-on-scroll via `stroke-dashoffset`. | Keep each SVG under 6 KB. Labels must be HTML for SEO and screen readers. |
| **Bento gallery with mixed ratios** | v1 (current), many templates | Low. Mixed ratios plus small tiles expose the low resolution and colour casts. | Prefer a **single-ratio 3:4 masonry or column** or a horizontal plate strip with captions. | — |

## 4. Imagery (with portrait-only photography)

| Pattern | Where seen | Fit | Implementation notes | Perf / a11y risk |
|---|---|---|---|---|
| **Consistent 3:4 "plates" with captions** ("Lám. 03 — Escalera de madera, primer piso") | Editorial or museum style. Odisej uses consistent radius, Habitas consistent ratios. | **High** | One ratio site-wide (3:4), with 4:5 allowed for cards. Captions from the `alt`/caption field (admin already has alt text). | Captions add text weight but help a11y and SEO. |
| **Arch or segment mask** on one or two hero-level images (arched top, or a bamboo-segment rectangle with a "node" notch) | Common in boutique and wellness sites | Med–High (one signature use only) | `clip-path: path()` or `mask-image` with an SVG. Combine with a reveal: `clip-path: inset(100% 0 0 0)` → `inset(0)`. | `clip-path: path()` does not scale responsively. Prefer `mask` with an SVG `viewBox`, or `inset()` with `round`. |
| **Inset/framed image with a coloured passe-partout** | Silena, Odisej mobile | **High** | Framing hides softness. Never upscale beyond 1.0× on desktop: max rendered width is 960 px for a full-width portrait. Cap with `max-w`. | — |
| **Uniform colour grade** across photos | All top references | **High** (required by identity.md) | Neutral WB, +exposure, slight warmth, done in the image pipeline (sharp) at upload. Optional CSS `filter` is not recommended at runtime. | No reality-altering edits (req. 6.5, 17.6). |
| **Film grain overlay** | Habitas (hero), Hoshinoya (gradient placeholder) | **High** (subtle) | One 128–256 px tiling noise PNG/WebP (≤ 4 KB) or SVG `feTurbulence` baked to an image. `position: fixed; pointer-events:none; opacity:.06–.1; mix-blend-mode: multiply`. | Don't animate grain (CPU). Runtime SVG filters on full-screen layers are expensive. Use a bitmap. |
| **Image hover swap / slight scale** | v1, Habitas | Med | Keep it: `scale(1.03)` on `:hover, :focus-visible`. | Off on touch. |
| **Duotone or tinted placeholders** (LQIP) instead of grey blur | Hoshinoya (dark gradient), Paradero | **High** (fixes the v1 blurred tiles) | Dominant-colour background from the media pipeline plus `blurDataURL` that is small but *visible*. Ensure lazy images in the gallery load before reveal animations. | — |

## 5. Motion

| Pattern | Where seen | Fit | Implementation notes | Perf / a11y risk |
|---|---|---|---|---|
| **Line-mask headline reveal** | Odisej (statement bands), ubiquitous on award sites | **High** | GSAP SplitText `type: "lines", mask: "lines"` (SplitText 3.13+ supports `mask`), `yPercent: 100 → 0`, `stagger .08`, `power3.out`, 0.9–1.1 s. Revert on resize via `autoSplit`. | Wait for fonts. Reduced motion: none. Content visible without JS. |
| **Clip-path image reveal** on enter | Codrops "Pinned image mask reveal on scroll" (Sep 2025), Moussa Mamadou ScrollTrigger clip-path demos (Feb 2025) | **High** | `clip-path: inset(0 0 100% 0)` → `inset(0)`, plus inner image `scale 1.15 → 1`. ScrollTrigger `start: "top 85%"`, one-shot (`once: true`). | GPU-friendly. Avoid on the LCP image. |
| **Pinned image expand** (a small framed image grows to full-viewport as you scroll, then text appears) | Codrops pinned mask demos. Common in hotel "arrival" moments | Med–High (one use, desktop only) | ScrollTrigger `pin: true, scrub: 0.6`, animate `clip-path: inset(15% 30% round 24px)` → `inset(0% 0% round 0px)`. `matchMedia('(min-width: 1024px) and (prefers-reduced-motion: no-preference)')`. | Pinning adds scroll length, so keep it ≤ 1 viewport. Test on mid-range Android. Don't pin on mobile. |
| **Horizontal pinned gallery** | 8.2 candidate. Common in Awwwards hotel sites | Med (desktop only, ≤ 8 plates) | `pin` plus `x: -(scrollWidth - innerWidth)`, `scrub: 1`. Mobile: native scroll-snap (already in motion-spec). | Keyboard users need an alternative (all plates reachable by Tab, or a grid link). Not approved in v1, so re-approval is needed. |
| **SVG bamboo stroke draw** (line with nodes and leaves drawing as the section enters) | Req. 8.2, Ett Hem / Roches Rouges illustration style | **High** | `stroke-dasharray/offset`, CSS `animation-timeline: view()` with IO fallback, or GSAP `DrawSVGPlugin` (free since 2025). | Cheap. |
| **Smooth scroll (Lenis)** | Silena (stack lists "smoothscroll"), many Awwwards sites | Med | Lenis (MIT, a few KB, zero deps) with `respectReducedMotion: true` (default) and `syncTouch: false` (default, so native touch scroll is kept). Drive from `gsap.ticker`, `lagSmoothing(0)`, `lenis.on('scroll', ScrollTrigger.update)`. Load only on `(pointer: fine)`. | Breaks `position: sticky` in some setups and anchor jumps unless wired. Adds JS to every page. Optional; decide after the prototype. |
| **Page transitions** | Silena (barba.js) | Low–Med | Use the native **View Transitions API** (Next 16 supports `viewTransition` experimental) for cross-fades between pages, which needs no library. | Unsupported browsers fall back to an instant nav (fine). |
| **Cursor-follow image preview** (room index) | Odisej-style lists, Codrops | Med (desktop only) | `gsap.quickTo(el, "x", {duration: .4})`. Hide on `(pointer: coarse)`. | It must not be the *only* way to see the photo. |
| **Header that hides on scroll down, shows on scroll up** | Habitas, Casa Cook | **High** | ScrollTrigger `onUpdate` direction or a CSS scroll-driven timeline. Keep the CTA pill visible. | Don't hide when focus is inside the header. |
| **Long preloader / spinner** | Hoshinoya, Lapa Rios | **Avoid** | — | Delays content (req. 8.3). |
| **Newsletter / survey modal on first scroll** | Paradero, Casa Cook | **Avoid** | — | Interrupts, hurts INP/CLS, and is irrelevant for a 16-room hotel. |

## 6. Navigation

| Pattern | Where seen | Fit | Implementation notes | Perf / a11y risk |
|---|---|---|---|---|
| **Centred logo, menu left, single CTA right** | Odisej, Paradero, Silena, Habitas, Juvet | **High** | `grid-cols-[1fr_auto_1fr]`. The menu opens a full-screen overlay with large serif links and one photo. | Overlay: focus trap, `Esc`, `aria-expanded`, inert background (the v1 menu already does this). |
| **Full-screen menu with large type plus a contact block** | Odisej, Silena | **High** | Links 40–64 px serif. Contact (WhatsApp, address) at the bottom of the overlay. | — |
| **Top utility bar** with phone and WhatsApp | Lapa Rios, Wildlife Luxuries, Mashpi | Med | A slim bar on desktop only: "WhatsApp +57 … · Calle 8 # 7-10, Mocoa". Real data only once confirmed. | Takes vertical space on mobile, so hide it there. |
| **Sub-nav row of sections** under the header | Les Roches Rouges | Low | — | Redundant for a 1-page narrative. |

## 7. Calls to action and conversion

| Pattern | Where seen | Fit | Implementation notes | Perf / a11y risk |
|---|---|---|---|---|
| **One brand-coloured primary CTA**, everything else text links | Odisej ("Book now" olive pill), Paradero (outline "Reserve") | **High** | The primary pill uses `bamboo-900` on sand, or `sand-50` on dark. Label "Escríbenos por WhatsApp" with the glyph. | Replace the neon `#25D366` slab (see diagnosis #8). |
| **Circular CTA "bubbles"** (BOOK / ENQUIRE) | Silena | Med–High (direction B signature) | Two circles, top-right, overlapping the hero frame. Slow rotation of circular text on hover only. | Rotating text: pause on reduced motion. |
| **Floating WhatsApp button** | Playa Viva (bottom-right green circle) | **High** (already in v1) | Keep it, but appearing after the hero (v1 behaviour). Consider the brand-coloured background with a white glyph instead of WhatsApp green. | — |
| **"Why book direct"** reassurance link | Mashpi | Med | Spanish: "Por qué escribirnos directo": a quick reply, no intermediaries. Only claims the hotel confirms. | Must stay truthful. |
| **Price anchor in header** ("1 night from USD 155") | Hoshinoya | Med | "Desde $ … COP / noche" only when a published rate exists (req. 4.4). | Hide entirely when there is no rate. |

## 8. Footer

| Pattern | Where seen | Fit | Implementation notes | Perf / a11y risk |
|---|---|---|---|---|
| **Quiet centred typographic footer**: "Get in touch", email and phone in serif italic, small caps links | Ett Hem | **High** | Big serif closing line ("Te esperamos en Mocoa"), contact in display italic, legal row small. | — |
| **Giant wordmark footer** (logo across the full width at the bottom) | Common on 2024–26 award sites | **High** | Inline SVG wordmark scaled to 100 % width, `bamboo-900` on sand or `sand-50` on `bamboo-900`. | SVG only, no font cost. |
| **Certification badges row** | Ett Hem (SLH, Condé Nast) | Med | Show the RNT number as a tidy badge line, a legal trust signal. | Real data only (RNT 232175 pending confirmation). |

## 9. Component sources (inspiration only, adapt to tokens)

| Source | Useful pieces | License (verified 2026-11-04) | Notes |
|---|---|---|---|
| **GSAP** (ScrollTrigger, SplitText, DrawSVG, Flip) | All motion above | GSAP is 100 % free incl. all plugins (gsap.com/pricing, Webflow-backed); standard GSAP license | Already a dependency. Plugins ship in the `gsap` package. |
| **Lenis** (darkroom.engineering) | Smooth scroll | MIT | `respectReducedMotion` default true, `syncTouch` default false. |
| **Codrops** (tympanus.net) | Clip-path and mask reveals, pinned image reveals, grid previews | Per-demo; most demo repos on github.com/codrops are MIT. Check each repo before copying code. | Use as technique reference, re-implement. |
| **React Bits** | Text reveals, marquee, grain/noise | MIT + Commons Clause ("free for personal and commercial use"; may not sell the components themselves) | Copy-paste per component, check SSR and reduced motion. |
| **Magic UI** | Marquee, number ticker, border beam | MIT | Depends on Motion. Avoid adding a second engine (req. 8.1), so port to CSS/GSAP. |
| **Aceternity UI** | Parallax scroll, sticky scroll reveal | Item license: end products for clients allowed; no redistribution or resale of components | Built for dark mode. Restyle heavily. Low priority. |
| **shadcn/ui blocks** | Accordion (FAQ), dialog (lightbox), sheet (menu) | MIT | Keep for accessible primitives only. |
