import { z } from 'zod';

/** Lowercase kebab-case: letters/digits separated by single dashes. */
export const slugSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase kebab-case');

/** Converts free text (Spanish included) into a URL slug. Returns '' if nothing remains. */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const SLUG_MAX_LENGTH = 120;

/**
 * Slug for `text` that is not in `taken`: `base`, then `base-2`, `base-3`, ...
 * Uses `fallback` when the text has no sluggable characters. Always within the slug length limit.
 */
export function uniqueSlug(text: string, taken: ReadonlySet<string>, fallback = 'item'): string {
  const base = (slugify(text) || slugify(fallback) || 'item').slice(0, SLUG_MAX_LENGTH);
  const trimmed = base.replace(/-+$/, '');
  if (!taken.has(trimmed)) return trimmed;
  for (let n = 2; ; n += 1) {
    const suffix = `-${n}`;
    const candidate = `${trimmed.slice(0, SLUG_MAX_LENGTH - suffix.length).replace(/-+$/, '')}${suffix}`;
    if (!taken.has(candidate)) return candidate;
  }
}
