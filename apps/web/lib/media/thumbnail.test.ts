import { describe, expect, it } from 'vitest';
import { thumbnailUrl } from './thumbnail';

describe('thumbnailUrl', () => {
  const variants = [
    { key: 'media/a/1280.avif', width: 1280, height: 960, format: 'avif' },
    { key: 'media/a/960.webp', width: 960, height: 720, format: 'webp' },
    { key: 'media/a/640.webp', width: 640, height: 480, format: 'webp' },
  ];

  it('builds the URL of the smallest suitable WebP variant from its key', () => {
    expect(thumbnailUrl(variants, 'http://cdn.test/bucket/')).toBe(
      'http://cdn.test/bucket/media/a/640.webp',
    );
    expect(thumbnailUrl(variants, 'http://cdn.test/bucket', 900)).toBe(
      'http://cdn.test/bucket/media/a/960.webp',
    );
  });

  it('prefers a ready-made url and tolerates invalid input', () => {
    expect(thumbnailUrl([{ url: 'http://x/y.webp', width: 640, format: 'webp' }], '')).toBe(
      'http://x/y.webp',
    );
    expect(thumbnailUrl(null, 'http://x')).toBeNull();
    expect(thumbnailUrl([], 'http://x')).toBeNull();
  });
});
