# Art-direction briefs — two directions for the redesign

Status: research deliverable R1 → input for R2 (coded prototypes + screenshots → owner decision). These replace the un-researched v0 directions in `docs/design/art-direction.md` (A "Refugio sereno" / B "Selva viva"). Grounding: [`design-diagnosis.md`](./design-diagnosis.md), [`pattern-catalogue.md`](./pattern-catalogue.md), [`design-references.md`](./design-references.md). Motion for both directions: [`motion-spec.md`](./motion-spec.md).

**Fidelity (req. 7.4.3).** This brief is the written moodboard and home structure. The "home in low/mid fidelity for mobile and desktop" required by 7.4.3 is delivered as **coded R2 prototypes**: the home hero, rooms and services sections of each direction, built in the real stack and captured at 1440 px and 390 px. Coded prototypes replace static mock-ups because they also prove fonts, LCP and motion on real devices. Like all screenshots, the prototype captures are transient (see [`design-research.md`](./design-research.md#screenshot-and-copyright-policy)); the prototypes themselves are the evidence.

## Shared ground rules (both directions)

- **Honesty (req. 6.5, 17.6).** Bambú Plaza is a clean, simple 16-room city hotel in Mocoa. Premium comes from **care**: typography, framing, rhythm and craft. It never comes from implied luxury, jungle views or amenities the hotel does not have. Use only confirmed facts: 16 rooms; solar panels; water reserve; internet on every floor; private bathroom, TV, fan and Wi-Fi. Address, phone, tagline and RNT go live only after the hotel confirms them.
- **Place.** Mocoa (Putumayo) sits in the Andes–Amazon foothills. This lives in *type, colour and illustration* (rain, leaves, bamboo), never in stock photos. Copy about the surroundings needs hotel sign-off.
- **Photos.** 960×1280 portrait images. Never render a photo wider than ~1.0× its source (960 px). Use one consistent grade in the media pipeline. One ratio family (3:4, with 4:5 for cards).
- **Fonts (reduces an LCP contributor; see [§ v1 LCP baseline](#v1-lcp-baseline-measured)).** Today `fonts.ts` loads Fraunces with `axes: ['SOFT','opsz']`. Google serves a 120.8 KB latin file for that axis set (measured 2026-11-04). Measured latin woff2 sizes from the Google Fonts CSS API:

  | Font request | Latin bytes |
  |---|---|
  | Fraunces opsz+wght+SOFT (current) | 120,788 |
  | Fraunces opsz+wght (no SOFT) | 67,304 |
  | Fraunces static 600, opsz 144 | 17,172 |
  | Fraunces 600 + italic 400 (static) | 40,948 |
  | Instrument Serif regular + italic | 43,160 (21,032 regular only) |
  | Big Shoulders Display wght 600–800 (variable) | 35,436 |
  | Bricolage Grotesque static 700, opsz 96 | 22,364 |
  | Manrope wght 400–800 (variable) | 24,532 |
  | Instrument Sans wdth+wght (variable) | 57,332 |

  With `next/font/google`, passing `weight: '600'` and no `axes` downloads a static instance. Preload only the display face used above the fold, and keep the body face `display: swap` with an `adjustFontFallback` metric override, so the H1 paints in the fallback without layout shift.
- **Motion rules** from req. 8.3 and `motion-spec.md` stay in force: `prefers-reduced-motion`, no-JS-visible content, transform/opacity/clip-path only, LCP never animated, mid-range Android as the reference device, GSAP code-split per client component.
- **CTA.** One brand-coloured primary ("Escríbenos por WhatsApp" + glyph). WhatsApp `#25D366` is no longer a large surface.

---

## Direction A — "Cuaderno de Mocoa" (field-journal editorial)

**One line:** a traveller's notebook about a well-kept house in Mocoa. Paper, ink, numbered plates, hand-drawn bamboo, big serif sentences.

### Mood

Calm, literate, warm and handmade. It sits closer to a small independent magazine than a resort. Generous margins, captions everywhere, marginal notes. The premium signal is *editorial care*, which suits modest rooms: a carefully captioned plate of a simple room looks intentional. A cheap stock-style hero does not.

References: Casa Angelina (numbered kickers "02 / EL DESCANSO", italic accent "*quedarse*", honest pensión rooms), Ett Hem (illustration as identity, quiet type footer), Odisej (giant serif statements, staggered photo pairs, numbered room list), Les Roches Rouges (hand-drawn wayfinding icons), Paradero (portrait diptych).

### Typography

| Role | Font | Detail | Cost (latin) |
|---|---|---|---|
| Display (H1/H2, statements, captions in italic) | **Instrument Serif** regular + italic | 400 only. Use from 28 px up, never for body text. Tight leading (0.95–1.05), `text-wrap: balance`. The italic carries emphasis words. | 43 KB (21 KB if italic is dropped) |
| Text / UI / labels | **Manrope** (keep) | 400 / 500 / 600 from the variable file. Labels in caps with `letter-spacing .2em`, 12 px. Tabular numbers for prices. | 24.5 KB |
| **Total** | | Two families, within the req. 6.4 limit | **≈ 68 KB vs 145 KB today** (−53 %) |

Alternative if the owner wants to keep Fraunces for continuity with the wordmark: Fraunces static 600 (opsz 144) plus italic 400 = 41 KB. The look is softer and more rounded, less editorial. The logo is already outlined SVG, so the wordmark does not depend on the web font.

Scale: display `clamp(3rem, 8vw, 8.5rem)`; H2 `clamp(2.25rem, 5vw, 4.5rem)`; H3 Manrope 600 `1.25rem`; body 17–18 px with line-height 1.6; caption Instrument Serif italic 18–20 px.

### Palette use (evolves the existing tokens)

| Role | Token | Note |
|---|---|---|
| Paper (page) | `sand-50 #F7F3EA` → evolve to a warmer **paper `#F4EEE1`** | Plus a fixed grain overlay (opacity ~0.07) |
| Ink | `ink-900 #1A1F1C` | Body text and display |
| Brand | `bamboo-900 #12392B`, `bamboo-700 #1D6247` | Primary CTA, links, the one dark "night" band |
| Illustration line | `bamboo-500 #3B8F69` | Strokes only (decorative) |
| Accent | `cane-700 #8A6A2B` (text-safe on `sand-50` only, 4.35:1 on paper) → **`cane-750 #836428`** for small text on paper (4.76:1) / `cane-500` (lines) | Plate numbers, kicker rules |
| Stamp | `earth-600 #A8582F` | A small "sello" stamp mark (e.g. "16 hab.") and promotions only |

The proportions are about 80 % paper, 12 % ink, 6 % green and 2 % cane/earth. One full-bleed `bamboo-900` band per page at most.

### Layout system

- 12-column grid, 1440 px max, gutters `clamp(1rem, 2.5vw, 2rem)`. **Asymmetric**: text blocks sit on cols 2–6 and images on cols 7–12, or the reverse with offsets. Never centre-everything.
- A **margin rail** (col 1 on desktop) holds section numbers ("01", "02"…) and short marginalia, such as the photo caption or "Calle 8 · Mocoa" once confirmed.
- Vertical rhythm `--section-y: clamp(6rem, 14vw, 12rem)`, with spacing that collapses when a section is hidden.
- Section edges are straight lines plus an optional hand-drawn bamboo divider (SVG stroke).

### Signature components

1. **Lámina (plate).** A 3:4 photo on a paper passe-partout with a caption line: "Lám. 04 — Habitación de pareja, segundo piso". The number is in cane and the caption in serif italic. It is used site-wide and makes every photo look curated.
2. **Hero díptico.** Two plates side by side with no gutter (desktop 100svh). A large serif headline sits across the seam on a soft scrim; the kicker reads "Mocoa · Putumayo". Mobile shows one plate full-height with the headline below the image (not over it), for legibility and a fast LCP.
3. **Índice de habitaciones.** A numbered list of room *types*: number, name, capacity, "desde $…" or "Consulta la tarifa", and an arrow. Desktop hover or focus shows a floating 3:4 plate; mobile shows inline plates. All amenities collapse into one line: "Todas con baño privado, TV, ventilador y Wi-Fi".
4. **Notas de campo (services).** Hand-drawn single-stroke illustrations (solar panel, water tank, Wi-Fi waves over a bamboo stalk, key) with handwritten-style labels set in Instrument Serif italic. Each draws itself on scroll. Text explains *why it matters in Mocoa*, with copy confirmed by the hotel.
5. **Colofón (footer).** A quiet, centred closing line ("Te esperamos en Mocoa"), contact in large serif italic, a legal row, and the RNT badge line. A full-width outlined wordmark sits at the very bottom.

### Motion signature: "ink settling"

Slow and calm, 0.9–1.2 s with `power3.out`. The motion is limited to four moments:

- The hero headline reveals **line by line through a mask** (SplitText `mask: "lines"`).
- Plates reveal with `clip-path: inset(0 0 100% 0) → inset(0)` and an inner `scale 1.12 → 1`, once each.
- Bamboo strokes and service illustrations **draw** (`stroke-dashoffset`).
- The room index preview follows the pointer with `gsap.quickTo` (desktop, fine pointer only).

There is no pinning except one optional sticky "Sobre nosotros" (CSS sticky plus image cross-fade). No Lenis by default; re-evaluate in the prototype. Reduced motion: everything is static and visible.

### Portrait photos

They are always plates (3:4) at ≤ 720 px rendered width on desktop. Staggered pairs carry the story sections, and the diptych carries the hero. The gallery is a 3-column masonry of single-ratio plates with captions. The lightbox shows the photo at its native 960 px max over paper, not black. The sign photo (#35) appears as a small plate in the "Sobre nosotros" margin as "el letrero", a nod to the brand origin.

### Home, section by section

| # | Section | Content and layout |
|---|---|---|
| 0 | Header | Logo left (outlined SVG), centred menu links (desktop) or a "Menú" text button (mobile), "Escríbenos" pill right. Transparent over paper, solid paper + hairline after scroll. Hides on scroll down. |
| 1 | Hero díptico | Kicker "Hotel en Mocoa, Putumayo" · H1 in two lines (approved tagline, or "Descanso, comodidad y confianza en el corazón de Mocoa") · primary CTA + "Ver habitaciones" · plates #9 + #11 (or #13 + #37). |
| 2 | Declaración | Full-width serif statement on paper, facts only: "16 habitaciones. Paneles solares. Reserva de agua. Internet en todos los pisos." A bamboo stroke draws under it. |
| 3 | 01 — Sobre nosotros | Staggered plates (corridor, lounge) + 2–3 short paragraphs (mission text once approved). Margin note with the sign plate. |
| 4 | 02 — Habitaciones | The Índice de habitaciones + shared amenities line + link to `/habitaciones`. |
| 5 | 03 — Notas de campo | The illustrated services on one `bamboo-900` "night" band: drawings in `bamboo-300`, text in sand. |
| 6 | 04 — Láminas | A selected 6-plate gallery with captions, a horizontal scroll-snap strip on mobile, and a "Ver galería completa" link. |
| 7 | 05 — Cómo llegar | Typographic address block, a consent-gated map button, and a simple SVG "route" line drawing to a pin. Nearby places only when confirmed. |
| 8 | 06 — Preguntas | 3–5 FAQ in an accessible accordion, two-column on desktop. |
| 9 | Contacto / Colofón | Big closing statement + WhatsApp CTA, then the footer (contact in serif italic, nav, legal, RNT, outlined wordmark). |

### Moodboard (captured screenshots)

The captures are transient (not committed, see [`design-research.md`](./design-research.md#screenshot-and-copyright-policy)). Each row names the reference; [`design-references.md`](./design-references.md) gives its URL and describes what the capture showed.

| Screenshot | What it inspires |
|---|---|
| `casaangelina-d-fold`, `casaangelina-d-s2` | Spanish editorial tone, numbered kickers, italic accent word, honest room spreads |
| `odisej-d-s2`, `odisej-d-s4` | Giant serif statement band, numbered room index |
| `paradero-d-fold`, `gal-onepagelove-hotel-1` (Delparco), `gal-awwwards-hotel-restaurant-1` (Casa Momo) | Portrait diptych hero |
| `etthem-d-fold`, `rochesrouges-d-s2` | Ink illustration as identity; hand-drawn service labels (Notas de campo) |
| `silena-d-s2`, `magicui-text-reveal-1` | Factual statement band with a scrubbed word reveal (Declaración) |
| `codrops-demos-scroll-1` (CANOPY, The Living Ridge) | Misty torn edge (static SVG) and editorial plates |
| `codrops-demos-clip-path-1` | Plate clip-path reveal |
| `habitas-d-fold` | Film grain over imagery |
| `gal-onepagelove-hotel-1` (Eagle's Nest) | Editorial data table + map for "Cómo llegar" |

### Risks

- An editorial look can read as "slow" to a WhatsApp-first audience. Mitigation: the CTA is visible in the header and the FAB at all times, and the first viewport always carries the CTA.
- Instrument Serif is display-only. At small sizes it looks thin, so enforce a ≥ 28 px minimum in tokens and lint.
- Hand-drawn illustrations need a consistent hand. Budget 4–6 SVGs drawn in one session, or a single tracing pass from photos; never mix icon sets.
- Captions need real data (room floor, name). If the hotel cannot map photos to rooms, captions fall back to generic labels ("Habitación de pareja").

---

## Direction B — "Letrero y Madera" (crafted signage, warm-dark)

**One line:** the hotel's own green sign and wooden staircase, scaled up into an identity. Stacked condensed letters, warm wood tones, night-green bands, round stamped buttons.

### Mood

Warm, confident, a bit nocturnal and tactile, like arriving at night under the lit green sign after a rainy drive into Mocoa. Budget-friendly *and* proud of it, in the spirit of Kex Hostel and Freehand, which make inexpensive stays feel crafted. More energy than A, still not "jungle resort".

References: Kex Hostel (diptych "HOSTEL / HOTEL" hero, condensed caps + typewriter body, round "Book a stay" button, engraved illustration, wall-texture background), Freehand (condensed caps, tilted paper card, vertical "Book a room" side tab), Casa Cook (condensed headings + mono details, earthy dark bands), Silena (circular CTA bubbles), the hotel's own vertical stacked "HOTEL" sign.

### Typography

| Role | Font | Detail | Cost (latin) |
|---|---|---|---|
| Display (stacked headings, numbers, nav in caps) | **Big Shoulders Display** (variable 600–800) | Condensed, built for signage. Used in caps, stacked vertically ("HO / TEL") echoing the real sign. Display only, ≥ 32 px. | 35.4 KB |
| Text / UI | **Manrope** (keep) | 400 / 500 / 600. Small caps-style labels with tracking. | 24.5 KB |
| **Total** | | | **≈ 60 KB vs 145 KB today** (−59 %) |

Alternative display face: Bricolage Grotesque static 700, opsz 96 (22.4 KB), which is warmer and less condensed. Fraunces can stay *only* inside the outlined logo SVG, at zero font cost.

Scale: display `clamp(3.5rem, 11vw, 11rem)` with `line-height .85`; stacked word blocks; H2 `clamp(2.5rem, 6vw, 5.5rem)`; body 17 px.

### Palette use

| Role | Token | Note |
|---|---|---|
| Night (dark sections, about 40 % of the page) | new **`bamboo-950 #0D2A20`** + `bamboo-900` | Hero, services and footer bands |
| Sign green | `bamboo-500 #3B8F69` → large display on dark, "glow" accents | 3.88:1 on `bamboo-950`: large text (≥ 24 px) only, see § Computed contrast |
| Wood | new **`madera-600 #7A4526`** (from the staircase in photos #9/#13; sample during R2) | Round CTA stamps, rules, hover fills (white text 7.76:1 ✓; on night bands the stamp needs a cane/sand ring, 1.98:1 otherwise) |
| Cane | `cane-500` on dark (5.48:1 on `bamboo-900`) | Numbers, kickers |
| Paper | `sand-50` / `sand-100` | Light reading sections (rooms, FAQ) |
| Ink | `ink-900` | Body on light |

### Layout system

- 12-column grid with **full-bleed bands** alternating night and paper. The rhythm is set by large stacked type blocks that bleed off the grid edge.
- A **vertical sign rail.** On desktop, a fixed left rail shows the section name in vertical stacked letters (like Kex's vertical K-E-X). On mobile it becomes a top progress label.
- Cards use square corners (radius 2–4 px) for an architectural, signage feel. Round shapes are reserved for CTA stamps.
- Section dividers are **bamboo segments**: a straight rule with node marks every N px (CSS `repeating-linear-gradient` or SVG).

### Signature components

1. **Hero letrero.** Night background, a giant stacked "HOTEL / BAMBÚ / PLAZA" (outlined logo + condensed type) on the left, and a tall framed plate on the right (corridor #9) with a subtle green "neon" edge glow (static `box-shadow`, no animation). Mobile: stacked letters above a full-width plate.
2. **Sello CTA.** A round 112–140 px wood-coloured stamp, "Escríbenos · WhatsApp", with circular text around a glyph. It doubles as the FAB after the hero. Rotation on hover only, and paused on reduced motion.
3. **Tablero de habitaciones.** Room types as tall 3:4 cards on paper. A condensed caps name ("PAREJA", "INDIVIDUAL"), a big tabular number for capacity, the price line, and a tilted paper "etiqueta" tag (−2°) with the shared amenities.
4. **Franja de datos (facts strip).** A night band with huge condensed numerals and words: "16 HABITACIONES · SOLAR · AGUA DE RESERVA · INTERNET EN TODOS LOS PISOS". On desktop it scrolls as a slow marquee (pausable, WCAG 2.2.2); on mobile and reduced motion it is static and stacked.
5. **Escalera (sticky story).** On desktop, a pinned tall plate of the wooden staircase (#13) while three short story steps scroll beside it. The plate's `clip-path` widens step by step (Codrops-style pinned mask reveal). Mobile is stacked with no pin.

### Motion signature: "sign switching on"

Snappier, 0.5–0.8 s with `power4.out` and `expo.out`:

- Stacked hero letters **rise per row** from a mask, and the sign-green accent "switches on" (opacity 0 → 1 with a 2-step flicker done once, *off* under reduced motion).
- One pinned **clip-path expand** (Escalera), desktop only.
- The facts marquee runs with a pause button.
- Room cards **tilt their tag** slightly on hover or focus.

Lenis is optional (`pointer: fine` only) to give the pinned sequence weight. Decide after the R2 prototype measures INP and long tasks.

### Portrait photos

Always framed, never full-bleed: tall plates with a 1 px cane hairline frame, or with the green glow edge on night bands. Photos sit beside large type, so the *type* carries the width and photos never need to stretch. The gallery is a horizontal pinned strip on desktop (≤ 8 plates, keyboard-reachable), a scroll-snap carousel on mobile, and a full grid on `/galeria`.

### Home, section by section

| # | Section | Content and layout |
|---|---|---|
| 0 | Header | Night; logo-on-dark left; menu in condensed caps; "Escríbenos" in wood. Over the hero it is transparent; on paper sections it becomes sand. |
| 1 | Hero letrero | Stacked name + kicker "Mocoa · Putumayo" + one-line promise + Sello CTA + "Ver habitaciones". Plate #9. |
| 2 | Franja de datos | The verified facts in giant condensed type (marquee/static). |
| 3 | Escalera / Sobre nosotros | Pinned staircase plate + 3 story steps (mission, location, care). |
| 4 | Habitaciones | Tablero cards on paper (2–4 types) + "Ver todas". |
| 5 | Servicios | Night band, a 3-column grid of big numerals ("01 Solar", "02 Agua", "03 Internet") with short real copy and an engraved-style illustration (single SVG). |
| 6 | Galería | Pinned horizontal strip (desktop) or scroll-snap (mobile). |
| 7 | Ubicación | A stacked "CALLE 8 / # 7-10" address block in display type (once confirmed) + consent-gated map + "Cómo llegar". |
| 8 | FAQ | Paper, a condensed caps question list. |
| 9 | Footer | Night, a giant full-width wordmark, Sello CTA, nav, legal, RNT. |

### Moodboard (captured screenshots)

| Screenshot | What it inspires |
|---|---|
| `kex-d-fold`, `kex-d-s2`, `kex-m-fold` | Interior-only photos made atmospheric, a round stamp CTA, a vertical letter rail, engraved illustration, texture |
| `freehand-d-fold`, `freehand-d-s2` | Condensed caps voice, tilted paper tag, vertical side tab |
| `casacook-d-s4` | Condensed headings + mono details on earthy bands |
| `gal-dribbble-boutique-hotel-landing-1` (LU/MIÈ/RE) + hotel sign photo #35 | Stacked giant letters (Hero letrero) |
| `silena-d-fold`, `gal-onepagelove-hotel-2` (Water Rat) | Circular CTA bubbles and stamps (Sello CTA) |
| `gal-behance-eco-lodge-website-1` (Hostal) | Stamp + kraft craft identity for a budget stay |
| `gal-behance-hotel-website-1` (Madinat) | Deep green + serif/script palette on dark |
| `aceternity-parallax-scroll-1`, `aceternity-sticky-scroll-reveal-1` | Portrait parallax columns (gallery), sticky story (Escalera) |
| `codrops-demos-clip-path-1` | Pinned clip-path expand |
| `magicui-marquee-1` | Facts strip marquee (with a pause button) |

### Risks

- **Heavier motion.** Pinning plus marquee plus a horizontal strip is three scroll-driven systems. Each one needs a mobile-off switch and a performance check on a mid-range Android (req. 8.3). Most likely to miss the INP/long-task budget.
- Dark sections plus phone photos with colour casts (lime and red bedspreads) can clash. The grade must be consistent, and lime-bedspread photos should stay on paper sections.
- The condensed caps voice can tip into "hostel / nightlife", which may not suit the business and family audience in the hotel's mission. Keep the copy calm.
- New tokens (`bamboo-950`, `madera-600`) pass contrast for their briefed uses (see § Computed contrast) but need hotel approval of the evolved palette.

---

## Computed contrast for the proposed colours

Computed 2026-11-04 with the WCAG 2.x relative-luminance formula (a script, not estimates). AA needs 4.5:1 for normal text, and 3:1 for large text (≥ 24 px, or ≥ 18.66 px bold) and for UI component boundaries (1.4.11). New or changed colours: **paper `#F4EEE1`** (A), **`bamboo-950 #0D2A20`** and **`madera-600 #7A4526`** (B).

| Dir. | Foreground | Background | Ratio | Result | Use |
|---|---|---|---|---|---|
| A | `ink-900` #1A1F1C | paper #F4EEE1 | 14.45:1 | AA | Body, display |
| A | `ink-600` #56605A | paper #F4EEE1 | 5.65:1 | AA | Muted text |
| A | `bamboo-900` #12392B | paper #F4EEE1 | 11.04:1 | AA | Headings, links |
| A | `bamboo-700` #1D6247 | paper #F4EEE1 | 6.28:1 | AA | Links; CTA fill boundary |
| A | white | `bamboo-700` #1D6247 | 7.27:1 | AA | Primary CTA label |
| A | white | `bamboo-900` #12392B | 12.76:1 | AA | CTA on the night band |
| A | paper #F4EEE1 / `sand-50` #F7F3EA | `bamboo-900` #12392B | 11.04:1 / 11.52:1 | AA | Text on the night band |
| A | `bamboo-300` #8EC3A4 | `bamboo-900` #12392B | 6.37:1 | AA | Illustration labels on night |
| A | `cane-500` #C9A55C | `bamboo-900` #12392B | 5.48:1 | AA | Numbers on night |
| A | `cane-700` #8A6A2B | paper #F4EEE1 | **4.35:1** | **Large only** | Plate numbers. It passes on `sand-50` (4.54:1) but **fails AA for small text on the warmer paper**. |
| A | `earth-600` #A8582F | paper #F4EEE1 | **4.43:1** | **Large only** | Stamp mark. Passes on `sand-50` (4.62:1). |
| A | white | `earth-600` #A8582F | 5.12:1 | AA | Promotion badge label |
| A | `bamboo-500` #3B8F69 | paper #F4EEE1 | 3.41:1 | Large / non-text only | Illustration strokes |
| B | `sand-50` #F7F3EA | `bamboo-950` #0D2A20 | 13.85:1 | AA | Body on night |
| B | white | `bamboo-950` #0D2A20 | 15.34:1 | AA | Display on night |
| B | `bamboo-500` #3B8F69 | `bamboo-950` #0D2A20 | **3.88:1** | **Large only** | Sign-green display (≥ 32 px, as briefed) |
| B | `bamboo-500` #3B8F69 | `bamboo-900` #12392B | 3.23:1 | Large only | Same, on the lighter night |
| B | `bamboo-300` #8EC3A4 | `bamboo-950` #0D2A20 | 7.66:1 | AA | Small green text on night |
| B | `cane-500` #C9A55C | `bamboo-950` / `bamboo-900` | 6.59:1 / 5.48:1 | AA | Kickers, numbers |
| B | white | `madera-600` #7A4526 | 7.76:1 | AA | Sello CTA label |
| B | `sand-50` #F7F3EA | `madera-600` #7A4526 | 7.01:1 | AA | Sello CTA label (warm) |
| B | `madera-600` #7A4526 | paper #F4EEE1 / `sand-50` | 6.71:1 / 7.01:1 | AA | Wood text and rules on paper |
| B | `madera-600` #7A4526 | `bamboo-950` #0D2A20 | **1.98:1** | **Fail** (also < 3:1 non-text) | A wood stamp on a night band has no visible boundary |
| B | `ink-900` / `ink-600` | `sand-100` #EEE7D8 | 13.57:1 / 5.30:1 | AA | Paper reading sections |

Consequences:

1. **A:** if the page moves to paper `#F4EEE1`, small cane text needs a darker step, **`cane-750 #836428`** (4.76:1 on paper). For the stamp, either keep `earth-600` at ≥ 24 px or use **`earth-650 #A0532C`** (4.82:1). Otherwise keep `sand-50` as the page colour.
2. **B:** the Sello CTA on night bands needs a `cane-500` or `sand-50` ring (≥ 2 px) so the control boundary reaches 3:1 (1.4.11). Its label is fine. Sign green on night stays display-only (≥ 24 px), as briefed.
3. All other proposed pairs pass AA for normal text.

## v1 LCP baseline (measured)

Measured 2026-11-04 to test the claim that "the font is the LCP cause". Lighthouse 13.6.0, mobile defaults (simulated slow 4G and 4× CPU throttle), Chromium from the Playwright 1.64.1 image, run in Docker against the local production build (`next start`) at `http://localhost:3000/habitaciones/demo-habitacion-pareja-101`. The host CPU was shared, so TBT varied a lot between runs; read the numbers as ranges.

| Run | Fonts | Score | LCP (simulated) | TBT | CLS | Page bytes |
|---|---|---|---|---|---|---|
| 1 | loaded | 80 | 4.26 s | 270 ms | 0 | 553 KB |
| 2 | loaded | 48 | 5.60 s | 1,983 ms | 0 | 551 KB |
| 3 | loaded | 57 | 5.24 s | 1,199 ms | 0 | 553 KB |
| 4 | blocked (`--blocked-url-patterns=*.woff2`) | 64 | 4.51 s | 838 ms | 0 | 409 KB |
| 5 | blocked | 92 | 3.31 s | 78 ms | 0 | 412 KB |

Findings:

- **The LCP element is an image, not text.** In all five runs it is the first room photo (`img.room-card-img`, a 49.4 KB AVIF at 960 px, `fetchpriority="high"`, `loading="eager"`, discoverable in the initial HTML).
- **Font transfer: 146.5 KB** per page (Fraunces 121.4 KB + Manrope 25.1 KB, latin woff2). Both are **preloaded** through the HTTP `Link` header, so on a slow mobile link they compete with the LCP image for bandwidth. They are 26 % of the page's 553 KB.
- With fonts blocked, simulated LCP was 3.3–4.5 s, against 4.3–5.6 s with fonts (median 5.24 s with fonts vs a 3.91 s mean of the two blocked runs). The direction is consistent, but TBT noise (78–1,983 ms) is of the same order, so the size of the gain is indicative, not proven.
- The home page (`/`) scored 100 with LCP 1.06 s, TBT 68 ms and CLS 0. Its LCP element on a fresh mobile visit is the **consent banner text**, not the hero, so the home is not a useful LCP test until consent is stored.

Verdict: the statement "the font is the LCP cause" is **refuted as worded**. The LCP element is the room image. The 146.5 KB of preloaded fonts is a **contributing cause** through bandwidth competition, and main-thread work (TBT) is a second one. The font fix in § Shared ground rules stays worthwhile (−53 to −59 % font bytes), and the R2 prototypes must also keep the LCP image first in the queue: preload only the display face, and do not preload the body face.

## Scoring rubric for the owner (A vs B)

Score each criterion 1–5 for each prototype after viewing it on a phone and on a computer, then multiply by the weight. The higher total wins. A tie goes to the lower performance risk.

| Criterion | Question for the owner | Weight |
|---|---|---|
| Feels like our hotel | Does it look like Bambú Plaza in Mocoa, not a generic hotel? | 3 |
| Honest | Would a guest who arrives feel the site promised what they find? | 3 |
| Makes people write | Is "Escríbenos por WhatsApp" obvious on the phone within the first screen? | 3 |
| Photos look good | Do our room photos look cared for, not cramped or stretched? | 2 |
| Easy to read | Can older guests read rooms, prices and contact on a phone? | 2 |
| Memorable | Would you recognise it again after one visit? | 2 |
| Speed (measured, not judged by the owner) | Prototype Lighthouse mobile (LCP, TBT, CLS) against the v1 baseline: 5 = better than v1, 3 = equal, 1 = worse | 2 |
| Upkeep | Can the hotel keep it fresh with its own photos and short texts? | 1 |

Maximum: 90 points.

## Copy needing hotel approval

Only texts that state facts or speak for the hotel. Generic UI labels ("Ver habitaciones", "Menú") need no approval.

| # | Text (Spanish, as proposed) | Used in | Why it needs approval |
|---|---|---|---|
| 1 | "Descanso, comodidad y confianza en el corazón de Mocoa" (tagline seen on a framed print) | A and B hero H1 or promise | Brand claim; confirm it is current |
| 2 | "Hotel en Mocoa, Putumayo" / "Mocoa · Putumayo" | Kickers | Location claim |
| 3 | "16 habitaciones. Paneles solares. Reserva de agua. Internet en todos los pisos." | A Declaración; B Franja de datos | Facts; confirm wording and that all are current |
| 4 | "Todas con baño privado, TV, ventilador y Wi-Fi" | Room index / cards | Must be true for every room (see `amenity-model.md` § 3.4) |
| 5 | Short "why it matters in Mocoa" lines for solar power, water reserve and internet | A Notas de campo; B Servicios | Explains hotel services; no implied guarantees |
| 6 | "Calle 8 # 7-10" and how-to-arrive directions | Cómo llegar / Ubicación | Address seen in photos; confirm |
| 7 | Mission text (framed print) or a 2–3 sentence "Sobre nosotros" | Sobre nosotros / Escalera | Speaks for the hotel |
| 8 | "Te esperamos en Mocoa" | A Colofón | Closing line and tone |
| 9 | Photo captions ("Lám. 04 — Habitación de pareja, segundo piso") | A plates | Room, floor and type must be correct |
| 10 | "Escríbenos · WhatsApp" with the number 310 679 8260 | CTA / Sello | Confirm it is the booking WhatsApp |

## Comparison

| Criterion | A — Cuaderno de Mocoa | B — Letrero y Madera |
|---|---|---|
| Memorability | High (plates, illustrations, voice) | High (sign typography, stamps) |
| Fit with modest portrait photos | **Best**: captions and frames make them intentional | Good: type carries the width, but dark bands expose colour casts |
| Honesty / no luxury overclaim | **Best** | Good |
| Audience (business + family, WhatsApp-first) | Calm, trustworthy | Energetic; risk of a hostel vibe |
| Performance risk | Low (CSS + light GSAP, no pin except optional sticky) | Medium (pin + marquee + horizontal strip) |
| Font payload (latin) | ≈ 68 KB | ≈ 60 KB |
| Extra assets needed | 4–6 hand-drawn SVGs | 1–2 engraved illustrations, stamp SVG, wood colour sampling |
| Build effort (R3–R5) | Medium | Medium-high |

## Recommendation

**Build both as R2 prototypes (home hero + rooms + services, desktop and mobile), and lead with A, "Cuaderno de Mocoa".** It answers the owner's "too basic and flat" with a clear point of view, without leaning on things the hotel cannot show. Weak photos become curated plates, and the services that set the hotel apart (solar, water, internet) become the illustrated story. It also has the lowest performance and accessibility risk.

From B, carry **one** moment into A if the owner wants more energy: the **stacked sign typography** as the statement band (section 2), which ties the site to the real green sign. Choose B outright only if the owner explicitly wants a bolder, more nocturnal brand voice and accepts the extra motion budget.

Whichever wins, ship the font fix first (it is independent of the direction): drop Fraunces `axes: ['SOFT','opsz']` → **−53 to −59 % font bytes**, which reduces a contributing cause of LCP (bandwidth competition with the image; gain indicative, not proven) (see § v1 LCP baseline: the LCP element is the room photo, and fonts compete with it for bandwidth).
