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
  heroSlideCreateSchema,
  heroSlideUpdateSchema,
  reorderSchema,
  type HeroSlideCreateInput,
  type HeroSlideUpdateInput,
  type ReorderInput,
} from '@hotel-bambu/shared';
import { assertAllFound, nextSortOrder } from '../../common/ordering.js';
import { type AuthenticatedAdmin, CurrentAdmin } from '../../common/request-context.js';
import { zod } from '../../common/zod-validation.pipe.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AdminChangesService } from '../audit/admin-changes.service.js';
import { changedFields } from '../audit/audit.service.js';
import { PUBLIC_MEDIA_SELECT, isPublishableMedia, type MediaRow } from '../media/media-url.js';

/** The home hero is part of GET /public/site. */
const TAGS = [CACHE_TAGS.site];

const notPublishable = () =>
  new UnprocessableEntityException({
    message: 'Only processed images with alternative text can be shown in the hero.',
    details: [
      { path: 'active', message: 'Media is not READY or has no alt text.', code: 'publication' },
    ],
  });

/** Media as the slide shows it: the slide alt text overrides the media one. */
export function slideMedia<T extends Pick<MediaRow, 'altText'>>(
  slide: { altText: string | null },
  media: T,
): T {
  return { ...media, altText: slide.altText?.trim() ? slide.altText : media.altText };
}

/** Ordered home hero carousel (spec §7 Home). Deleting a slide keeps the media asset. */
@Injectable()
export class HeroSlidesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly changes: AdminChangesService,
  ) {}

  list() {
    return this.prisma.heroSlide.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: { mediaAsset: { select: PUBLIC_MEDIA_SELECT } },
    });
  }

  /** Active slides whose media (with the slide alt override) is publishable. */
  async listPublic() {
    const slides = await this.prisma.heroSlide.findMany({
      where: { active: true, mediaAsset: { status: 'READY' } },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        altText: true,
        caption: true,
        mediaAsset: { select: PUBLIC_MEDIA_SELECT },
      },
    });
    return slides
      .map((slide) => ({
        id: slide.id,
        caption: slide.caption,
        media: slideMedia(slide, slide.mediaAsset),
      }))
      .filter((slide) => isPublishableMedia(slide.media));
  }

  async create(actorId: string, input: HeroSlideCreateInput) {
    const media = await this.prisma.mediaAsset.findUnique({
      where: { id: input.mediaAssetId },
      select: { status: true, altText: true },
    });
    if (!media) throw new UnprocessableEntityException('Unknown media id.');
    if (
      input.active &&
      !isPublishableMedia(slideMedia({ altText: input.altText ?? null }, media))
    ) {
      throw notPublishable();
    }
    const max = await this.prisma.heroSlide.aggregate({ _max: { sortOrder: true } });
    const slide = await this.prisma.heroSlide.create({
      data: { ...input, sortOrder: input.sortOrder ?? nextSortOrder(max._max.sortOrder) },
    });
    await this.changes.record(
      actorId,
      { action: 'heroSlide.create', entity: 'HeroSlide', entityId: slide.id },
      TAGS,
    );
    return slide;
  }

  async update(actorId: string, id: string, input: HeroSlideUpdateInput) {
    const current = await this.prisma.heroSlide.findUnique({
      where: { id },
      include: { mediaAsset: { select: { status: true, altText: true } } },
    });
    if (!current) throw new NotFoundException('Hero slide not found.');
    const media =
      input.mediaAssetId && input.mediaAssetId !== current.mediaAssetId
        ? await this.prisma.mediaAsset.findUnique({
            where: { id: input.mediaAssetId },
            select: { status: true, altText: true },
          })
        : current.mediaAsset;
    if (!media) throw new UnprocessableEntityException('Unknown media id.');
    const next = { ...current, ...input };
    if (next.active && !isPublishableMedia(slideMedia(next, media))) {
      throw notPublishable();
    }
    const slide = await this.prisma.heroSlide.update({ where: { id }, data: input });
    await this.changes.record(
      actorId,
      {
        action: 'heroSlide.update',
        entity: 'HeroSlide',
        entityId: id,
        summary: { fields: changedFields(input) },
      },
      TAGS,
    );
    return slide;
  }

  async remove(actorId: string, id: string) {
    await this.prisma.heroSlide.delete({ where: { id } });
    await this.changes.record(
      actorId,
      { action: 'heroSlide.delete', entity: 'HeroSlide', entityId: id },
      TAGS,
    );
  }

  async reorder(actorId: string, ids: string[]) {
    assertAllFound(await this.prisma.heroSlide.count({ where: { id: { in: ids } } }), ids.length);
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.heroSlide.update({ where: { id }, data: { sortOrder: index } }),
      ),
    );
    await this.changes.record(actorId, { action: 'heroSlide.reorder', entity: 'HeroSlide' }, TAGS);
    return this.list();
  }
}

@Controller('admin/hero-slides')
export class HeroSlidesController {
  constructor(private readonly slides: HeroSlidesService) {}

  @Get()
  list() {
    return this.slides.list();
  }

  @Post()
  create(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Body(zod(heroSlideCreateSchema)) body: HeroSlideCreateInput,
  ) {
    return this.slides.create(admin.id, body);
  }

  @Put('order')
  reorder(@CurrentAdmin() admin: AuthenticatedAdmin, @Body(zod(reorderSchema)) body: ReorderInput) {
    return this.slides.reorder(admin.id, body.ids);
  }

  @Patch(':id')
  update(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(zod(heroSlideUpdateSchema)) body: HeroSlideUpdateInput,
  ) {
    return this.slides.update(admin.id, id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentAdmin() admin: AuthenticatedAdmin, @Param('id', ParseUUIDPipe) id: string) {
    await this.slides.remove(admin.id, id);
  }
}

@Module({
  controllers: [HeroSlidesController],
  providers: [HeroSlidesService],
  exports: [HeroSlidesService],
})
export class HeroSlidesModule {}
