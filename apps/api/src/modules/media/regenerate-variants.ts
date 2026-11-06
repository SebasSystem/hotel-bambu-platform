import {
  VARIANT_FORMATS,
  planVariantWidths,
  renderVariant,
  type VariantFormat,
} from './image-pipeline.js';
import type { StoredVariant } from './media-storage.js';
import { storedVariants } from './media-url.js';
import type { ObjectStorage } from './object-storage.js';
import { variantObjectKey } from './storage-key.js';

/**
 * Adds the variant widths an existing asset lacks (e.g. after VARIANT_WIDTHS grew) without the
 * original upload: originals are not kept (ADR 0002), so new widths are derived from the widest
 * stored variant. Only smaller widths are rendered (never upscaled), the stored keys are immutable
 * and never rewritten, and the new objects sit next to the old ones under the same storage key.
 * Used by `media:variants` (src/scripts/media-variants.ts).
 */

export interface VariantTarget {
  width: number;
  format: VariantFormat;
}

/** Storage operations regeneration needs: read a variant, write and clean up new ones. */
export interface VariantSourceStorage extends Pick<ObjectStorage, 'putObject' | 'deleteObjects'> {
  getObject(key: string): Promise<Buffer>;
}

export interface RegenerableAsset {
  storageKey: string;
  /** Displayed width of the original; null for legacy rows. */
  width: number | null;
  /** `MediaAsset.variants` as stored (JSONB). */
  variants: unknown;
}

export interface RegeneratedVariants {
  added: StoredVariant[];
  /** Existing + added, ordered by width then format (the shape persisted in MediaAsset.variants). */
  variants: StoredVariant[];
}

function byWidthThenFormat(a: StoredVariant, b: StoredVariant): number {
  return a.width - b.width || a.format.localeCompare(b.format);
}

/** Widest stored variant, WebP first at equal width (the lighter decode of the two). */
export function pickRegenerationSource(stored: readonly StoredVariant[]): StoredVariant | null {
  let best: StoredVariant | null = null;
  for (const variant of stored) {
    if (
      !best ||
      variant.width > best.width ||
      (variant.width === best.width && variant.format === 'webp' && best.format !== 'webp')
    ) {
      best = variant;
    }
  }
  return best;
}

/** Planned (width, format) pairs that are missing, limited to the widest stored variant. */
export function planMissingVariants(
  assetWidth: number | null,
  stored: readonly StoredVariant[],
): VariantTarget[] {
  const source = pickRegenerationSource(stored);
  if (!source) return [];
  const have = new Set(stored.map((v) => `${v.width}.${v.format}`));
  const missing: VariantTarget[] = [];
  for (const width of planVariantWidths(assetWidth ?? source.width)) {
    if (width > source.width) continue;
    for (const format of VARIANT_FORMATS) {
      if (!have.has(`${width}.${format}`)) missing.push({ width, format });
    }
  }
  return missing;
}

/**
 * Renders and uploads the missing variants of one asset. If an upload fails, the objects uploaded
 * so far are removed (best effort) and the error is rethrown, so the caller never records a
 * partial set. The caller persists `variants` on the MediaAsset row.
 */
export async function regenerateMissingVariants(
  asset: RegenerableAsset,
  storage: VariantSourceStorage,
): Promise<RegeneratedVariants> {
  const stored = storedVariants(asset.variants);
  const missing = planMissingVariants(asset.width, stored);
  const source = pickRegenerationSource(stored);
  if (missing.length === 0 || !source) {
    return { added: [], variants: [...stored].sort(byWidthThenFormat) };
  }

  const input = await storage.getObject(source.key);
  const added: StoredVariant[] = [];
  try {
    for (const target of missing) {
      const variant = await renderVariant(input, target.width, target.format);
      const key = variantObjectKey(asset.storageKey, target.width, target.format);
      await storage.putObject(key, variant.buffer, variant.mimeType);
      added.push({
        width: variant.width,
        height: variant.height,
        format: variant.format,
        key,
        sizeBytes: variant.sizeBytes,
      });
    }
  } catch (error) {
    await storage.deleteObjects(added.map((v) => v.key)).catch(() => undefined);
    throw error;
  }
  return { added, variants: [...stored, ...added].sort(byWidthThenFormat) };
}
