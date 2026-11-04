import { describe, expect, it, vi } from 'vitest';
import type { ProcessedImage } from './image-pipeline.js';
import { storeProcessedImage } from './media-storage.js';
import type { ObjectStorage } from './object-storage.js';

function fakeImage(): ProcessedImage {
  const variant = (width: number, format: 'avif' | 'webp') => ({
    width,
    height: width,
    format,
    mimeType: `image/${format}` as const,
    sizeBytes: 3,
    buffer: Buffer.from([1, 2, 3]),
  });
  return {
    mimeType: 'image/jpeg',
    width: 960,
    height: 960,
    sizeBytes: 10,
    checksum: 'x'.repeat(64),
    variants: [variant(640, 'avif'), variant(640, 'webp'), variant(960, 'avif')],
    blurDataUrl: 'data:image/webp;base64,AA==',
    dominantColor: '#000000',
  };
}

function fakeStorage(failOnCall?: number): ObjectStorage & { deleted: string[] } {
  let calls = 0;
  const deleted: string[] = [];
  return {
    deleted,
    putObject: vi.fn(async () => {
      calls += 1;
      if (calls === failOnCall) throw new Error('network down');
    }),
    deleteObjects: vi.fn(async (keys: readonly string[]) => {
      deleted.push(...keys);
    }),
    listKeys: vi.fn(async () => []),
  };
}

describe('storeProcessedImage', () => {
  it('uploads each variant under the storage key with its content type', async () => {
    const storage = fakeStorage();
    const stored = await storeProcessedImage(storage, fakeImage(), 'media/2026/11/k');

    expect(stored.storageKey).toBe('media/2026/11/k');
    expect(stored.variants.map((v) => v.key)).toEqual([
      'media/2026/11/k/640.avif',
      'media/2026/11/k/640.webp',
      'media/2026/11/k/960.avif',
    ]);
    expect(storage.putObject).toHaveBeenCalledWith(
      'media/2026/11/k/640.webp',
      expect.any(Buffer),
      'image/webp',
    );
  });

  it('removes already uploaded variants when a later upload fails', async () => {
    const storage = fakeStorage(3);
    await expect(storeProcessedImage(storage, fakeImage(), 'k')).rejects.toThrow('network down');
    expect(storage.deleted).toEqual(['k/640.avif', 'k/640.webp']);
  });
});
