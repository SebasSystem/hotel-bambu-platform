import {
  Body,
  Controller,
  Get,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Put,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  CACHE_TAGS,
  landingSectionKeySchema,
  landingSectionUpdateSchema,
  type LandingSectionUpdateInput,
} from '@hotel-bambu/shared';
import type { z } from 'zod';
import { type AuthenticatedAdmin, CurrentAdmin } from '../../common/request-context.js';
import { zod } from '../../common/zod-validation.pipe.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AdminChangesService } from '../audit/admin-changes.service.js';
import { changedFields } from '../audit/audit.service.js';
import { PUBLIC_MEDIA_SELECT, isPublishableMedia } from '../media/media-url.js';

type SectionKey = z.output<typeof landingSectionKeySchema>;

/** Fixed landing sections (requirement 9.8): the code owns the layout, admins edit fields only. */
@Injectable()
export class ContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly changes: AdminChangesService,
  ) {}

  list() {
    return this.prisma.landingSection.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { mediaAsset: { select: PUBLIC_MEDIA_SELECT } },
    });
  }

  async get(key: SectionKey) {
    const section = await this.prisma.landingSection.findUnique({
      where: { key },
      include: { mediaAsset: { select: PUBLIC_MEDIA_SELECT } },
    });
    if (!section) throw new NotFoundException('Section not found (run db:seed:base).');
    return section;
  }

  listEnabled() {
    return this.prisma.landingSection.findMany({
      where: { enabled: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        key: true,
        title: true,
        subtitle: true,
        body: true,
        ctaLabel: true,
        sortOrder: true,
        mediaAsset: { select: PUBLIC_MEDIA_SELECT },
      },
    });
  }

  async update(actorId: string, key: SectionKey, input: LandingSectionUpdateInput) {
    await this.get(key);
    if (input.mediaAssetId) {
      const media = await this.prisma.mediaAsset.findUnique({
        where: { id: input.mediaAssetId },
        select: { status: true, altText: true },
      });
      if (!isPublishableMedia(media)) {
        throw new UnprocessableEntityException({
          message: 'Section images must be processed and have alternative text.',
          details: [
            { path: 'mediaAssetId', message: 'Media is not publishable.', code: 'publication' },
          ],
        });
      }
    }
    await this.prisma.landingSection.update({ where: { key }, data: input });
    await this.changes.record(
      actorId,
      {
        action: 'content.update',
        entity: 'LandingSection',
        entityId: key,
        summary: { fields: changedFields(input) },
      },
      [CACHE_TAGS.site],
    );
    return this.get(key);
  }
}

@Controller('admin/content')
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Get()
  list() {
    return this.content.list();
  }

  @Get(':key')
  get(@Param('key', zod(landingSectionKeySchema)) key: SectionKey) {
    return this.content.get(key);
  }

  @Put(':key')
  update(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('key', zod(landingSectionKeySchema)) key: SectionKey,
    @Body(zod(landingSectionUpdateSchema)) body: LandingSectionUpdateInput,
  ) {
    return this.content.update(admin.id, key, body);
  }
}

@Module({
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
