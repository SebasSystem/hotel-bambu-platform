/**
 * `sizes` for every photo slot of the public site, in one place so they stay in step with the
 * layout (D7). Each value is the rendered width of the slot, measured in Chrome at 360–1920 px
 * (see image-sizes.test.ts). Phone content is 88vw: the page gutter is 6vw on each side between
 * 334 and 1533 px (`--gutter` in tokens.css). An honest `sizes` lets a phone pick the 640/750
 * variants instead of the 960 one, which is most of the photo pages' LCP bytes.
 */
export const IMAGE_SIZES = {
  /** Full-bleed hero carousel. */
  hero: '100vw',
  /** Room type cards: one column on phones, two from 760 px, capped by the 1440 px container. */
  roomCard: '(min-width: 90rem) 620px, (min-width: 47.5rem) 43vw, 88vw',
  /** Main photo of a room type page (sticky 1.25fr column on desktop). */
  roomPhoto: '(min-width: 62.5rem) 62vw, 100vw',
  /** Thumbnails over the main room photo (64/80 px boxes). */
  roomThumb: '80px',
  /** Gallery masonry: 1, 2 (from 480 px) or 3 (from 1000 px) columns. */
  galleryTile: '(min-width: 90rem) 413px, (min-width: 62.5rem) 29vw, (min-width: 30rem) 43vw, 88vw',
  /** "Sobre nosotros" photo on the home page. */
  aboutPhoto: '(min-width: 90rem) 512px, (min-width: 62.5rem) 37vw, 88vw',
  /** Photo next to the contact details on /ubicacion. */
  locationPhoto: '(min-width: 90rem) 540px, (min-width: 62.5rem) 37vw, 78vw',
  /** Closing CTA panel with a background photo. */
  ctaPanel: '(min-width: 90rem) 1256px, 94vw',
  /** Lightbox photo. */
  lightbox: '(min-width: 65rem) 1040px, 94vw',
} as const;

const STRIP = {
  lead: '(min-width: 90rem) 600px, (min-width: 47.5rem) 42vw, 88vw',
  wide: '(min-width: 90rem) 660px, (min-width: 47.5rem) 46vw, 88vw',
  small: '(min-width: 90rem) 324px, (min-width: 47.5rem) 23vw, 43vw',
} as const;

/**
 * Home gallery strip (`.gallery-strip` in site.css): the first tile is the large one; the fourth,
 * and the last one when there are only 2 or 3 photos, span a full row; the rest are half tiles.
 */
export function stripTileSizes(index: number, count: number): string {
  if (index === 0) return STRIP.lead;
  if (index === 3 || (index === count - 1 && count <= 3)) return STRIP.wide;
  return STRIP.small;
}
