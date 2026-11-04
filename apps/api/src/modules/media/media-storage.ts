import type { ProcessedImage, VariantFormat } from './image-pipeline.js';
import type { ObjectStorage } from './object-storage.js';
import { randomStorageKey, variantObjectKey } from './storage-key.js';

/** Shape persisted in `MediaAsset.variants` (JSONB). */
export interface StoredVariant {
  width: number;
  height: number;
  format: VariantFormat;
  key: string;
  sizeBytes: number;
}

export interface StoredImage {
  storageKey: string;
  variants: StoredVariant[];
}

/**
 * Uploads every variant of a processed image under a fresh random key. If any upload fails, the
 * already-uploaded objects are removed (best effort) and the error is rethrown, so callers never
 * persist a MediaAsset pointing at a partial set.
 */
export async function storeProcessedImage(
  storage: ObjectStorage,
  image: ProcessedImage,
  storageKey: string = randomStorageKey(),
): Promise<StoredImage> {
  const uploaded: string[] = [];
  try {
    const variants: StoredVariant[] = [];
    for (const variant of image.variants) {
      const key = variantObjectKey(storageKey, variant.width, variant.format);
      await storage.putObject(key, variant.buffer, variant.mimeType);
      uploaded.push(key);
      variants.push({
        width: variant.width,
        height: variant.height,
        format: variant.format,
        key,
        sizeBytes: variant.sizeBytes,
      });
    }
    return { storageKey, variants };
  } catch (error) {
    await storage.deleteObjects(uploaded).catch(() => undefined);
    throw error;
  }
}
