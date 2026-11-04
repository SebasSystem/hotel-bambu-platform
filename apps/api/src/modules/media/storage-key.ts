import { randomBytes } from 'node:crypto';
import type { VariantFormat } from './image-pipeline.js';

/**
 * Random, non-guessable storage prefix (requirement 15.3: random internal names). Never derived
 * from the original filename, which may contain personal data.
 */
export function randomStorageKey(now: Date = new Date()): string {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `media/${year}/${month}/${randomBytes(16).toString('hex')}`;
}

export function variantObjectKey(storageKey: string, width: number, format: VariantFormat): string {
  return `${storageKey}/${width}.${format}`;
}
