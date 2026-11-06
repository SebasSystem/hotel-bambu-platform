import sharp from 'sharp';
import { describe, expect, it, vi } from 'vitest';
import type { StoredVariant } from './media-storage.js';
import {
  pickRegenerationSource,
  planMissingVariants,
  regenerateMissingVariants,
  type VariantSourceStorage,
} from './regenerate-variants.js';

const KEY = 'media/2026/11/abc';

function stored(width: number, format: 'avif' | 'webp'): StoredVariant {
  return {
    width,
    height: Math.round((width * 4) / 3),
    format,
    key: `${KEY}/${width}.${format}`,
    sizeBytes: 10,
  };
}

/** Variants of an asset uploaded before D7: 640 + 960 in both formats. */
const LEGACY = [stored(640, 'avif'), stored(640, 'webp'), stored(960, 'avif'), stored(960, 'webp')];
const COMPLETE = [480, 640, 750, 960].flatMap((w) => [stored(w, 'avif'), stored(w, 'webp')]);

function fakeStorage(source: Buffer, failOnPut?: number) {
  let puts = 0;
  const put: { key: string; type: string; bytes: Uint8Array }[] = [];
  const deleted: string[] = [];
  const storage: VariantSourceStorage = {
    getObject: vi.fn(async () => source),
    putObject: vi.fn(async (key: string, bytes: Uint8Array, type: string) => {
      puts += 1;
      if (puts === failOnPut) throw new Error('network down');
      put.push({ key, type, bytes });
    }),
    deleteObjects: vi.fn(async (keys: readonly string[]) => {
      deleted.push(...keys);
    }),
  };
  return { storage, put, deleted };
}

async function webp(width: number, height: number): Promise<Buffer> {
  return sharp({ create: { width, height, channels: 3, background: '#1d6247' } })
    .webp()
    .toBuffer();
}

describe('planMissingVariants', () => {
  it('lists the standard widths an existing asset lacks, in both formats', () => {
    expect(planMissingVariants(960, LEGACY)).toEqual([
      { width: 480, format: 'avif' },
      { width: 480, format: 'webp' },
      { width: 750, format: 'avif' },
      { width: 750, format: 'webp' },
    ]);
  });

  it('returns nothing when the asset already has every planned variant', () => {
    expect(planMissingVariants(960, COMPLETE)).toEqual([]);
  });

  it('never plans a width above the widest stored variant (no upscaling)', () => {
    // Original 4000 px wide, but only the 640 WebP is in storage: 480 and the 640 AVIF remain.
    expect(planMissingVariants(4000, [stored(640, 'webp')])).toEqual([
      { width: 480, format: 'avif' },
      { width: 480, format: 'webp' },
      { width: 640, format: 'avif' },
    ]);
  });

  it('falls back to the widest stored variant when the asset has no recorded width', () => {
    expect(planMissingVariants(null, LEGACY).map((t) => t.width)).toEqual([480, 480, 750, 750]);
    expect(planMissingVariants(null, [])).toEqual([]);
  });
});

describe('pickRegenerationSource', () => {
  it('uses the widest variant and prefers WebP at equal width', () => {
    expect(pickRegenerationSource(LEGACY)).toMatchObject({ width: 960, format: 'webp' });
    expect(pickRegenerationSource([stored(960, 'avif'), stored(640, 'webp')])).toMatchObject({
      width: 960,
      format: 'avif',
    });
    expect(pickRegenerationSource([])).toBeNull();
  });
});

describe('regenerateMissingVariants', () => {
  it('renders the missing widths from the widest variant and uploads them next to it', async () => {
    const { storage, put } = fakeStorage(await webp(960, 1280));

    const result = await regenerateMissingVariants(
      { storageKey: KEY, width: 960, variants: LEGACY },
      storage,
    );

    expect(storage.getObject).toHaveBeenCalledWith(`${KEY}/960.webp`);
    expect(put.map((p) => [p.key, p.type])).toEqual([
      [`${KEY}/480.avif`, 'image/avif'],
      [`${KEY}/480.webp`, 'image/webp'],
      [`${KEY}/750.avif`, 'image/avif'],
      [`${KEY}/750.webp`, 'image/webp'],
    ]);
    for (const p of put) {
      const meta = await sharp(p.bytes).metadata();
      expect(meta.format).toBe(p.key.endsWith('.avif') ? 'heif' : 'webp');
    }
    expect(result.added).toEqual([
      expect.objectContaining({ width: 480, height: 640, format: 'avif', key: `${KEY}/480.avif` }),
      expect.objectContaining({ width: 480, height: 640, format: 'webp' }),
      expect.objectContaining({ width: 750, height: 1000, format: 'avif' }),
      expect.objectContaining({ width: 750, height: 1000, format: 'webp' }),
    ]);
    // Merged list ordered by width then format; the existing entries are kept as they were.
    expect(result.variants.map((v) => `${v.width}.${v.format}`)).toEqual([
      '480.avif',
      '480.webp',
      '640.avif',
      '640.webp',
      '750.avif',
      '750.webp',
      '960.avif',
      '960.webp',
    ]);
    expect(result.variants).toEqual(expect.arrayContaining(LEGACY));
  });

  it('does not touch storage when nothing is missing', async () => {
    const { storage } = fakeStorage(Buffer.alloc(0));
    const result = await regenerateMissingVariants(
      { storageKey: KEY, width: 960, variants: COMPLETE },
      storage,
    );
    expect(result.added).toEqual([]);
    expect(storage.getObject).not.toHaveBeenCalled();
    expect(storage.putObject).not.toHaveBeenCalled();
  });

  it('removes the objects it already uploaded when an upload fails', async () => {
    const { storage, deleted } = fakeStorage(await webp(960, 1280), 3);
    await expect(
      regenerateMissingVariants({ storageKey: KEY, width: 960, variants: LEGACY }, storage),
    ).rejects.toThrow('network down');
    expect(deleted).toEqual([`${KEY}/480.avif`, `${KEY}/480.webp`]);
  });
});
