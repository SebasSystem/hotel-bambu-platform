import { altTextSchema } from '@hotel-bambu/shared';
import { isApiError } from '@/lib/api/client';
import type { MediaAsset } from '@/lib/api/types';
import { describeApiError } from '@/lib/forms/form-errors';

/** Same limits as the API (UPLOAD_MAX_BYTES, image pipeline formats). */
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const ALT_TEXT_MAX = 250;

/** Client-side check before sending a file; `null` when the API would accept it. */
export function validateImageFile(file: Pick<File, 'name' | 'type' | 'size'>): string | null {
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return `${file.name}: formato no permitido. Use JPG, PNG o WebP.`;
  }
  if (file.size > MAX_IMAGE_BYTES) return `${file.name}: el archivo supera 15 MB.`;
  return null;
}

/** Mirrors `altTextSchema` (1–250 characters after trimming). */
export function altTextError(value: string): string | null {
  if (altTextSchema.safeParse(value).success) return null;
  return value.trim().length === 0
    ? 'Escriba el texto alternativo.'
    : `Máximo ${ALT_TEXT_MAX} caracteres.`;
}

/** The part of the admin API client the upload needs (injectable in tests). */
export interface UploadApi {
  post: <T>(path: string, body?: unknown) => Promise<T>;
  get: <T>(path: string) => Promise<T>;
}

export type UploadPhase = 'uploading' | 'processing';

export interface UploadRequest {
  file: File;
  altText: string;
  caption?: string;
  /** Also adds the upload to the gallery (unpublished) in this category. */
  galleryCategory?: string;
}

export interface UploadOptions {
  onStatus?: (phase: UploadPhase) => void;
  /** Polls while the asset is not READY; the API normally answers READY already. */
  maxPolls?: number;
  pollIntervalMs?: number;
  sleep?: (ms: number) => Promise<void>;
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Error with a Spanish message that can be shown next to the file. */
export class UploadError extends Error {}

function describeUploadError(error: unknown): string {
  if (isApiError(error)) {
    if (error.details.some((detail) => detail.path === 'file')) {
      return 'El archivo no es una imagen válida.';
    }
    if (error.details.some((detail) => detail.path === 'altText')) {
      return 'Revise el texto alternativo (1 a 250 caracteres).';
    }
  }
  return describeApiError(error);
}

/**
 * Uploads one image (multipart: text fields first, then the file — API contract) and resolves with
 * the stored asset once it is processed. A repeated image (409) resolves with the existing asset.
 * If processing outlasts the polls, resolves with the asset as it is (not READY yet).
 */
export async function uploadImage(
  api: UploadApi,
  request: UploadRequest,
  options: UploadOptions = {},
): Promise<MediaAsset> {
  const { onStatus, maxPolls = 40, pollIntervalMs = 1500, sleep = wait } = options;
  const body = new FormData();
  body.append('altText', request.altText.trim());
  if (request.caption?.trim()) body.append('caption', request.caption.trim());
  if (request.galleryCategory) body.append('galleryCategory', request.galleryCategory);
  body.append('file', request.file);

  onStatus?.('uploading');
  let media: MediaAsset;
  try {
    media = await api.post<MediaAsset>('/admin/media', body);
  } catch (error) {
    const existingId =
      isApiError(error) && error.status === 409
        ? (error.body as { mediaAssetId?: unknown }).mediaAssetId
        : undefined;
    if (typeof existingId !== 'string') throw new UploadError(describeUploadError(error));
    media = await api.get<MediaAsset>(`/admin/media/${existingId}`);
  }

  for (let poll = 0; media.status !== 'READY' && media.status !== 'FAILED'; poll++) {
    if (poll >= maxPolls) return media;
    if (poll === 0) onStatus?.('processing');
    await sleep(pollIntervalMs);
    media = await api.get<MediaAsset>(`/admin/media/${media.id}`);
  }
  if (media.status === 'FAILED') throw new UploadError('No se pudo procesar la imagen.');
  return media;
}
