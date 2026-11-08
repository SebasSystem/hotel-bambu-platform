import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api/client';
import type { MediaAsset } from '@/lib/api/types';
import {
  MAX_IMAGE_BYTES,
  altTextError,
  uploadImage,
  validateImageFile,
  type UploadApi,
} from './media-upload';

const file = (type = 'image/jpeg', size = 1024, name = 'foto.jpg') =>
  new File([new Uint8Array(size)], name, { type });

const asset = (overrides: Partial<MediaAsset> = {}): MediaAsset =>
  ({
    id: 'm1',
    status: 'READY',
    altText: 'Habitación doble',
    variants: [],
    width: 1920,
    height: 1080,
    ...overrides,
  }) as MediaAsset;

// Mocks return MediaAsset; the client methods are generic, hence the cast.
function fakeApi(overrides: Record<string, unknown> = {}): UploadApi {
  return {
    post: vi.fn(async () => asset()),
    get: vi.fn(async () => asset()),
    ...overrides,
  } as unknown as UploadApi;
}

describe('validateImageFile', () => {
  it('accepts JPG, PNG and WebP up to the API limit', () => {
    expect(validateImageFile(file('image/jpeg'))).toBeNull();
    expect(validateImageFile(file('image/png'))).toBeNull();
    expect(validateImageFile(file('image/webp', MAX_IMAGE_BYTES))).toBeNull();
  });

  it('rejects other formats and files over 15 MB with a Spanish reason', () => {
    expect(validateImageFile(file('image/gif', 10, 'a.gif'))).toBe(
      'a.gif: formato no permitido. Use JPG, PNG o WebP.',
    );
    expect(validateImageFile(file('image/jpeg', MAX_IMAGE_BYTES + 1, 'big.jpg'))).toBe(
      'big.jpg: el archivo supera 15 MB.',
    );
  });
});

describe('altTextError', () => {
  it('requires 1–250 characters after trimming, like the API', () => {
    expect(altTextError('   ')).toBe('Escriba el texto alternativo.');
    expect(altTextError('x'.repeat(251))).toBe('Máximo 250 caracteres.');
    expect(altTextError(' Vista al jardín ')).toBeNull();
  });
});

describe('uploadImage', () => {
  it('sends the text fields before the file part', async () => {
    const api = fakeApi();
    await uploadImage(api, { file: file(), altText: ' Cama doble ', caption: 'Piso 2' });
    const body = (api.post as ReturnType<typeof vi.fn>).mock.calls[0]![1] as FormData;
    expect([...body.keys()]).toEqual(['altText', 'caption', 'file']);
    expect(body.get('altText')).toBe('Cama doble');
  });

  it('waits until the image is processed (READY)', async () => {
    const get = vi
      .fn()
      .mockResolvedValueOnce(asset({ status: 'PROCESSING' }))
      .mockResolvedValueOnce(asset({ status: 'READY' }));
    const api = fakeApi({ post: vi.fn(async () => asset({ status: 'PROCESSING' })), get });
    const onStatus = vi.fn();
    const result = await uploadImage(
      api,
      { file: file(), altText: 'Cama' },
      { onStatus, sleep: async () => {} },
    );
    expect(result.status).toBe('READY');
    expect(get).toHaveBeenCalledTimes(2);
    expect(onStatus.mock.calls.map(([s]) => s)).toEqual(['uploading', 'processing']);
  });

  it('returns the still-processing asset when polling gives up', async () => {
    const api = fakeApi({
      post: vi.fn(async () => asset({ status: 'PROCESSING' })),
      get: vi.fn(async () => asset({ status: 'PROCESSING' })),
    });
    const result = await uploadImage(
      api,
      { file: file(), altText: 'Cama' },
      { sleep: async () => {}, maxPolls: 3 },
    );
    expect(result.status).toBe('PROCESSING');
    expect(api.get).toHaveBeenCalledTimes(3);
  });

  it('reuses the existing asset when the same image was already uploaded (409)', async () => {
    const api = fakeApi({
      post: vi.fn(async () => {
        throw new ApiError(409, { statusCode: 409, mediaAssetId: 'old' } as never);
      }),
      get: vi.fn(async () => asset({ id: 'old' })),
    });
    const result = await uploadImage(api, { file: file(), altText: 'Cama' });
    expect(result.id).toBe('old');
    expect(api.get).toHaveBeenCalledWith('/admin/media/old');
  });

  it('explains an invalid image and a failed processing in Spanish', async () => {
    const invalid = fakeApi({
      post: vi.fn(async () => {
        throw new ApiError(422, {
          statusCode: 422,
          details: [{ path: 'file', message: 'x', code: 'invalid_image' }],
        });
      }),
    });
    await expect(uploadImage(invalid, { file: file(), altText: 'Cama' })).rejects.toThrow(
      'El archivo no es una imagen válida.',
    );
    const failed = fakeApi({ post: vi.fn(async () => asset({ status: 'FAILED' })) });
    await expect(uploadImage(failed, { file: file(), altText: 'Cama' })).rejects.toThrow(
      'No se pudo procesar la imagen.',
    );
  });
});
