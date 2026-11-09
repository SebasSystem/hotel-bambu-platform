# Mockup design spec (Hotel Bambú Plaza)

**Source:** local clone `../hotel-bambu-aleixein` (github.com/Aleixein466/Hotel-Bambu), a static Vite prototype.
Files: `index.html` (shell, header, logo, drawer, lightbox), `src/legacy.js` (all views as innerHTML strings, hash routes),
`src/styles.css` (358 lines, the only stylesheet), `public/assets/` (3 AI concept PNGs and the favicon).
Line references below are `styles.css:N`, `legacy.js:N` and `index.html:N` in that clone.

**Goal (task D0 of `odd/tasks/public-site-redesign.md`):** rebuild this look inside `apps/web`, matching it or doing better,
with real API data and real routes. This document is the contract for D1 to D4.

**Captures:** 37 PNGs at 1440 px and 390 px wide, saved only in the session scratchpad (`.../scratchpad/mockup/`), not in
any repo. Names are `<width>-<view>.png`. R7 deletes them at feature close.

> **Assets and licensing.** The three mockup images (`hero-exterior-concept.png`, `room-concept.png`,
> `common-area-concept.png`) are AI-generated concept renders, and the mockup labels them on screen
> ("Imagen conceptual · reemplazar por foto real"). **Do not copy, import or reference them.** The platform's real photos
> (MediaAsset, RoomImage, GalleryItem) replace them. The logo SVG and the favicon are simple geometric marks drawn in the mockup.
> We re-implement them as a code component (see §2). Confirm with the owner that the mark is theirs to use (open question Q1).

---

## 1. Design tokens

### 1.1 Color palette (`styles.css:1-11`)

| Token | Hex / value | Role |
|---|---|---|
| `--green` | `#315c45` | Brand primary: primary button, eyebrow text, links, fact numbers, nav underline, `theme-color` (`index.html:6`, `#315C45`) |
| `--green-900` | `#183b2c` | Deep green: rooms-showcase band, admin sidebar, hero fallback bg (`styles.css:67`), primary button hover |
| `--sage` | `#a8bea0` | Accent on dark: eyebrows on green, occupancy bars, favicon leaves |
| `--ivory` | `#f8f6f0` | Page background, `.price-pending` bg, admin task bg, logo "cut" stroke |
| `--paper` | `#fffdf8` | Card surface: room card, contact card, light button, icon button, mobile menu, drawer |
| `--sand` | `#e8ddc7` | Page-hero band (inner pages), sustainability panel, gallery tile placeholder |
| `--charcoal` | `#26312b` | Body text, dark button, active chip, footer bg, toast, skip link |
| `--gold` | `#c8a66a` | Focus outline, checklist task dot, map glow |
| `--muted` | `#6d756f` | Secondary text |
| `--line` | `rgba(38, 49, 43, 0.14)` | All 1 px borders and dividers |

Literal colors used outside the tokens. Promote the ones we keep into tokens:

| Value | Where (styles.css line) | Proposed token |
|---|---|---|
| `#e2eadf` | amenity icon circle bg (117) | `--green-50` |
| `#edf4ea` | `.state` default pill bg (237) | `--green-50` (merge) |
| `#edf3ea` / `#365441` | `.notice` bg / text (266) | `--notice-bg` / `--notice-fg` |
| `#fff2d9` / `#7c5917`, `#755715` | `.state.gold`, `.notice.warning` (239, 268) | `--warn-bg` / `--warn-fg` |
| `#fff4d8` / `#755615` | `.demo-badge` (208), excluded | n/a |
| `#ececea` / `#656b67` | `.state.gray` (238) | `--neutral-bg` / `--neutral-fg` |
| `#8a6a33` | `.pending` text (190) | `--warn-fg` (merge) |
| `#a23838` | `.form-error` (275) | `--danger` |
| `#246f49` | WhatsApp FAB bg (281) | `--whatsapp` |
| `#59645d` | sustainability paragraph (123) | use `--muted-strong` |
| `#56625a` | page-hero paragraph on sand (151) | `--muted-strong` |
| `#d4ddce` | hero eyebrow on photo (74) | `--on-dark-muted` |
| `#f3f2ed` | admin layout bg (196) | `--admin-bg` |
| `#f7f7f4` | calendar head bg (242), excluded | n/a |
| `#aeb7b0` | upload-zone dashed border (251) | `--line-strong` |
| `#d8dcd8` | stepper track (259), excluded | n/a |
| `white` | admin panels, inputs, topbar (85, 206, 214, 219) | `--surface` (#fff) |

Overlays and gradients (copy exactly):
- Hero desktop (`styles.css:72`): `linear-gradient(90deg, rgba(13,31,22,.8) 0%, rgba(13,31,22,.36) 50%, rgba(13,31,22,.08) 80%), linear-gradient(0deg, rgba(8,20,14,.5), transparent 40%)`
- Hero ≤760 (`styles.css:306`): `linear-gradient(0deg, rgba(10,28,19,.92) 10%, rgba(10,28,19,.18) 80%)`
- CTA panel (`styles.css:137`): `linear-gradient(90deg, rgba(16,44,31,.94), rgba(16,44,31,.25))` over a cover image
- Map placeholder (`styles.css:191`): `radial-gradient(circle at 68% 35%, rgba(200,166,106,.52), transparent 12%), linear-gradient(135deg, #cbd8c5, #8fac8e 42%, #315c45)`
- Modal backdrop (`styles.css:254`): `rgba(15,26,20,.58)` + `backdrop-filter: blur(5px)`
- Glass chips on photos: `rgba(17,31,24,.68)` + `blur(8px)` (gallery label, 134); `rgba(18,32,24,.35)` + `blur(10px)` (carousel buttons, 79); `rgba(255,255,255,.88)` + `blur(8px)` (status pill, 161)
- Text on dark: `rgba(255,255,255,.86)` hero copy (76), `.78` CTA copy (140), `.67` showcase copy (103), `.64` footer text (144), `.45` footer bottom (147)

### 1.2 Typography

Families (`styles.css:14-15`, loaded at `index.html:12`):
- `--serif: "Gilda Display", Georgia, serif`, weight 400 only. Used for h1/h2/h3, wordmark, fact numbers, carousel index.
- `--sans: "DM Sans", system-ui, sans-serif`. The Google CSS requests weights 400;500;600;700. The CSS also uses **800**
  (`.status-pill` 161, `.detail-block h3` 176, `.state` 237, calendar 242-243, stepper 258, FAB 281, active editor nav 249).
  800 is never loaded, so the browser synthesizes it. **D1:** self-host DM Sans 400/500/600/700, map 800 to 700 (or load 800),
  and self-host Gilda Display 400 with `next/font` (`display: swap`, Latin subset with Spanish accents).

Base: `body { line-height: 1.55 }` (20). Root 16 px. Headings `font-weight: 400; line-height: 1.05` (27).

| Element | Font | Size | Line-height | Letter-spacing | Weight | Measured at 1440 | At 390 |
|---|---|---|---|---|---|---|---|
| `h1` (28) | serif | `clamp(3rem, 7vw, 6.7rem)` | 1.05 | `-.045em` | 400 | 100.8 / 105.8 px | 48 px |
| Hero `h1` ≤760 (305) | serif | `clamp(3.5rem, 16vw, 5.6rem)` | 1.05 | `-.045em` | 400 | n/a | 62.4 px |
| Page-hero `h1` (150) | serif | `clamp(3.3rem, 7vw, 6.5rem)` | 1.05 | `-.045em` | 400 | 100.8 px | 52.8 px |
| Room detail `h1` (173) | serif | `clamp(3.3rem, 6vw, 5.6rem)` | 1.05 | `-.045em` | 400 | 86.4 px | 52.8 px |
| `h2` (29) | serif | `clamp(2.25rem, 4.8vw, 4.5rem)` | 1.05 | `-.035em` | 400 | 69.1 / 72.6 px | 36 px |
| Drawer `h2` (257), excluded | serif | `2.55rem` | 1.05 | `-.035em` | 400 | | |
| `h3` (30) | serif | `1.55rem` (24.8 px) | 1.05 | normal | 400 | 24.8 / 26 px | same |
| Room feature `h3` (108) | serif | `clamp(2.2rem, 4vw, 4rem)` | 1.05 | normal | 400 | 57.6 px | 35.2 px |
| Fact number (98) | serif | `2.35rem` | 1.55 | normal | 400 | 37.6 px | same |
| Wordmark (42) | serif | `1.14rem`; ≤760 `1rem` (301) | 1 | normal | 400 | 18.24 px | 16 px |
| Wordmark sub (43) | sans | `.58rem` | 1 | `.24em` | 400 | 9.28 px | same |
| Carousel index (80) | serif | `1.05rem` | 1.55 | normal | 400 | | hidden |
| Body | sans | `1rem` | 1.55 | normal | 400 | | |
| Hero copy (76) | sans | `clamp(1rem, 1.5vw, 1.22rem)` | 1.55 | normal | 400 | 19.5 / 30.3 px | 16 px |
| Intro / lead copy (95, 92, 151, 174) | sans | `1.06rem`, `1.04rem`, `1.08rem`, `1.05rem` | 1.55 | normal | 400 | ~17 px | same |
| Nav link (44) | sans | `.84rem` | 1.55 | normal | 600 | 13.44 px | |
| Mobile menu link (52) | sans | 1rem | 1.55 | normal | 600 | | |
| Button (55) | sans | `.88rem` | 1.55 | normal | 700 | 14.08 px | |
| Eyebrow (63) | sans | `.72rem` | 1.55 | `.16em`, uppercase | 700 | 11.52 px | |
| Room number / kicker (109) | sans | `.78rem` | 1.55 | `.15em`, uppercase | 700 | | |
| Detail block label (176) | sans | `.78rem` | 1.05 | `.12em`, uppercase | 800 | | |
| Chip (154) | sans | `.78rem` | 1.55 | normal | 700 | | |
| Amenity pill (111) | sans | `.77rem` | 1.55 | normal | 400 | | |
| Card copy (164, 119) | sans | `.84rem` / `.85rem` | 1.55 | normal | 400 | | |
| Card meta (165) | sans | `.75rem` | 1.55 | normal | 700 | | |
| Status pill (161) | sans | `.67rem` | 1.55 | normal | 800 | | |
| Gallery label (134) | sans | `.7rem` | 1.55 | normal | 400 | | |
| Footer text (144) | sans | `.83rem` | 1.55 | normal | 400 | | |
| Footer heading `h4` (145) | sans | `.74rem` | normal | `.12em`, uppercase | bold (UA) | | |
| Footer bottom (147) | sans | `.72rem` | 1.55 | normal | 400 | | |
| Form label (84) | sans | `.72rem` | 1.55 | normal | 700, `--muted` | | |
| Admin topbar `h1` (207) | sans | `1.2rem` | 1.05 | 0 | 700 | | |
| Admin heading `h2` (211) | sans | `1.7rem` | 1.05 | `-.02em` | 700 | | |
| Admin panel `h3` (221) | sans | `.96rem` | 1.05 | normal | 700 | | |
| KPI value (216) | sans | `2rem`; ≤760 `1.6rem` (340) | 1 | normal | bold | | |
| KPI label (215) | sans | `.74rem` | 1.55 | normal | 400 | | |
| Table (232, 234) | sans | `.8rem`; `th .67rem`, `.08em`, uppercase | 1.55 | | th bold | | |
| Admin pill `.state` (237) | sans | `.65rem` | 1.55 | normal | 800 | | |
| Toast (284) | sans | `.82rem` | 1.55 | | 400 | | |

### 1.3 Spacing

The mockup has no spacing scale. Values are ad hoc (7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 19, 20, 22, 24, 25, 26, 28, 30, 32, 40, 48, 56, 60, 70...).
Key layout values to reproduce:

- **Page gutter:** `clamp(20px, 6vw, 92px)` (sections 89, toolbar 152, room grid 156, footer 141). Header gutter `clamp(18px, 5vw, 76px)` (38).
- **Section vertical:** `clamp(80px, 10vw, 150px)` (89); ≤760: `78px 20px` (311).
- **Page hero:** `clamp(70px, 10vw, 130px) <gutter> 60px` (149).
- **Section head:** `max-width: 760px; margin-bottom: 48px`; h2 `margin-bottom: 18px` (90-91).
- **Card padding:** room card 22 (162), amenity 25 / ≤760 18 (115, 317), contact `clamp(28px, 4vw, 48px)` (186), feature `clamp(30px, 5vw, 64px)` (107).
- **Grid gaps:** room grid 22, amenity 16 / ≤760 10, gallery strip 12, masonry 14, contact 28, footer 40, buttons 8-12.

**D1 recommendation:** normalize to a 4 px scale (`4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 120, 150`) and snap each value
to the nearest step (9→8, 11→12, 13→12, 19→20, 22→24, 25→24, 26→24, 70→64). Keep the fluid clamps for gutter and section padding exactly.

### 1.4 Radii

| Value | Used by |
|---|---|
| `999px` | buttons, chips, pills, status pills, amenity list pills, FAB, labels on photos |
| `50%` | icon buttons (42 px), amenity icon (52 px), task dot |
| `32px` | room feature card, sustainability panel, CTA panel (≤760: 22) |
| `24px` (`--radius`, 13) | contact and map cards (186). The token exists but no rule references `var(--radius)`. |
| `22px` | room card (157), search bar (excluded) |
| `20px` | mobile menu panel (51) |
| `18px` | amenity card, gallery tile, map placeholder, lightbox image |
| `16px` | admin stat card, panel |
| `14px` | sustainability point, editor nav and form, upload zone |
| `12px` | inputs, price-pending, notice, task, toast |
| `10px` / `9px` | mobile menu links, admin nav buttons / editor nav buttons |
| `8px` | skip link, table thumbnail |

**D1 tokens:** `--radius-pill: 999px`, `--radius-xl: 32px`, `--radius-lg: 24px` (merge 22/24), `--radius-md: 18px` (merge 16/18/20),
`--radius-sm: 12px` (merge 12/14), `--radius-xs: 8px` (merge 8/9/10).

### 1.5 Shadows and borders

- `--shadow: 0 24px 70px rgba(25, 45, 35, 0.12)` (12): mobile menu, search bar.
- Card hover: `0 15px 40px rgba(28,48,38,.09)` (116).
- Drawer: `-20px 0 70px rgba(0,0,0,.18)` (255), excluded.
- WhatsApp FAB: `0 13px 35px rgba(16,67,40,.3)` (281).
- Borders: always `1px solid var(--line)`. The only exceptions are the upload zone `1.5px dashed #aeb7b0` (251) and the nav underline `1.5px` (46).
- Focus: `:focus-visible { outline: 3px solid var(--gold); outline-offset: 4px; }` (31). See the contrast defect in §5.

### 1.6 Breakpoints and containers

All breakpoints are `max-width`, desktop-first:
- `≤1000px` (287): hide desktop nav and header CTA, show the hamburger. Amenities and admin KPIs go to 2 columns, room grid to 2 columns. Room feature and room detail stack. Detail media becomes `position: relative; height: 60vh; min-height: 420px`.
- `≤760px` (297): mobile. Header 70 px, mobile hero, single-column grids, admin nav becomes a horizontal scroller.
- `≤420px` (348): amenities, KPIs, footer and field rows go to 1 column.

Containers: **there is no max-width page container.** Content spans the viewport minus the gutter. The only caps are:
hero content `min(900px, 92%)` (73), hero h1 `780px`, hero copy `560px`, section head `760px`, its p `650px`,
page-hero h1 `930px` and p `680px`, CTA content `620px`, lightbox `min(1040px, 94vw)`, drawer `min(540px, 100%)`.
**D1 recommendation:** wrap sections in a `max-width: 1440px` (content area ≈1256 px at the 92 px gutter) centered container.
Wide screens then look the same as at 1440.

Fixed heights: banner 34 px (excluded), header 78 px / 70 px at ≤760, admin topbar 74 px, admin sidebar 260 px.

### 1.7 Z-index

`.skip-link 1000` > `.toast 300` > `.booking-shell, .lightbox 200` > `.mobile-menu 90` > `.site-header 80` > `.whatsapp-fab 70`
> `.search-bar 8` > `.carousel-controls 4` > `.concept-label 3` > `.hero-content 2` > `.cta-panel > div 1`.
D1: define these as named tokens (`--z-header: 80` etc.).

### 1.8 Motion

| What | Property | Duration / easing | Line |
|---|---|---|---|
| Nav underline grows left→right | `right: 100% → 0` | `.25s ease` | 46-47 |
| Button hover lift | `transform: translateY(-2px)`, bg, color | `.2s ease` | 55-56 |
| Amenity card hover | `translateY(-5px)` + hover shadow | `.25s ease` | 115-116 |
| Room card image hover zoom | `scale(1.035)` | `.45s ease` | 159-160 |
| Gallery tile image hover zoom | `scale(1.04)` | `.5s ease` | 132-133 |
| Hero slide crossfade | `opacity 0 → 1` | `.8s ease` | 69-70 |
| Hero autoplay | interval **5500 ms**; restarts after manual nav; off when `prefers-reduced-motion` | | legacy.js:159-161 |
| Hero swipe | touch, threshold 45 px | | legacy.js:165-167 |
| Toast | `translate(-50%, 120px) → 0` + opacity, shown 3500 ms | `.3s ease` | 284-285, legacy.js:248 |
| Smooth scroll | `html { scroll-behavior: smooth }` | | 19 |
| Reduced motion | all durations → `.01ms`, `scroll-behavior: auto` | | 356-358 |

The header has **no** scroll state (no JS listener, no class). It is just `position: sticky` with translucent ivory
`rgba(248,246,240,.92)` + `backdrop-filter: blur(18px)` + bottom border (38). Capture: `1440-home-scrolled-header.png`.

---

## 2. Logo and favicon

**Composition:** the brand mark is a stylized bamboo stem: a rounded vertical bar with three leaves. Two horizontal "node"
strokes cut through the stem and are painted in the background color. The mark sits at 40×40 px. To its right, with an 11 px gap, is a two-line wordmark:
"Hotel Bambú" (Gilda Display 1.14rem) over "PLAZA · MOCOA" (DM Sans .58rem, tracking .24em, 5 px top margin).
`.brand { color: var(--green); min-width: 190px }` (39). The SVG uses `currentColor`, so the variant is set by the text color.

**Light variant (header on ivory)**, `index.html:23-28`:
```html
<svg class="brand-mark" viewBox="0 0 48 48" role="img" aria-label="Símbolo de bambú estilizado">
  <rect x="18" y="5" width="9" height="38" rx="4.5" fill="currentColor" />
  <path d="M12 17c7 0 10-4 11-10-7 0-11 3-11 10Zm15 11c7-1 11-5 12-12-8 0-12 4-12 12ZM8 32c7 0 11-3 13-10-8 0-12 3-13 10Z" fill="currentColor" opacity=".72" />
  <path d="M17 18h11M16 31h12" stroke="#F8F6F0" stroke-width="2.2" stroke-linecap="round" />
</svg>
<span class="brand-copy"><strong>Hotel Bambú</strong><small>PLAZA · MOCOA</small></span>
```

**Dark variant (footer on charcoal)**, `legacy.js:25-26`: same paths with `aria-hidden="true"`. `.footer .brand { color: var(--ivory) }` (143).
The node stroke is `stroke="#26312B"` (charcoal), so the cut matches the footer background.

**Admin variant**, `legacy.js:123`: the rect and the leaves only, **without** the node strokes, in white on `--green-900`.
The wordmark reads "Bambú Admin" / "PLAZA · DEMO".

**D1 implementation:** one `<BrandMark>` component with `stroke="var(--brand-cut, var(--ivory))"`. Each surface sets `--brand-cut`
to its background color (ivory, charcoal, green-900), so admin gets the cuts too. Make the SVG `aria-hidden` and put the accessible name
on the link only (the mockup names both, which is redundant). Wordmark text: `HotelProfile.name` split as "Hotel Bambú" and
"Plaza · {municipality}" (see Q2). Admin wordmark: "Bambú Admin" / "PLAZA · MOCOA".

**Favicon**, `public/assets/favicon.svg` (64×64):
```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="18" fill="#315C45"/>
  <rect x="27" y="9" width="11" height="47" rx="5.5" fill="#F8F6F0"/>
  <path d="M18 25c9 0 13-5 14-14-9 0-14 5-14 14Zm20 16c10-1 15-7 16-17-11 0-16 6-16 17ZM13 46c10 0 15-5 18-15-11 0-17 5-18 15Z" fill="#A8BEA0"/>
  <path d="M26 27h13M25 42h14" stroke="#315C45" stroke-width="3" stroke-linecap="round"/>
</svg>
```
D1: ship it as `app/icon.svg`. Also generate `apple-icon.png` (180) and a 32 px PNG fallback. Set `theme-color` to `#315c45`.

---

## 3. Component inventory

### Header (`index.html:21-48`, `styles.css:38-53`)
- **Desktop:** sticky at top 0, height 78, flex `space-between`. Left: brand. Center: nav with 4 links (Inicio, Habitaciones, Galería,
  Ubicación y contacto), gap 29, .84rem/600, padding 9 0. Hover and active state: a 1.5 px green underline 3 px from the bottom grows from the left.
  Right: `.button-dark` "Consultar estadía" (**→ WhatsApp**, see §6). Captures: `1440-home-viewport.png`, `1440-hover-nav.png`.
- **Mobile (≤1000):** the nav and CTA are hidden. A hamburger `.icon-button` (42 px circle, paper bg, line border, glyph `☰`) opens
  `.mobile-menu`: a fixed panel at `top: 112px` (104 at ≤760), 12 px side insets, paper bg, radius 20, `--shadow`, padding 18,
  links 13/12 padding, radius 10, hover ivory. Capture: `390-mobile-menu-open.png`.
- **Better:** recompute offsets without the banner (top = header height + 8). Swap the icon to ✕ when open. Close on Escape,
  outside click, route change and resize ≥1000. Trap focus while open. Lock scroll or use a backdrop. Add a subtle shadow
  once `scrollY > 8` (optional, owner taste). Keep the WhatsApp CTA visible on mobile as a compact icon button.

### Buttons (`styles.css:55-62`)
Base: min-height 46, padding 0 20, pill, 1 px transparent border, inline-flex gap 9, .88rem/700, hover `translateY(-2px)`.
- `button-primary`: white on `--green`; hover `--green-900`.
- `button-dark`: white on `--charcoal` (header CTA, active "Semana" toggle).
- `button-light`: charcoal on `--paper` (on photos and dark bands).
- `button-ghost`: charcoal text, `--line` border, transparent. On photos the hero uses an inline override `color:white; border-color: rgba(255,255,255,.4)` (legacy.js:52).
  **D1:** make it a variant, `ghost-on-dark`.
- Disabled: opacity .55, no transform. Compact: room card buttons min-height 40, padding 0 12, flex 1 (167).
- `icon-button`: 42 px circle, paper bg, line border, 1.4rem glyph (49). On photos: `rgba(18,32,24,.35)` bg, `rgba(255,255,255,.32)` border, blur 10 (79).

### Eyebrow (`styles.css:63-64`)
Inline-flex, gap 8, a 24×1 px leading rule (`::before`, currentColor), .72rem/700, tracking .16em, uppercase, `--green`, margin-bottom 16.
Variants: on the hero `#d4ddce`, on green bands `--sage` (inline style), on the map white.

### Hero carousel (`legacy.js:41-56`, `styles.css:67-81`)
- `min-height: calc(100svh - 112px)` (112 = banner 34 + header 78 → **use `100svh - 78px`**). Bg `#183b2c`, white text, `overflow: hidden`.
- Slides: absolutely stacked `<img object-fit: cover>`, crossfade .8s, gradient overlay `::after` (§1.1).
- Content: z 2, `width: min(900px, 92%)`, padding `clamp(70px,12vh,140px) clamp(24px,7vw,108px) 190px`, vertically centered,
  left aligned. Eyebrow "Mocoa · Putumayo", h1 (max 780, mb 22), copy (max 560), actions gap 12 mt 24: `button-light` + ghost-on-dark.
  The 190 px bottom padding exists to clear the quick-search bar. **Reduce it to ~120 px now that the search is removed.**
- Controls: bottom-right (`right: clamp(24px,6vw,90px); bottom: 136px`), prev ← / pause Ⅱ↔▶ / next →, gap 9.
  Index "01 / 03" in serif 1.05rem at bottom 95, total at opacity .55. At ≤760: content `justify-content: flex-end`,
  padding `60px 22px 215px`, `min-height: 760px`, controls `right 20 bottom 165`, index hidden.
- Behaviour: autoplay 5.5 s, pause toggle, swipe, reduced-motion start paused.
- **Better:** hide the controls when there is a single slide. Add `aria-roledescription="carousel"`, per-slide
  `aria-roledescription="slide"` + `aria-label="n de N"`, `aria-hidden`/`inert` on inactive slides, and pause on hover and focus.
  Make the pause button a real toggle (`aria-pressed`). Use Lucide `ChevronLeft/ChevronRight/Pause/Play`.
  Use `next/image` with `priority` on slide 1 only and lazy-load the rest. Captures: `1440-home-viewport.png`, `390-home-viewport.png`.

### Fact stack (`styles.css:96-99`)
A list with a top border. Each `.fact` is a grid `72px 1fr`, baseline aligned, padding 20 0, bottom border. The number is serif 2.35rem green.
The label is muted. **Defect:** 72 px is too narrow for "100%" and "24/7" (see §5).
**Better:** `grid-template-columns: minmax(96px, auto) 1fr; column-gap: 20px`.

### Sections and bands
- `.section` padding (89). `.section-head` (90-92).
- **Intro:** `.intro-grid` `.9fr 1.1fr`, gap `clamp(40px, 8vw, 120px)` (93). Left: eyebrow, h2, copy, ghost button. Right: fact stack.
- **Rooms showcase:** `--green-900` bg, ivory text (101). Its section head is flex `space-between`, aligned to the end: copy on the left, `button-light` on the right.
  `.room-feature`: grid `1.25fr .75fr`, min-height 560, paper, radius 32 (104). Image cover min 420. Copy padding `clamp(30px,5vw,64px)`, centered vertically:
  kicker (`.room-number`), h3 (clamp 2.2–4rem), text, `.amenity-list` pills (padding 8 11, line border, .77rem), price box (`.price-pending` ivory, radius 12), ghost + primary buttons.
- **Amenities:** `.amenities-grid` 4 columns, gap 16 (114). `.amenity-card` min-height 220, padding 25, paper, line border, radius 18,
  content spaced between: a 52 px icon circle (`#e2eadf` bg, green glyph), then h3 (mt 32 mb 8) and a .85rem muted p. Hover: lift 5 + shadow.
  Captures: `1440-hover-amenity-card.png`.
- **Sustainability:** wrapper padding `0 <gutter> <section-bottom>` (121). The panel is sand, radius 32, padding `clamp(32px,7vw,92px)`,
  grid `1.1fr .9fr`, gap 70 (122). Points: rows with padding 19, gap 14, `rgba(255,255,255,.52)` bg, radius 14, a 1.3rem green glyph, a bold title + small note (125-126).
- **Gallery strip:** grid `1.3fr .7fr .7fr`, rows `260px 260px`, gap 12. Tile 1 spans 2 rows, tile 4 spans columns 2–3 (128-131).
  Tiles: radius 18, sand bg, zoom-in cursor, hover zoom, glass caption bottom-left (134). Opens the lightbox.
- **CTA panel:** margin `0 <gutter> clamp(80px,8vw,120px)`, min-height 440, padding `clamp(38px,8vw,100px)`, content aligned to the end (bottom-left),
  radius 32, white text, background image + gradient via `::before` (136-140). The content is max 620: sage eyebrow, h2, .78 copy, `button-light`.

### Page hero (inner pages) and toolbar (`styles.css:149-155`)
- Sand band, padding `clamp(70px,10vw,130px) <gutter> 60px`. Eyebrow, h1 (max 930, mb 18), p (max 680, `#56625a`, 1.08rem).
- Toolbar: paper, bottom border, padding 20 gutter, flex `space-between`. Left: `.filter-chips` (gap 8). Right: a count ("16 habitaciones").
  ≤760: column layout.
- Chips: padding 9 13, line border, pill, transparent, .78rem/700. Active: charcoal bg, white text.
  **Better:** chips are a single-select filter. Use `aria-pressed` on buttons, or links with `?tipo=` so the filter is shareable and indexable, plus `aria-live="polite"` on the count.

### Room card (`legacy.js:97-99`, `styles.css:156-167`)
- Grid: 3 columns, gap 22, padding `48px <gutter> 110px`. ≤1000: 2 columns. ≤760: 1 column with 16 px side padding.
- Card: paper, line border, radius 22, overflow hidden. Image 4:3 cover with hover zoom 1.035. A status pill sits top-right (glass white, green .67rem/800).
- Copy padding 22: kicker (room name), h3 (type), muted .84rem text, meta row (gap 14, .75rem/700: "Hasta N · Baño privado · WiFi"),
  actions: ghost "Ver detalle" + primary "Consultar" (flex 1 each, min-height 40).
- Captures: `1440-rooms.png`, `1440-rooms-filter-*.png`, `390-rooms*.png`, `1440-hover-room-card.png`.

### Room detail (`legacy.js:101-105`, `styles.css:169-178`)
- Grid `1.25fr .75fr`, min-height `100svh - 112`. Left media is `position: sticky; top: 112px; height: calc(100svh - 112px)`
  (→ use 78). Right content on paper, padding `clamp(50px,7vw,100px) clamp(26px,6vw,84px)`.
- Content: back link (eyebrow style "← Todas las habitaciones"), kicker, h1, lead, then `.detail-block`s (padding 26 0, top border,
  label in sans .78rem/800 uppercase .12em): Capacidad, Servicios (`.feature-list` 2 columns with green ✓), Tarifa (price box),
  ~~Disponibilidad~~ (excluded), primary CTA.
- ≤1000: stacked. Media becomes relative, 60vh, min 420. ≤760: the feature list goes to 1 column.
- **Better:** a multi-image media area (RoomImage[]) with thumbnails and the lightbox, a breadcrumb, the footer (the mockup omits it),
  check-in/out times and a policies link, beds and area, and "Otras habitaciones" cards. Captures: `1440-room-detail.png`, `390-room-detail.png`.

### Gallery page (`legacy.js:107-116`, `styles.css:180-183`)
Page hero, toolbar with category chips, then `.gallery-masonry` (CSS `columns: 3`, gap 14; ≤760 1 column). Tiles min-height 260, every even tile 390.
The lightbox (`styles.css:276-280`): fixed, backdrop blur, figure `min(1040px,94vw)`, img max-height 78vh contain radius 18, white caption, close icon button top-right.
Captures: `1440-gallery.png`, `390-gallery.png`, `1440-lightbox.png`.

### Contact / location (`legacy.js:118-120`, `styles.css:185-194`)
Page hero, then `.contact-grid` `.85fr 1.15fr` gap 28 (≤760 1 column). The contact card (paper, line border, radius 24, padding `clamp(28px,4vw,48px)`)
has an eyebrow, h2, and `.contact-list` rows (flex `space-between`, padding 18 0, top border, muted label, bold value), then the CTA.
The map card holds a `.map-placeholder` (min-height 330, gradient, decorative diagonal stripes, white text, light button to Google Maps).
Captures: `1440-contact.png`, `390-contact.png`.

### Footer (`legacy.js:20-35`, `styles.css:141-147`)
Charcoal bg, padding `56px <gutter> 26px`. Grid `1.4fr repeat(3, .7fr)`, gap 40, padding-bottom 56: brand (dark variant) + blurb (max 320, mt 20),
then three columns: "Explorar", "Información", "Contacto". `h4` .74rem uppercase .12em. Lists gap 8, .83rem at .64 white.
The bottom row is flex `space-between` with a top border `rgba(255,255,255,.12)`, .72rem at .45 white.
≤760: 2 columns with the brand spanning both. ≤420: 1 column, bottom row stacked.

### Floating WhatsApp button (`index.html:52-54`, `styles.css:281-283`)
Fixed bottom-right 20 (12 at ≤760), min-height 55, padding 8 15, pill, `#246f49`, shadow. A 2-row grid: glyph (1.6rem, spans 2 rows),
"WhatsApp" .78rem/800, small "Por configurar" .58rem at .7. Hidden on admin. **Keep it** as the primary contact affordance. It links
to `wa.me`, uses the real WhatsApp logo (simple-icons path, or Lucide `MessageCircle`), drops the "Por configurar" line, gets
`aria-label="Escribir por WhatsApp"`, and renders only when `HotelProfile.whatsappNumber` is set.

### Forms and inputs (`styles.css:84-86`)
Label: grid gap 7, muted .72rem/700. Input/select/textarea: min-height 47, padding 11 13, line border, radius 12, white bg, charcoal text.
Textarea min-height 120, vertical resize. Checkbox accent `--green` (265). Error text `#a23838` .76rem/700 (275).
Notice boxes: `.notice` green-tint and `.notice.warning` amber (266-268).
**Better:** reset font-size and weight on inputs. The mockup inputs inherit the label's .72rem/700 (see §5).

### Toast (`styles.css:284-285`)
Fixed bottom-center, `min(420px, 100%-32px)`, padding 13 16, radius 12, charcoal, white .82rem, centered, slides up. `role="status" aria-live="polite"`.
Keep it for admin save feedback. The public site needs no toast once the fake actions are gone. Capture: `1440-toast.png`, `390-toast.png`.

### Admin shell (`legacy.js:122-131`, `styles.css:196-251`)
- Layout grid `260px 1fr`, bg `#f3f2ed`. Sidebar: `--green-900`, sticky full height, padding 24 18, flex column. Brand (white, admin variant).
  Nav buttons: padding 12 13, gap 11, radius 10, `rgba(255,255,255,.72)` text. Active and hover: `rgba(255,255,255,.12)` bg, white text.
  A user block pinned to the bottom with a top border `rgba(255,255,255,.13)`, .78rem, name bold + muted subline.
- Topbar: white, height 74, padding `0 clamp(20px,4vw,48px)`, bottom border. Page title on the left (sans 1.2rem/700). Right: "Ver sitio" ghost button (the demo badge is excluded).
- Content padding `clamp(22px,4vw,46px)`. `.admin-heading`: flex `space-between`, aligned to the end, mb 28. h2 sans 1.7rem/700, muted .86rem p. Primary action on the right.
- KPI cards (`.stats-grid` 4 columns, gap 14): white, line border, radius 16, padding 20. Label .74rem muted, value 2rem, a green note under the value.
- `.panel`: white, line border, radius 16, padding 22. `.panel-head` h3 .96rem/700.
- **"Antes de publicar" checklist (keep, owner decision):** `.task-list` gap 10. `.task`: ivory bg, radius 12, padding 14, a gold 9 px dot, bold .81rem title + muted small note.
  **Better:** make each task a link to the module that fixes it, with a done state (green check, struck or dimmed) and a count
  "3 de 6 listos". Derive the tasks from real data (see §7).
- Table (`.data-table`): .8rem, cells padding 13 10, bottom border, nowrap. `th` .67rem uppercase .08em muted. The room cell has a 48×40 thumbnail with radius 8.
  The panel wraps the table with `overflow-x: auto`.
- Status pills `.state`: padding 5 8, pill, .65rem/800. Default `#edf4ea`/green, `.gray` `#ececea`/`#656b67`, `.gold` `#fff2d9`/`#7c5917`.
  Map them to PublicationStatus: PUBLISHED = green, DRAFT = gray, INACTIVE = gold.
- Content editor: grid `250px 1fr`, gap 18. The left `.editor-nav` (white card, padding 10, radius 14) has buttons (padding 11, radius 9, .78rem). Active: ivory bg, green, 800.
  `.editor-form`: white card, padding 24, gap 18, labelled fields, a dashed `.upload-zone` (min-height 150, `1.5px dashed #aeb7b0`, radius 14), and a `.notice`.
- Mobile (≤760): single column. The sidebar becomes a top bar with a horizontally scrolling nav (brand and user hidden). KPIs go to 2 columns, the editor nav scrolls horizontally.
- Captures: `1440-admin-dashboard.png`, `1440-admin-rooms.png`, `1440-admin-content.png`, `1440-admin-calendar.png` (excluded view), and the `390-admin-*` equivalents.

### Icons
The mockup uses **Unicode glyphs**, not an icon set: `⌁` wifi, `▣` tv, `◫` bath, `✣` fan, `☼` solar, `◉` water (legacy.js:16-18), `☰` menu,
`← → Ⅱ ▶` carousel, `◖` WhatsApp, `✓` list bullets, `×` close, `⌂ ▦ □ ✎ ♙ ⚙` admin nav, `↗` external link.
They render differently on each OS and font. **Replace them all with Lucide** (`lucide-react` is already in `apps/web/package.json`;
`packages/shared/src/icons/icons.ts` defines the allowed `ICON_KEYS`). Use a 1.5 px stroke and size the icons as the mockup's glyph boxes:
20 px inside the 52 px amenity circle, 18 px in icon buttons and nav. Mapping: wifi→`wifi`, tv→`tv`, bath→`bath`, fan→`fan`,
solar→`solar-panel`/`sun`, water→`droplets`, menu→`Menu`/`X`, carousel→`ChevronLeft`/`ChevronRight`/`Pause`/`Play`,
✓→`Check`, admin: Resumen `LayoutDashboard`, Habitaciones `BedDouble`, Contenido `PenLine`, etc.

---

## 4. Pages: section order and layout

| Page | Section order (desktop 1440) | Mobile 390 changes | Captures |
|---|---|---|---|
| **Home** `/` | header → hero carousel → ~~quick search~~ → intro (2 columns: copy and fact stack) → rooms showcase band (head + featured room card 1.25/.75) → amenities (4 columns) → sustainability panel (sand, 2 columns) → gallery strip (3-column bento, 4 tiles) → CTA panel → footer | hero content bottom-aligned, h1 62 px; intro and sustainability 1 column; showcase head stacked; feature card stacked; amenities 2×2 (1 column ≤420); gallery strip 2 columns with rows 280/180/180, tiles 1 and 4 full width; CTA margin 12, radius 22; footer 2 columns | `1440-home.png`, `1440-home-viewport.png`, `1440-home-scrolled-header.png`, `390-home.png`, `390-home-viewport.png`, `390-home-scrolled-header.png`, `390-mobile-menu-open.png` |
| **Rooms** `/habitaciones` | header → page hero (sand) → toolbar (type chips + count) → room grid (3 columns) → footer | 1 column, toolbar stacked | `1440-rooms.png`, `1440-rooms-filter-{individual,doble,familiar}.png`, `390-rooms*.png` |
| **Room detail** `/habitaciones/[slug]` | header → split: sticky media (1.25fr) and content (0.75fr): back link, kicker, h1, lead, Capacidad, Servicios, Tarifa, ~~Disponibilidad~~, CTA. The mockup has no footer here. **Add the footer.** | stacked: media 60vh (min 420) on top | `1440-room-detail.png`, `390-room-detail.png` |
| **Gallery** `/galeria` | header → page hero → toolbar (category chips) → 3-column masonry → footer; lightbox overlay | 1 column | `1440-gallery.png`, `390-gallery.png`, `1440-lightbox.png` |
| **Contact** `/contacto` | header → page hero → contact grid (.85/1.15: contact card and map card) → footer | 1 column, 16 px gutter | `1440-contact.png`, `390-contact.png` |
| **Admin Resumen** | sidebar + topbar → heading → ~~KPI row~~ (replaced, §7) → grid 1.4/.6: ~~occupancy chart~~ and "Antes de publicar" checklist | sidebar becomes a scrolling top nav | `1440-admin-dashboard.png`, `390-admin-dashboard.png` |
| **Admin Habitaciones** | heading "N habitaciones" + "Crear habitación" → table panel | table scrolls horizontally | `1440-admin-rooms.png`, `390-admin-rooms.png` |
| **Admin Contenido** | heading + "Guardar" → editor (section nav 250 + form) | nav scrolls horizontally | `1440-admin-content.png`, `390-admin-content.png` |
| ~~Admin Calendario~~ | excluded | | `1440-admin-calendar.png`, `390-admin-calendar.png` |

Pages without a mockup design (Servicios, FAQ, Políticas, legal) reuse the page hero, toolbar and card styles. FAQ: `details/summary` rows
styled as `.detail-block` (top border, padding 26 0, serif question at h3 size, chevron icon). Policies: a list of `.detail-block`s inside a paper card.

---

## 5. UI/UX defects in the mockup and how to do better

Each defect is observed in the captures or the code.

1. **Fact stack overlap.** Numbers "100%" and "24/7" run into their labels ("100%o privado", "24/7reserva") because the column is fixed at 72 px (`styles.css:97`). Seen in `1440-home.png` and `390-home.png`. Fix: `minmax(96px, auto) 1fr` + column gap.
2. **Room detail kicker collision.** The back link and the room kicker sit on one line ("TODAS LAS HABITACIONESHABITACIÓN 02 · PROTOTIPO") because both are inline (`legacy.js:104`, `1440-room-detail.png`). Fix: a breadcrumb block above, kicker on its own line.
3. **Gallery tiles letterboxed.** In the masonry the images do not fill their tiles: there are sand bars above and below, because `img { height: 100% }` sits in a button whose height comes only from `min-height` (`styles.css:182-183`, `1440-gallery.png`). Fix: give the tiles explicit aspect ratios (e.g. 4/5 and 4/3 alternating) and `object-fit: cover`, or use a real masonry with intrinsic image ratios.
4. **Room card pills collide.** The top-left concept label and the top-right status pill overlap and truncate at 3 columns (`1440-rooms.png`). Both go away (label excluded, no availability). If a badge is needed (promotion), place only one.
5. **WhatsApp FAB overlaps content.** At 1440×900 it covers the carousel index "01 / 03" (`1440-home-viewport.png`). On mobile it covers form fields and card buttons (`390-home-viewport.png`). Fix: move the carousel controls and index left of the FAB safe zone (right ≥ 96 px), and add bottom padding to the page equal to the FAB height + 24 on mobile.
6. **Overlays survive navigation.** The lightbox and the drawer are outside `#app`, and `hashchange` never closes them. After a route change the lightbox kept intercepting all clicks (reproduced during capture). Overlays also lack a focus trap and focus return. Fix: use a native `<dialog>` (or Radix Dialog), close on route change, return focus to the trigger.
7. **Mobile menu weaknesses.** No Escape or outside-click close, the icon never becomes ✕, there is no backdrop, the top offset is hard-coded 112/104 and depends on the banner, and the menu stays open on resize (`390-mobile-menu-open.png`).
8. **Admin horizontal overflow on mobile.** At 390 the admin page renders **856 px wide**: the horizontally scrolling nav is a grid child without `min-width: 0` (`styles.css:331-335`, `390-admin-dashboard.png`). Fix: `.admin-layout > * { min-width: 0 }` and `max-width: 100vw` on the nav scroller.
9. **Admin sidebar offset bug.** The sidebar uses `top: 34px; height: calc(100svh - 34px)` for a banner that is hidden on admin. That leaves a 34 px ivory strip at the top or bottom (`1440-admin-dashboard.png`, `1440-admin-content.png`). Fix: `top: 0; height: 100svh`.
10. **Admin inputs too small and bold.** Inputs inherit the label's `.72rem/700` (`font: inherit` at 21 + inputs nested in labels at 84). The form values in `1440-admin-content.png` are 11.5 px bold. Fix: inputs 0.95rem/400, labels separate.
11. **Contrast.** `--muted #6d756f` on `--ivory` is **≈4.4:1**, under 4.5:1 for body text (it passes on `--paper` at ≈4.7). The footer bottom row (white .45 on charcoal, 11.5 px) is ≈3.8:1. The gold focus ring `#c8a66a` on ivory is ≈2.1:1, under the 3:1 non-text minimum. Fix: muted text `#5f6862` (≈5.3:1 on ivory), footer bottom white .62, and a two-tone focus ring (`outline: 2px solid var(--green); box-shadow: 0 0 0 4px var(--gold)`) or green on light / gold on dark.
12. **Unicode icons.** Inconsistent across platforms and meaningless to screen readers (§3 Icons). Fix: Lucide.
13. **Hash routing.** `#habitaciones` etc. are not indexable, share one `<title>`/description ("Prototipo UX/UI…"), and active nav only matches exact routes (room detail does not highlight "Habitaciones"). Fix: real Next.js routes (`/habitaciones`, `/habitaciones/[slug]`, `/galeria`, `/contacto`), per-page metadata (D6), and `aria-current="page"` with prefix matching.
14. **Heavy images.** The concept PNGs are 2.48–3.21 MB each, have no `width`/`height` or `srcset` (layout shift), all three hero slides load eagerly, and the CTA image is a CSS background (not optimizable). Fix: `next/image` (AVIF/WebP, `sizes`), priority only on hero slide 1, the CTA image as `<Image fill>` behind the gradient, and a budget of ~250 KB for the hero at 1440.
15. **Fonts.** Google Fonts CSS is render-blocking and third-party. Weight 800 is used but not loaded (faux bold). Fix: `next/font/local` or `next/font/google` self-hosted, preload only the two faces used above the fold (D1 also fixes the all-fonts preload issue noted in the task).
16. **No page container.** Lines and grids keep stretching beyond 1440 (§1.6). Fix: a 1440 max container.
17. **Missing footer on room detail**, and no breadcrumb. Fix: both.
18. **Fake interactions.** Gallery category chips only show a toast. "Conocer nuestra historia" shows a toast. The WhatsApp FAB shows "no configurado". Fix: real filters, a link to the about content, or hide the control when the data is missing.
19. **Placeholder copy leaking into UI.** "Por configurar", "valor demostrativo", "Tarifa pendiente". Fix: the public site hides any row or field whose value is null. Admin shows the gap in the checklist instead.
20. **Room filter a11y.** Chips lack `aria-pressed`. The count is not a live region. Filtering uses `hidden` without moving focus. Fix as in §3.
21. **Hierarchy redundancy in admin.** The topbar title ("Resumen") and the heading ("Buenos días") compete. Fix: keep one page title (topbar), make the greeting a muted subline.
22. **Default `h1` margins.** UA `margin-bottom` creates an uneven gap under the room detail h1 (`1440-room-detail.png`). Fix: explicit heading margins in the type scale.
23. **Carousel a11y.** No slide semantics, inactive slides still exposed, pause glyph "Ⅱ" (§3 Hero).

---

## 6. Excluded by owner decision (do not implement)

| Element | Where in the mockup | What replaces it |
|---|---|---|
| **Booking request drawer** (3-step form, stepper, summary, demo save) | `index.html:56-96`; `styles.css:253-275`; logic `legacy.js:189-241, 253-256, 261-264`; capture `*-excluded-booking-drawer.png` | Nothing. Every `[data-booking-open]` trigger becomes a **WhatsApp link** (`https://wa.me/<HotelProfile.whatsappNumber>?text=<encoded WhatsAppTemplate>`), opened in a new tab with `rel="noopener"` |
| ↳ header CTA "Consultar estadía" | `index.html:38` | "Escríbenos por WhatsApp" (`button-dark`, WhatsApp icon), GENERAL template |
| ↳ hero "Consultar estadía" | `legacy.js:52` | "Consultar por WhatsApp" (`button-light`), GENERAL template (or `LandingSection HERO.ctaLabel`) |
| ↳ featured room "Consultar", room card "Consultar", detail "Solicitar esta habitación" | `legacy.js:71, 98, 104` | "Consultar por WhatsApp", **ROOM** template with the room name |
| ↳ CTA panel "Iniciar solicitud" | `legacy.js:85` | "Escríbenos por WhatsApp" (`LandingSection CONTACT.ctaLabel`) |
| ↳ contact "Preparar solicitud" | `legacy.js:119` | "Abrir WhatsApp" primary + "Llamar" ghost (`tel:`) when a phone is set |
| ↳ admin "Nueva solicitud demo" | `legacy.js:130` | Removed. Optional: "Ver sitio" or a link to the first incomplete checklist item |
| **Quick date search** bar | `legacy.js:57-62, 189-193, 195-198`; `styles.css:83-87, 309-310` | Nothing. Hero bottom padding drops from 190 to ~120 px; intro follows the hero directly |
| **Calendar** admin view and nav item | `legacy.js:123` (nav "Calendario"), `128`; `styles.css:240-245` | Nothing |
| **Availability block** in room detail | `legacy.js:104` ("Disponibilidad" `.detail-block`) | Nothing. Optionally a "Horarios" block (check-in/out from HotelProfile) |
| **Occupancy chart** | `legacy.js:130`; `styles.css:222-225` | The checklist takes the full width, or a "Contenido publicado" summary panel (§7) |
| **Revenue KPI** "Ingresos confirmados" | `legacy.js:130` | Replaced by a content KPI (§7). "Disponibles ahora" and "Solicitudes pendientes" depend on reservations too and should also be replaced (Q4) |
| **Usuarios y roles / Configuración** placeholders | `legacy.js:123` (toast-only buttons) | The platform's real modules (existing admin users and profile/settings screens) in the sidebar |
| **"Prototipo UX/UI" banner** | `index.html:16-19`; `styles.css:36-37, 298-299` | Nothing. **Recompute every offset that assumed it:** hero `100svh - 78px`, detail media `top: 78px`, mobile menu top, admin sidebar `top: 0` |
| Also prototype-only (implied) | concept label (`legacy.js:37`), demo badge (`styles.css:208`), "Prototipo · No procesa reservas reales" (`legacy.js:34`), "Panel administrativo demo" mobile link (`index.html:47`), localStorage demo requests | Removed. The footer bottom shows © year + RNT number (§7) |

---

## 7. Mapping mockup elements to platform data

> **Status after D3/C2 (2026-11-05).** This mapping was written against the model of the time. Since then `Service`, `Promotion`, `WhatsAppTemplate`, `RoomImage` and `RoomAmenity` were removed: one `Amenity` catalog with HOTEL/ROOM scope, room types with their own photos, rate and amenities, code-default WhatsApp messages with an editable greeting, and `/contacto`, `/preguntas-frecuentes`, `/servicios` merged or redirected ([ADR 0015](../adr/0015-amenities-and-hero-slides.md), [ADR 0016](../adr/0016-room-types-and-single-sources.md)). The current page contents are in [public-site.md](../public-site.md).

Sources: `apps/api/prisma/schema.prisma` (models HotelProfile, Room, RoomImage, Amenity, RoomAmenity, Service, GalleryItem,
LandingSection, Faq, HotelPolicy, SocialLink, WhatsAppTemplate, Promotion; enums RoomType, GalleryCategory, LandingSectionKey)
and `packages/shared/src/icons/icons.ts` (Lucide `ICON_KEYS`).

### Global
| Mockup | Platform |
|---|---|
| Wordmark "Hotel Bambú / PLAZA · MOCOA" | `HotelProfile.name` + `municipality` (Q2 on how to split). The mark is a code component. `HotelProfile.logoMedia` is used only for OG/JSON-LD if set |
| WhatsApp FAB and all CTAs | `HotelProfile.whatsappNumber` + `WhatsAppTemplate` (GENERAL / ROOM / PROMOTION). Hide when the number is null |
| Footer blurb | `HotelProfile.shortDescription` |
| Footer "Contacto" column | `address`, `municipality`, `department`, `whatsappNumber`, `phone`, `email`, `openingHours` (skip nulls) |
| Footer "Información" | links to `/politicas` (HotelPolicy), `/preguntas-frecuentes` (Faq), privacy/legal pages |
| Footer bottom | © year + `HotelProfile.legalName` + `rntNumber` (Colombian RNT) |
| (not in mockup) social links | `SocialLink` (active, sortOrder) as a Lucide/brand icon row in the footer brand column |

### Home
| Mockup | Platform | Notes |
|---|---|---|
| Hero slides (3) | **Today the platform has a single hero:** `HotelProfile.heroMedia` (+ `heroVideoMedia`) and `LandingSection HERO.mediaAsset` | **D3:** add a multi-slide model (e.g. `HeroSlide { mediaAssetId, alt, sortOrder, active }`, or an ordered relation on LandingSection HERO), API and admin upload/sort. Until then, render one slide and hide the controls and index |
| Hero eyebrow "Mocoa · Putumayo" | `municipality · department` | |
| Hero h1 / copy / CTA label | `LandingSection HERO.title / subtitle / ctaLabel` | |
| Intro eyebrow/h2/p | `LandingSection ABOUT.title / body` (+ subtitle as eyebrow) | "Conocer nuestra historia" links to `/nosotros` or the services page, or hide it |
| Fact stack (16 / 100% / 24/7) | count of PUBLISHED rooms + 2 facts | No model for facts. Proposal: number of rooms + 2 highlighted `Service`s, or a small `facts` JSON on ABOUT (Q3) |
| Rooms showcase head | `LandingSection ROOMS.title / subtitle`, button "Ver las {n} habitaciones" | |
| Featured room | first PUBLISHED `Room` by `sortOrder` (no `featured` flag) | kicker = `room.name`, h3 = RoomType label, text = `shortDescription`, pills = capacity + `RoomAmenity` names, price = `basePrice` + `currency` + `priceUnit` (hide the box when null) |
| Amenities grid "Comodidades…" | `Amenity` with `active && showOnHome` (icon = `iconKey` → Lucide, `name`, `description`) | D3 merges Amenity and Service duplicates (Wi-Fi, TV) |
| Sustainability panel | `LandingSection SERVICES` + `Service` with `highlighted` (`iconKey`, `name`, `description`) | The heading is editable copy, so no environmental claims are hard-coded |
| Gallery strip (4 tiles) | `GalleryItem` `published && featured`, ordered, first 4 + `LandingSection GALLERY` | Caption = category label |
| CTA panel | `LandingSection CONTACT.title / body / ctaLabel / mediaAsset` (background photo) | |
| (optional) FAQ teaser | `Faq` `published && showOnHome` | Not in the mockup. Use the FAQ style from §4 |

### Rooms catalogue and detail
| Mockup | Platform | Notes |
|---|---|---|
| Page hero "16 habitaciones / Encuentra tu espacio." | published room count + static or ROOMS copy | |
| Filter chips Todas / Individual / Doble / Familiar | `RoomType` = **INDIVIDUAL, COUPLE, TWIN, FAMILY** (4 values, vs the mockup's 3) | Show "Todas" + one chip per type that has ≥1 published room. Spanish labels needed (Q5: Individual / Pareja / Doble / Familiar). Use `?tipo=` query for shareable state |
| Room card image | first `RoomImage` by order (cover) | 4:3 crop |
| Status pill | none (no availability) | Optional: active `Promotion` badge |
| Card meta "Hasta N · Baño privado · WiFi" | `capacity`, `beds`, `areaM2`, top 2 amenities | |
| Detail media | all `RoomImage`s (gallery + lightbox) | The mockup shows one image |
| Detail Capacidad / Servicios / Tarifa | `capacity` + `beds`; `RoomAmenity`; `basePrice`, `priceUnit`, `taxesIncluded`, `priceNotes` | Hide Tarifa when `basePrice` is null and show "Consulta la tarifa por WhatsApp" |
| (add) Horarios | `HotelProfile.checkInTime / checkOutTime` | Replaces the excluded availability block |
| SEO | `seoTitle`, `seoDescription`, `slug` (+ `RoomSlugRedirect`) | D6 |

### Gallery
Mockup categories vs `GalleryCategory`:

| Mockup chip | Platform enum | Proposed chip label |
|---|---|---|
| Habitaciones | `ROOMS` | Habitaciones |
| Espacios comunes | `COMMON_AREAS` | Espacios comunes |
| Instalaciones | no exact match (COMMON_AREAS or DETAILS) | merged into the two chips above |
| Fachada | `EXTERIOR` | Fachada |
| Entorno | `SURROUNDINGS` | Entorno |
| (none) | `FOOD` | Gastronomía |
| (none) | `DETAILS` | Detalles |

Recommendation: **keep the platform enum, no schema change**. Render chips only for categories with published items, in enum order, with the labels above.
"Instalaciones" disappears (Q6 if the owner wants it as its own category).

### Contact
`HotelProfile.address`, `whatsappNumber`, `phone`, `email`, `openingHours` (rows, skip nulls), `mapUrl` ("Abrir en Google Maps"),
`latitude/longitude` (an embedded map, or a static map image to avoid third-party JS before consent), `directions`, `nearbyAttractions`
(as an extra card below), and `LandingSection LOCATION / CONTACT` for the headings. Replace the gradient placeholder with a real map. Keep the
gradient only as the no-coordinates fallback.

### Admin
| Mockup | Platform |
|---|---|
| Sidebar sections | the platform's modules, renamed and grouped per D4 ("Servicios del hotel", "Equipamiento de habitaciones"…), same visual style |
| KPI cards | Replace the reservation-based ones with: Habitaciones publicadas (`Room` PUBLISHED / total), Fotos en galería (published `GalleryItem`), Preguntas frecuentes publicadas, Secciones del inicio activas (`LandingSection.enabled`) (Q4) |
| "Antes de publicar" checklist | derived: WhatsApp number set; every published room has `basePrice`; every published room has ≥1 RoomImage; hero image(s) set; address + openingHours set; ≥1 published policy; RNT number set. Each item links to its module |
| Rooms table | `Room` list: cover RoomImage, name, RoomType label, capacity, price (or "Sin tarifa" in `--warn-fg`), PublicationStatus pill, "Editar" link |
| Content editor | `LandingSection` per key (left nav = HERO, ABOUT, ROOMS, SERVICES, GALLERY, LOCATION, FAQ, CONTACT) + HotelProfile/FAQ/Policies links. The "Carrusel principal" upload zone becomes the multi-slide hero manager (D3) |

---

## 8. Open questions for the owner

- **Q1.** Is the bamboo mark and wordmark from the mockup approved as the hotel's logo, or is there an official logo file?
- **Q2.** Is the brand name "Hotel Bambú Plaza", and should the second line read "PLAZA · MOCOA"?
- **Q3.** Should the home fact stack show editable facts (new field) or be derived from rooms and highlighted services?
- **Q4.** Admin KPIs: is it OK to replace all four mockup KPIs with content-readiness KPIs, since "Disponibles ahora" and "Solicitudes pendientes" depend on the excluded reservations?
- **Q5.** Spanish labels for the four RoomTypes (INDIVIDUAL, COUPLE, TWIN, FAMILY)?
- **Q6.** Gallery: is it OK to drop "Instalaciones" and show the platform categories (including Gastronomía and Detalles)?
