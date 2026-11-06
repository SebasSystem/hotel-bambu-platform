import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import {
  ImageValidationError,
  detectImageType,
  planVariantWidths,
  processImage,
} from './image-pipeline.js';

/** JPEG with EXIF (camera make, copyright) and orientation 6 (display rotated 90° CW). */
async function jpegWithExif(width: number, height: number): Promise<Buffer> {
  return sharp({ create: { width, height, channels: 3, background: { r: 29, g: 98, b: 71 } } })
    .jpeg()
    .withExif({ IFD0: { Make: 'TestPhone', Copyright: 'secret-owner' } })
    .withMetadata({ orientation: 6 })
    .toBuffer();
}

describe('planVariantWidths', () => {
  it('uses the standard widths below the source and caps at the source width', () => {
    expect(planVariantWidths(1280)).toEqual([480, 640, 750, 960, 1280]);
    expect(planVariantWidths(960)).toEqual([480, 640, 750, 960]);
    expect(planVariantWidths(1100)).toEqual([480, 640, 750, 960, 1100]);
  });

  it('adds the 480 px (thumbnails, small slots) and 750 px (375 CSS px at 2x) widths', () => {
    expect(planVariantWidths(960).slice(0, 3)).toEqual([480, 640, 750]);
    expect(planVariantWidths(600)).toEqual([480, 600]);
  });

  it('never upscales and never exceeds 1920', () => {
    expect(planVariantWidths(400)).toEqual([400]);
    expect(planVariantWidths(4032)).toEqual([480, 640, 750, 960, 1280, 1920]);
  });
});

describe('detectImageType', () => {
  it('detects JPEG and PNG from magic bytes', async () => {
    const png = await sharp({ create: { width: 4, height: 4, channels: 4, background: '#ffffff' } })
      .png()
      .toBuffer();
    expect(await detectImageType(png)).toBe('image/png');
    expect(await detectImageType(await jpegWithExif(8, 8))).toBe('image/jpeg');
  });

  it('rejects files whose real type is not an allowed image, whatever the extension', async () => {
    await expect(
      detectImageType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>')),
    ).rejects.toBeInstanceOf(ImageValidationError);
    const gif = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#000' } })
      .gif()
      .toBuffer();
    await expect(detectImageType(gif)).rejects.toThrow(/not allowed/);
  });
});

describe('processImage', () => {
  it('auto-orients, strips metadata and builds WebP + AVIF variants without upscaling', async () => {
    const source = await jpegWithExif(1300, 1000);
    expect((await sharp(source).metadata()).exif).toBeDefined();

    const result = await processImage(source);

    // Orientation 6 swaps the axes: the displayed image is 1000 × 1300.
    expect(result).toMatchObject({ mimeType: 'image/jpeg', width: 1000, height: 1300 });
    expect(result.checksum).toMatch(/^[0-9a-f]{64}$/);

    const widths = [...new Set(result.variants.map((v) => v.width))];
    expect(widths).toEqual([480, 640, 750, 960, 1000]);
    expect(result.variants.map((v) => v.format).sort()).toEqual([
      ...Array<string>(5).fill('avif'),
      ...Array<string>(5).fill('webp'),
    ]);

    for (const variant of result.variants) {
      const meta = await sharp(variant.buffer).metadata();
      expect(meta.format).toBe(variant.format === 'avif' ? 'heif' : 'webp');
      expect(meta.width).toBe(variant.width);
      expect(meta.height).toBe(variant.height);
      expect(variant.height).toBe(Math.round((variant.width * 1300) / 1000));
      expect(meta.exif).toBeUndefined();
      expect(meta.orientation ?? 1).toBe(1);
      expect(variant.sizeBytes).toBe(variant.buffer.length);
    }
  });

  it('returns a tiny blur placeholder and the dominant colour', async () => {
    const result = await processImage(await jpegWithExif(64, 48));
    expect(result.blurDataUrl).toMatch(/^data:image\/webp;base64,[A-Za-z0-9+/=]+$/);
    expect(result.blurDataUrl.length).toBeLessThan(1500);
    expect(result.dominantColor).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('rejects images larger than the pixel limit', async () => {
    const big = await sharp({
      create: { width: 3000, height: 3000, channels: 3, background: '#fff' },
    })
      .jpeg()
      .toBuffer();
    await expect(processImage(big, { maxPixels: 1_000_000 })).rejects.toBeInstanceOf(
      ImageValidationError,
    );
  });
});
