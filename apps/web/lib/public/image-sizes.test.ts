import { describe, expect, it } from 'vitest';
import { IMAGE_SIZES, stripTileSizes } from './image-sizes';

/**
 * Minimal model of how a browser resolves `sizes` + a `w` srcset (HTML spec "source size" and
 * Chromium's pick: the smallest candidate whose density reaches the device pixel ratio, else the
 * largest). Only the grammar the site uses: `(min-width: Nrem|Npx) <len>` entries and a default.
 */
function slotWidth(sizes: string, viewport: number): number {
  for (const entry of sizes.split(',').map((s) => s.trim())) {
    const match = /^\(min-width:\s*([\d.]+)(rem|px)\)\s+(.+)$/.exec(entry);
    const length = match ? match[3]! : entry;
    if (match && viewport < Number(match[1]) * (match[2] === 'rem' ? 16 : 1)) continue;
    const value = /^([\d.]+)(vw|px)$/.exec(length);
    if (!value) throw new Error(`Unsupported length ${length}`);
    return value[2] === 'vw' ? (Number(value[1]) * viewport) / 100 : Number(value[1]);
  }
  throw new Error(`No default length in ${sizes}`);
}

function pickWidth(widths: number[], sizes: string, viewport: number, dpr: number): number {
  const needed = slotWidth(sizes, viewport) * dpr;
  const sorted = [...widths].sort((a, b) => a - b);
  return sorted.find((w) => w >= needed) ?? sorted.at(-1)!;
}

/** Variants of a 960 px wide photo (all current hotel photos) after D7. */
const WIDTHS = [480, 640, 750, 960];

describe('image sizes pick the smallest sufficient variant', () => {
  it("Lighthouse's mobile device (412 CSS px at 1.75x) gets 750/640 instead of 960", () => {
    expect(pickWidth(WIDTHS, IMAGE_SIZES.hero, 412, 1.75)).toBe(750);
    expect(pickWidth(WIDTHS, IMAGE_SIZES.roomPhoto, 412, 1.75)).toBe(750);
    expect(pickWidth(WIDTHS, IMAGE_SIZES.roomCard, 412, 1.75)).toBe(640);
    expect(pickWidth(WIDTHS, IMAGE_SIZES.galleryTile, 412, 1.75)).toBe(640);
    expect(pickWidth(WIDTHS, IMAGE_SIZES.roomThumb, 412, 1.75)).toBe(480);
  });

  it('a 360 or 375 px phone at 2x gets the 750 hero and 640 cards', () => {
    expect(pickWidth(WIDTHS, IMAGE_SIZES.hero, 360, 2)).toBe(750);
    expect(pickWidth(WIDTHS, IMAGE_SIZES.hero, 375, 2)).toBe(750);
    expect(pickWidth(WIDTHS, IMAGE_SIZES.roomCard, 360, 2)).toBe(640);
    expect(pickWidth(WIDTHS, IMAGE_SIZES.galleryTile, 360, 2)).toBe(640);
  });

  it('desktop gallery and card slots fit the 480/640 variants at 1x', () => {
    expect(pickWidth(WIDTHS, IMAGE_SIZES.galleryTile, 1100, 1)).toBe(480);
    expect(pickWidth(WIDTHS, IMAGE_SIZES.roomCard, 1440, 1)).toBe(640);
    expect(pickWidth(WIDTHS, IMAGE_SIZES.roomThumb, 1440, 2)).toBe(480);
  });
});

/**
 * Rendered widths (CSS px) measured in Chrome on the built site, per viewport (D7). `sizes` may
 * overstate a slot a little (a bigger file) but must never understate it by more than 3% (a
 * blurry photo).
 */
const MEASURED: Record<string, { sizes: string; widths: Record<number, number> }> = {
  hero: { sizes: IMAGE_SIZES.hero, widths: { 360: 360, 412: 412, 1100: 1100, 1440: 1440 } },
  roomCard: {
    sizes: IMAGE_SIZES.roomCard,
    widths: { 360: 315, 412: 361, 800: 338, 1100: 470, 1440: 620, 1920: 614 },
  },
  roomPhoto: {
    sizes: IMAGE_SIZES.roomPhoto,
    widths: { 360: 360, 412: 412, 800: 800, 1100: 666, 1440: 877 },
  },
  galleryTile: {
    sizes: IMAGE_SIZES.galleryTile,
    widths: { 360: 317, 412: 363, 800: 345, 1100: 313, 1440: 413, 1920: 409 },
  },
  aboutPhoto: {
    sizes: IMAGE_SIZES.aboutPhoto,
    widths: { 360: 317, 412: 363, 800: 704, 1100: 401, 1440: 512, 1920: 512 },
  },
  locationPhoto: {
    sizes: IMAGE_SIZES.locationPhoto,
    widths: { 360: 261, 412: 307, 800: 624, 1100: 397, 1440: 538, 1920: 532 },
  },
  ctaPanel: {
    sizes: IMAGE_SIZES.ctaPanel,
    widths: { 360: 336, 412: 388, 800: 704, 1100: 968, 1440: 1267, 1920: 1256 },
  },
  stripLead: {
    sizes: stripTileSizes(0, 4),
    widths: { 360: 317, 412: 363, 800: 327, 1100: 455, 1440: 599, 1920: 593 },
  },
  stripSmall: {
    sizes: stripTileSizes(1, 4),
    widths: { 360: 152, 412: 175, 800: 176, 1100: 245, 1440: 322, 1920: 319 },
  },
  stripWide: {
    sizes: stripTileSizes(3, 4),
    widths: { 360: 317, 412: 363, 800: 365, 1100: 501, 1440: 657, 1920: 651 },
  },
};

describe('sizes match the rendered slots', () => {
  for (const [slot, { sizes, widths }] of Object.entries(MEASURED)) {
    it(`${slot}: within -3% / +20% of the measured width`, () => {
      for (const [viewport, measured] of Object.entries(widths)) {
        const declared = slotWidth(sizes, Number(viewport));
        expect(declared, `${slot} at ${viewport}px`).toBeGreaterThanOrEqual(measured * 0.97);
        expect(declared, `${slot} at ${viewport}px`).toBeLessThanOrEqual(measured * 1.2);
      }
    });
  }
});

describe('stripTileSizes', () => {
  it('gives the lead tile and the full-row tiles the wide slot', () => {
    expect(stripTileSizes(0, 4)).not.toBe(stripTileSizes(1, 4));
    expect(stripTileSizes(3, 4)).toBe(stripTileSizes(1, 2));
    expect(stripTileSizes(2, 4)).toBe(stripTileSizes(1, 4));
  });
});
