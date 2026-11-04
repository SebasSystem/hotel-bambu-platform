import type { PublicMedia } from '@hotel-bambu/shared';
import { describe, expect, it } from 'vitest';
import { mediaFallback, mediaSize, mediaSrcSet } from './media';

const media: PublicMedia = {
  id: 'm1',
  altText: 'Habitación',
  caption: null,
  width: null,
  height: null,
  blurDataUrl: null,
  dominantColor: null,
  variants: [
    { width: 960, height: 1280, format: 'webp', url: 'https://cdn.test/960.webp' },
    { width: 640, height: 853, format: 'avif', url: 'https://cdn.test/640.avif' },
    { width: 640, height: 853, format: 'webp', url: 'https://cdn.test/640.webp' },
    { width: 960, height: 1280, format: 'avif', url: 'https://cdn.test/960.avif' },
  ],
};

describe('media helpers', () => {
  it('builds a width-sorted srcset per format', () => {
    expect(mediaSrcSet(media, 'avif')).toBe(
      'https://cdn.test/640.avif 640w, https://cdn.test/960.avif 960w',
    );
  });

  it('uses the largest WebP as fallback and its size when intrinsic size is unknown', () => {
    expect(mediaFallback(media)?.url).toBe('https://cdn.test/960.webp');
    expect(mediaSize(media)).toEqual({ width: 960, height: 1280 });
  });
});
