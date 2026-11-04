import { describe, expect, it } from 'vitest';
import { randomStorageKey, variantObjectKey } from './storage-key.js';

describe('randomStorageKey', () => {
  it('builds a dated prefix with 128 random bits and no source filename', () => {
    const key = randomStorageKey(new Date('2026-11-04T12:00:00Z'));
    expect(key).toMatch(/^media\/2026\/11\/[0-9a-f]{32}$/);
  });

  it('does not repeat', () => {
    const keys = new Set(Array.from({ length: 200 }, () => randomStorageKey()));
    expect(keys.size).toBe(200);
  });
});

describe('variantObjectKey', () => {
  it('nests variants under the asset key by width and format', () => {
    expect(variantObjectKey('media/2026/11/abc', 640, 'avif')).toBe('media/2026/11/abc/640.avif');
  });
});
