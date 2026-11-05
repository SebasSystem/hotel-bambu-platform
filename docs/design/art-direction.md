# Art direction

> **Superseded (v0).** These un-researched directions are replaced by [`docs/research/art-direction-briefs.md`](../research/art-direction-briefs.md) (A "Cuaderno de Mocoa" / B "Letrero y Madera"). Kept for history only.

Status (historical): **Direction A was the working default, pending hotel approval** (Phase 0 exit, req. 26). Both directions use the same tokens ([`tokens.json`](./tokens.json)) and logo; they differ in layout density, image treatment and motion.

## Constraints from the real material

- 42 unique photos, almost all **portrait 960×1280**, indoor, phone-shot, mixed colour casts (lime/red/mustard textiles). No landscape facade, no surroundings, no food.
- The hotel is a clean, simple **urban hotel in Mocoa**; its value is location, comfort, safety, warm service and practical features (private bathroom, TV, fan, Wi-Fi, solar panels, water reserve, internet on all floors).
- Therefore: the design must make modest photos look **cared-for and consistent**, not pretend to be a jungle resort. Strength comes from typography, colour, generous space and framing.

## A — "Refugio sereno" (default)

- **Mood:** calm, airy, trustworthy. Sand backgrounds, deep bamboo greens, serif headlines (Fraunces SOFT), lots of white space.
- **Photos:** always **framed**, never full-bleed on desktop: portrait images in rounded (`radius.lg`) cards or in split layouts (text 5/12 | image 7/12). Light, uniform grade (neutral white balance, +exposure, slight warmth); textile colours left real.
- **Hero:** mobile — full-height portrait photo (#35 sign or #11 room) with dark gradient scrim + `logo-on-dark`, H1 and WhatsApp CTA. Desktop — split hero: H1, subtitle (tagline, once confirmed) and CTA on sand; a tall framed photo on the right with a slow cross-fade between 2–3 images.
- **Graphic motif:** thin vertical bamboo lines with nodes as section dividers; a leaf that draws itself (stroke) beside section kickers.
- **Motion:** slow and subtle (see `motion-spec.md`): line-by-line title reveal, fade-up, sticky "about" with image swap, header transparent → solid.
- **Why default:** tolerates low-res portrait photos best, reads as honest and tidy, cheapest in performance, and fits a business/family audience (mission mentions rest and commercial/administrative stays).

## B — "Selva viva"

- **Mood:** more texture and energy. Collage of overlapping photos at slight angles, larger leaf illustrations, cane and earth accents more present, subtle paper grain.
- **Photos:** mosaic/collage with masks (leaf/segment shapes), horizontal scroll gallery pinned on desktop.
- **Hero:** collage of 3 portrait photos with parallax depth on scroll, display title over bamboo-900 band.
- **Motion:** more expressive — pinned horizontal gallery, mask transitions, parallax layers.
- **Risks:** collage exposes low resolution and inconsistent colour; promises "nature" the property doesn't visually support; heavier on mid-range mobiles. Better suited once the hotel provides new, landscape, high-res photos.

## Default decisions (A)

| Area | Decision |
|---|---|
| Hero | Photo (no video, see ADR 0004), framed split on desktop, full-bleed portrait on mobile |
| Header | Transparent over hero on mobile → solid `sand-50/90` + blur after scroll; solid on desktop split hero |
| Sections | Alternating `sand-50` / `sand-100`; one dark `bamboo-900` band for "Características" (solar, water reserve, internet) |
| Room cards | Portrait 4:5 image, Fraunces name, Manrope details, "Desde $ … impuestos incluidos" only when a rate exists |
| Icons | Lucide, 1.5 px stroke, `bamboo-700` |
| CTA | Primary `bamboo-700` button; WhatsApp floating button `#25D366` with `ink-900` icon |
| Photo treatment | Same light correction preset on all; no retouching that changes reality |

Low/medium-fidelity home wireframes for both directions are a Phase 3 prerequisite and will be produced as code prototypes on the real stack once Phase 1 exists (cheaper than static mocks, uses real photos and tokens).
