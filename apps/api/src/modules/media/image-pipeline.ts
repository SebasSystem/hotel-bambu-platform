import { createHash } from 'node:crypto';
import { fileTypeFromBuffer } from 'file-type';
import sharp, { type OutputInfo } from 'sharp';

/**
 * Pure image pipeline (requirements 15.3, 16.5; ADR 0002). No I/O: callers (media:import, the
 * admin upload endpoint) handle storage and persistence.
 */

export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

export const VARIANT_WIDTHS = [640, 960, 1280, 1920] as const;
export const VARIANT_FORMATS = ['avif', 'webp'] as const;
export type VariantFormat = (typeof VARIANT_FORMATS)[number];

export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
export const MAX_IMAGE_PIXELS = 40_000_000;

const BLUR_WIDTH = 16;
const QUALITY: Record<VariantFormat, number> = { avif: 55, webp: 78 };

export class ImageValidationError extends Error {
  override readonly name = 'ImageValidationError';
}

export interface ImageVariant {
  width: number;
  height: number;
  format: VariantFormat;
  mimeType: `image/${VariantFormat}`;
  sizeBytes: number;
  buffer: Buffer;
}

export interface ProcessedImage {
  mimeType: AllowedImageMimeType;
  /** Displayed dimensions after auto-orientation. */
  width: number;
  height: number;
  sizeBytes: number;
  /** SHA-256 of the original bytes (deduplication). */
  checksum: string;
  variants: ImageVariant[];
  blurDataUrl: string;
  dominantColor: string;
}

export interface ProcessImageOptions {
  maxBytes?: number;
  maxPixels?: number;
}

/** Real type from magic bytes; rejects anything but JPEG/PNG/WebP (SVG, GIF, HEIC, text...). */
export async function detectImageType(buffer: Uint8Array): Promise<AllowedImageMimeType> {
  const detected = await fileTypeFromBuffer(buffer);
  const mime = detected?.mime;
  if (!mime || !(ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(mime)) {
    throw new ImageValidationError(`File type ${mime ?? 'unknown'} is not allowed`);
  }
  return mime as AllowedImageMimeType;
}

/** Standard widths below the source, plus the source width itself (capped at 1920). No upscaling. */
export function planVariantWidths(sourceWidth: number): number[] {
  const max = VARIANT_WIDTHS[VARIANT_WIDTHS.length - 1] ?? 1920;
  const top = Math.min(sourceWidth, max);
  const widths: number[] = VARIANT_WIDTHS.filter((w) => w < top);
  widths.push(top);
  return widths;
}

function toHex(value: number): string {
  return Math.max(0, Math.min(255, Math.round(value)))
    .toString(16)
    .padStart(2, '0');
}

/**
 * Validates and processes an uploaded image: checks size, real type and pixel count, auto-orients,
 * strips all metadata (EXIF/GPS/ICC comments; sharp drops metadata unless asked to keep it) and
 * renders AVIF + WebP variants, a blur placeholder and the dominant colour.
 */
export async function processImage(
  input: Buffer,
  options: ProcessImageOptions = {},
): Promise<ProcessedImage> {
  const maxBytes = options.maxBytes ?? MAX_IMAGE_BYTES;
  const maxPixels = options.maxPixels ?? MAX_IMAGE_PIXELS;

  if (input.length === 0 || input.length > maxBytes) {
    throw new ImageValidationError(`Image size must be between 1 byte and ${maxBytes} bytes`);
  }
  const mimeType = await detectImageType(input);

  const sharpOptions = { limitInputPixels: maxPixels, failOn: 'error' as const };
  let oriented: { data: Buffer; info: OutputInfo };
  try {
    // Decode once, apply EXIF orientation, keep a lossless intermediate without metadata.
    oriented = await sharp(input, sharpOptions)
      .autoOrient()
      .png({ compressionLevel: 0 })
      .toBuffer({ resolveWithObject: true });
  } catch (error) {
    throw new ImageValidationError(
      `Image could not be decoded: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  const { width, height } = oriented.info;
  const base = () => sharp(oriented.data, { limitInputPixels: maxPixels });

  const variants: ImageVariant[] = [];
  for (const targetWidth of planVariantWidths(width)) {
    for (const format of VARIANT_FORMATS) {
      const pipeline = base().resize({ width: targetWidth, withoutEnlargement: true });
      const encoded =
        format === 'avif'
          ? pipeline.avif({ quality: QUALITY.avif, effort: 4 })
          : pipeline.webp({ quality: QUALITY.webp, effort: 4 });
      const { data, info } = await encoded.toBuffer({ resolveWithObject: true });
      variants.push({
        width: info.width,
        height: info.height,
        format,
        mimeType: `image/${format}`,
        sizeBytes: data.length,
        buffer: data,
      });
    }
  }

  const blur = await base().resize({ width: BLUR_WIDTH }).blur(1).webp({ quality: 40 }).toBuffer();
  const { dominant } = await base().stats();

  return {
    mimeType,
    width,
    height,
    sizeBytes: input.length,
    checksum: createHash('sha256').update(input).digest('hex'),
    variants,
    blurDataUrl: `data:image/webp;base64,${blur.toString('base64')}`,
    dominantColor: `#${toHex(dominant.r)}${toHex(dominant.g)}${toHex(dominant.b)}`,
  };
}
