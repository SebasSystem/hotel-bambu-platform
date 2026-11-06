import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_TAGS, type MediaUpdateInput, type MediaUploadFields } from '@hotel-bambu/shared';
import type { Env } from '../../config/env.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AdminChangesService } from '../audit/admin-changes.service.js';
import { changedFields } from '../audit/audit.service.js';
import { ImageValidationError, processImage } from './image-pipeline.js';
import { storeProcessedImage } from './media-storage.js';
import { storedVariants, variantUrl } from './media-url.js';
import type { ObjectStorage } from './object-storage.js';

export const OBJECT_STORAGE = Symbol('OBJECT_STORAGE');

/** Used when S3 credentials are not configured: uploads/deletes answer 503. */
export class UnconfiguredStorage implements ObjectStorage {
  private fail(): never {
    throw new ServiceUnavailableException('Object storage is not configured.');
  }
  putObject(): Promise<void> {
    return this.fail();
  }
  deleteObjects(): Promise<void> {
    return this.fail();
  }
  listKeys(): Promise<string[]> {
    return this.fail();
  }
}

/** Tags of every public page that can show a media asset. */
const MEDIA_TAGS = [CACHE_TAGS.site, CACHE_TAGS.rooms, CACHE_TAGS.gallery];

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly publicBaseUrl: string;
  private readonly maxBytes: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly changes: AdminChangesService,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
    config: ConfigService<Env, true>,
  ) {
    this.publicBaseUrl = config.get('S3_PUBLIC_URL', { infer: true });
    this.maxBytes = config.get('UPLOAD_MAX_BYTES', { infer: true });
  }

  private present<T extends { variants: unknown }>(asset: T) {
    return {
      ...asset,
      variants: storedVariants(asset.variants).map((v) => ({
        ...v,
        url: variantUrl(this.publicBaseUrl, v.key),
      })),
    };
  }

  async list(params: { page: number; pageSize: number; missingAlt?: boolean }) {
    const where = params.missingAlt ? { OR: [{ altText: null }, { altText: '' }] } : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.mediaAsset.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        include: {
          galleryItems: { select: { id: true, category: true, published: true } },
          _count: { select: { roomImages: true, heroSlides: true, sections: true } },
        },
      }),
      this.prisma.mediaAsset.count({ where }),
    ]);
    return {
      items: items.map((item) => this.present(item)),
      total,
      page: params.page,
      pageSize: params.pageSize,
    };
  }

  async get(id: string) {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundException('Media not found.');
    return this.present(asset);
  }

  /** Validates (magic bytes, size, pixels), strips metadata, renders variants, stores, persists. */
  async upload(actorId: string, file: Buffer, fields: MediaUploadFields) {
    let processed;
    try {
      processed = await processImage(file, { maxBytes: this.maxBytes });
    } catch (error) {
      if (error instanceof ImageValidationError) {
        throw new UnprocessableEntityException({
          message: 'Invalid image.',
          details: [{ path: 'file', message: error.message, code: 'invalid_image' }],
        });
      }
      throw error;
    }

    const existing = await this.prisma.mediaAsset.findUnique({
      where: { checksum: processed.checksum },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException({
        message: 'This image was already uploaded.',
        mediaAssetId: existing.id,
      });
    }

    const stored = await storeProcessedImage(this.storage, processed);
    let asset;
    try {
      asset = await this.prisma.$transaction(async (tx) => {
        const created = await tx.mediaAsset.create({
          data: {
            storageKey: stored.storageKey,
            kind: 'IMAGE',
            mimeType: processed.mimeType,
            checksum: processed.checksum,
            sizeBytes: processed.sizeBytes,
            width: processed.width,
            height: processed.height,
            variants: stored.variants as object[],
            blurDataUrl: processed.blurDataUrl,
            dominantColor: processed.dominantColor,
            altText: fields.altText,
            caption: fields.caption ?? null,
            status: 'READY',
          },
        });
        if (fields.galleryCategory) {
          const max = await tx.galleryItem.aggregate({ _max: { sortOrder: true } });
          await tx.galleryItem.create({
            data: {
              mediaAssetId: created.id,
              category: fields.galleryCategory,
              sortOrder: (max._max.sortOrder ?? -1) + 1,
            },
          });
        }
        return created;
      });
    } catch (error) {
      // Do not leave orphan objects when the row could not be written.
      await this.deleteObjectsOrQueue(
        stored.storageKey,
        stored.variants.map((v) => v.key),
      );
      throw error;
    }

    await this.changes.record(actorId, {
      action: 'media.upload',
      entity: 'MediaAsset',
      entityId: asset.id,
      summary: { variants: stored.variants.length, gallery: fields.galleryCategory ?? null },
    });
    return this.present(asset);
  }

  async update(actorId: string, id: string, input: MediaUpdateInput) {
    const asset = await this.prisma.mediaAsset.update({ where: { id }, data: input });
    await this.changes.record(
      actorId,
      {
        action: 'media.update',
        entity: 'MediaAsset',
        entityId: id,
        summary: { fields: changedFields(input) },
      },
      MEDIA_TAGS,
    );
    return this.present(asset);
  }

  /**
   * Deletes the row (gallery entries cascade) and then the stored objects. Assets still used by a
   * room, hero slide, landing section or the hotel profile are refused with 409. Failed object
   * deletions are queued in PendingStorageDeletion (requirement 10).
   */
  async remove(actorId: string, id: string): Promise<void> {
    const asset = await this.prisma.mediaAsset.findUnique({
      where: { id },
      select: {
        storageKey: true,
        variants: true,
        _count: {
          select: {
            roomImages: true,
            heroSlides: true,
            sections: true,
            hotelLogos: true,
            hotelHeroes: true,
            hotelVideos: true,
          },
        },
      },
    });
    if (!asset) throw new NotFoundException('Media not found.');
    const usage = Object.entries(asset._count).filter(([, count]) => count > 0);
    if (usage.length > 0) {
      throw new ConflictException({
        message:
          'Media is in use. Remove it from rooms, hero slides, sections or the hotel profile first.',
        usage: Object.fromEntries(usage),
      });
    }

    await this.prisma.mediaAsset.delete({ where: { id } });
    await this.deleteObjectsOrQueue(
      asset.storageKey,
      storedVariants(asset.variants).map((v) => v.key),
    );
    await this.changes.record(
      actorId,
      { action: 'media.delete', entity: 'MediaAsset', entityId: id },
      MEDIA_TAGS,
    );
  }

  private async deleteObjectsOrQueue(storageKey: string, keys: string[]): Promise<void> {
    try {
      await this.storage.deleteObjects(keys);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Storage deletion failed for ${storageKey}; queued for retry: ${message}`);
      await this.prisma.pendingStorageDeletion.create({
        data: { storageKey, attempts: 1, lastError: message.slice(0, 500) },
      });
    }
  }
}
