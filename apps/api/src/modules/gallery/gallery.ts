import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Injectable,
  Module,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  CACHE_TAGS,
  galleryItemCreateSchema,
  galleryItemUpdateSchema,
  reorderSchema,
  type GalleryItemCreateInput,
  type GalleryItemUpdateInput,
  type ReorderInput,
} from '@hotel-bambu/shared';
import { assertAllFound, nextSortOrder } from '../../common/ordering.js';
import { type AuthenticatedAdmin, CurrentAdmin } from '../../common/request-context.js';
import { zod } from '../../common/zod-validation.pipe.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AdminChangesService } from '../audit/admin-changes.service.js';
import { changedFields } from '../audit/audit.service.js';
import { PUBLIC_MEDIA_SELECT, isPublishableMedia } from '../media/media-url.js';

const TAGS = [CACHE_TAGS.gallery, CACHE_TAGS.site];

const notPublishable = () =>
  new UnprocessableEntityException({
    message: 'Only processed images with alternative text can be published.',
    details: [
      { path: 'published', message: 'Media is not READY or has no alt text.', code: 'publication' },
    ],
  });

/** Public gallery organisation (requirement 9.7). Deleting an item keeps the media asset. */
@Injectable()
export class GalleryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly changes: AdminChangesService,
  ) {}

  list() {
    return this.prisma.galleryItem.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: { mediaAsset: { select: PUBLIC_MEDIA_SELECT } },
    });
  }

  listPublished() {
    return this.prisma.galleryItem.findMany({
      where: { published: true, mediaAsset: { status: 'READY', altText: { not: null } } },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        category: true,
        featured: true,
        mediaAsset: { select: PUBLIC_MEDIA_SELECT },
      },
    });
  }

  async create(actorId: string, input: GalleryItemCreateInput) {
    const media = await this.prisma.mediaAsset.findUnique({
      where: { id: input.mediaAssetId },
      select: { status: true, altText: true },
    });
    if (!media) throw new UnprocessableEntityException('Unknown media id.');
    if (input.published && !isPublishableMedia(media)) throw notPublishable();
    const max = await this.prisma.galleryItem.aggregate({ _max: { sortOrder: true } });
    const item = await this.prisma.galleryItem.create({
      data: { ...input, sortOrder: input.sortOrder ?? nextSortOrder(max._max.sortOrder) },
    });
    await this.changes.record(
      actorId,
      { action: 'gallery.create', entity: 'GalleryItem', entityId: item.id },
      item.published ? TAGS : [],
    );
    return item;
  }

  async update(actorId: string, id: string, input: GalleryItemUpdateInput) {
    const current = await this.prisma.galleryItem.findUnique({
      where: { id },
      include: { mediaAsset: { select: { status: true, altText: true } } },
    });
    if (!current) throw new NotFoundException('Gallery item not found.');
    if (input.published && !isPublishableMedia(current.mediaAsset)) throw notPublishable();
    const item = await this.prisma.galleryItem.update({ where: { id }, data: input });
    await this.changes.record(
      actorId,
      {
        action: 'gallery.update',
        entity: 'GalleryItem',
        entityId: id,
        summary: { fields: changedFields(input) },
      },
      current.published || item.published ? TAGS : [],
    );
    return item;
  }

  async remove(actorId: string, id: string) {
    await this.prisma.galleryItem.delete({ where: { id } });
    await this.changes.record(
      actorId,
      { action: 'gallery.delete', entity: 'GalleryItem', entityId: id },
      TAGS,
    );
  }

  async reorder(actorId: string, ids: string[]) {
    assertAllFound(await this.prisma.galleryItem.count({ where: { id: { in: ids } } }), ids.length);
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.galleryItem.update({ where: { id }, data: { sortOrder: index } }),
      ),
    );
    await this.changes.record(actorId, { action: 'gallery.reorder', entity: 'GalleryItem' }, TAGS);
    return this.list();
  }
}

@Controller('admin/gallery')
export class GalleryController {
  constructor(private readonly gallery: GalleryService) {}

  @Get()
  list() {
    return this.gallery.list();
  }

  @Post()
  create(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Body(zod(galleryItemCreateSchema)) body: GalleryItemCreateInput,
  ) {
    return this.gallery.create(admin.id, body);
  }

  @Put('order')
  reorder(@CurrentAdmin() admin: AuthenticatedAdmin, @Body(zod(reorderSchema)) body: ReorderInput) {
    return this.gallery.reorder(admin.id, body.ids);
  }

  @Patch(':id')
  update(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(zod(galleryItemUpdateSchema)) body: GalleryItemUpdateInput,
  ) {
    return this.gallery.update(admin.id, id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentAdmin() admin: AuthenticatedAdmin, @Param('id', ParseUUIDPipe) id: string) {
    await this.gallery.remove(admin.id, id);
  }
}

@Module({
  controllers: [GalleryController],
  providers: [GalleryService],
  exports: [GalleryService],
})
export class GalleryModule {}
