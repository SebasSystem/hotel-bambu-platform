/** Picks a preview URL from stored variants (`{ key | url, width, format }`). Pure. */
export interface VariantLike {
  key?: string;
  url?: string;
  width: number;
  format: string;
}

function isVariant(value: unknown): value is VariantLike {
  const v = value as Partial<VariantLike> | null;
  return (
    !!v && typeof v.width === 'number' && (typeof v.key === 'string' || typeof v.url === 'string')
  );
}

export function variantUrl(baseUrl: string, key: string): string {
  return `${baseUrl.replace(/\/$/, '')}/${key.split('/').map(encodeURIComponent).join('/')}`;
}

/** Smallest WebP variant at least `minWidth` wide (falls back to the closest one). */
export function thumbnailUrl(variants: unknown, baseUrl: string, minWidth = 320): string | null {
  if (!Array.isArray(variants)) return null;
  const candidates = variants.filter(isVariant).sort((a, b) => a.width - b.width);
  if (candidates.length === 0) return null;
  const webp = candidates.filter((v) => v.format === 'webp');
  const pool = webp.length > 0 ? webp : candidates;
  const chosen = pool.find((v) => v.width >= minWidth) ?? pool.at(-1);
  if (!chosen) return null;
  if (chosen.url) return chosen.url;
  return chosen.key ? variantUrl(baseUrl, chosen.key) : null;
}
