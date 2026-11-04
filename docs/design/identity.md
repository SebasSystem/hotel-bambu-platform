# Visual identity — proposal v0.1

Status: **proposal, pending hotel approval** (requirement 6.2, 28.2). Tokens live in [`tokens.json`](./tokens.json); every value can change without touching components.

## Concept

**"Descanso en el corazón de Mocoa"** — a calm, honest, well-kept city hotel whose only brand asset today is its green bamboo sign. The identity takes three things from it: the **sign green**, the **vertical, segmented rhythm** of the word HOTEL stacked on the sign (= a bamboo stalk), and the small **bamboo leaves** printed beside "Bambú" and on the hotel's framed mission/vision prints.

- Attributes: natural, serene, welcoming, authentic, cared-for (6.1).
- Honest scale: the hotel is a simple, clean urban hotel, not a jungle eco-lodge. The design must not promise nature or luxury the photos don't show (17.6 truthful advertising). Bamboo is a *brand motif*, not a claim about the property.
- Visual motifs: vertical lines and nodes (dividers, section markers), elongated leaves (accents), warm sand backgrounds that neutralize the strong curtain/bedspread colours of the room photos.
- Avoid: neon greens (the lime bedspreads already bring plenty), dark "tech" effects, stock icon mixes.

## Colour

### Sign sampling

Source: `WhatsApp Image 2026-10-15 at 2.50.41 PM (1).jpeg` (vertical "HOTEL / Bambú" sign). Pixel analysis (Pillow) over the sign panel, filtering green-dominant, non-letter, non-cable pixels (178 k px):

| Sample | Hex | Note |
|---|---|---|
| 20th percentile (shadow) | `#147C75` | teal shift from the photo's HDR/sky cast |
| Median | `#539782` | |
| Mean | `#559973` | hue ≈ 145–160° (jade/bamboo green) |

The photo is HDR-processed and backlit, so values are lifted and blue-shifted. The brand green keeps the sampled **hue (~152°)** and lowers lightness for contrast: `bamboo-500 #3B8F69` is the sign colour normalized; `bamboo-700 #1D6247` is the usable primary. Re-sample when a neutral daylight photo of the sign arrives (pending list).

### Palette

| Token | Hex | Use |
|---|---|---|
| `bamboo-900` | `#12392B` | Headings on light, dark sections, footer |
| `bamboo-800` | `#174C39` | Dark surfaces, header solid (alt) |
| `bamboo-700` | `#1D6247` | **Primary**: buttons, links, solid header |
| `bamboo-600` | `#267A58` | Hover/active, focus ring |
| `bamboo-500` | `#3B8F69` | Sign green: logo leaves, large display accents, illustrations (not body text) |
| `bamboo-300` | `#8EC3A4` | Details on dark, leaves on dark logo |
| `bamboo-100` | `#DDEEE3` | Tinted surfaces, badges, selected states |
| `cane-500` | `#C9A55C` | Decorative accent "caña seca" (lines, icons on dark). **Never text on light** |
| `cane-700` | `#8A6A2B` | Cane accent when it must be text on sand-50 |
| `sand-50` | `#F7F3EA` | Page background |
| `sand-100` | `#EEE7D8` | Alternate sections, cards |
| `sand-200` | `#D9CFBA` | Hairline borders, dividers (decorative) |
| `earth-600` | `#A8582F` | Secondary accent (promotions badge) |
| `ink-900` | `#1A1F1C` | Body text |
| `ink-600` | `#56605A` | Secondary/muted text |
| `error-600` | `#B3261E` | Form errors |
| `whatsapp` | `#25D366` | WhatsApp button fill only, with `ink-900` text/icon |

### Contrast check (WCAG 2.x, computed)

| Foreground / background | Ratio | AA normal (4.5) | AA large/UI (3) |
|---|---|---|---|
| ink-900 / sand-50 | 15.09 | ✓ | ✓ |
| ink-900 / sand-100 | 13.57 | ✓ | ✓ |
| ink-600 / sand-50 | 5.90 | ✓ | ✓ |
| ink-600 / sand-100 | 5.30 | ✓ | ✓ |
| bamboo-900 / sand-50 | 11.52 | ✓ | ✓ |
| bamboo-700 / sand-50 | 6.56 | ✓ | ✓ |
| bamboo-700 / sand-100 | 5.90 | ✓ | ✓ |
| bamboo-700 / bamboo-100 | 6.02 | ✓ | ✓ |
| bamboo-600 / sand-50 | 4.73 | ✓ | ✓ |
| bamboo-500 / sand-50 | 3.57 | ✗ | ✓ (large display only) |
| white / bamboo-700 (button) | 7.27 | ✓ | ✓ |
| white / bamboo-600 (hover) | 5.24 | ✓ | ✓ |
| sand-50 / bamboo-900 | 11.52 | ✓ | ✓ |
| bamboo-300 / bamboo-900 | 6.37 | ✓ | ✓ |
| cane-500 / bamboo-900 | 5.48 | ✓ | ✓ |
| cane-500 / sand-50 | 2.10 | ✗ | ✗ (decorative only) |
| cane-700 / sand-50 | 4.54 | ✓ | ✓ |
| earth-600 / sand-50 | 4.62 | ✓ | ✓ |
| white / earth-600 | 5.12 | ✓ | ✓ |
| error-600 / sand-50 | 5.90 | ✓ | ✓ |
| ink-900 / whatsapp | 8.43 | ✓ | ✓ |
| white / whatsapp | 1.98 | ✗ | ✗ → never white text on `#25D366` |

## Typography

Verified on Google Fonts (CSS API returned 200 with `latin` + `latin-ext` subsets, 2026-11-04); both load with `next/font/google` (self-hosted at build, no runtime calls to Google).

- **Display: Fraunces** (variable: `opsz` 9–144, `wght` 100–900, `SOFT` 0–100, `WONK`). Use `wght` 500–600, `opsz` auto, `SOFT` ≈ 50 for a softer, organic serif. Headings and the wordmark.
- **Text/UI: Manrope** (variable `wght` 200–800). Use 400, 500, 600. Body, navigation, forms, admin.
- Alternatives tested on paper: Cormorant Garamond + DM Sans (more fragile at small sizes; Cormorant lacks weight for headings on mobile). Kept as fallback for direction A only.
- Fluid scale (`clamp`) in `tokens.json` → `font.size`. Max 2 families, latin subset (covers á é í ó ú ñ ü ¿ ¡).

## Logo

Files (outlined paths, no font dependency, no gradients):

- [`logo.svg`](./logo.svg) — horizontal lockup: isotype + "HOTEL" (Manrope SemiBold, tracked) + "Bambú Plaza" (Fraunces 72pt SemiBold). 314×80.
- [`logo-on-dark.svg`](./logo-on-dark.svg) — light version for dark backgrounds/photos (sand-50 + bamboo-300).
- [`logo-mark.svg`](./logo-mark.svg) — isotype 64×64: three-segment bamboo stalk with two nodes and two elongated leaves. Two flat colours (bamboo-700 stalk, bamboo-500 leaves); also works in a single colour.

Checks: rendered in headless Chrome at 256/64/32/16 px; the stalk + leaves read at 32 px (favicon target). At 16 px only the silhouette remains — acceptable for a favicon.

Rules (to be moved to `docs/brand/README.md` in Phase 1):

- Clear space = height of one stalk segment (≈ ¼ of the mark height) on all sides.
- Minimum size: mark 24 px; horizontal lockup 140 px wide.
- Don't recolour leaves with cane or earth; don't add gradients, shadows or outlines.
- Pending: vertical lockup, monochrome dark (single `bamboo-900`), favicons PNG 32/180/192/512, OG 1200×630 — generated in Phase 1 from these SVGs.

The logo is an original drawing; it echoes the sign's colour and stacked verticality without copying any third-party mark. **The hotel must approve it**; a designer can refine it later.
