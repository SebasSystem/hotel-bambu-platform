import {
  Body,
  Controller,
  Get,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Put,
} from '@nestjs/common';
import {
  CACHE_TAGS,
  landingSectionKeySchema,
  landingSectionUpdateSchema,
  type LandingSectionUpdateInput,
} from '@hotel-bambu/shared';
import type { z } from 'zod';
import {
  type AuthenticatedAdmin,
  CurrentAdmin,
  RequirePermission,
} from '../../common/request-context.js';
import { zod } from '../../common/zod-validation.pipe.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AdminChangesService } from '../audit/admin-changes.service.js';
import { changedFields } from '../audit/audit.service.js';

type SectionKey = z.output<typeof landingSectionKeySchema>;

/**
 * Fixed landing sections (requirement 9.8): the code owns the layout and the headings, admins only
 * switch sections on or off and order them (ADR 0016).
 */
@Injectable()
export class ContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly changes: AdminChangesService,
  ) {}

  list() {
    return this.prisma.landingSection.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  async get(key: SectionKey) {
    const section = await this.prisma.landingSection.findUnique({ where: { key } });
    if (!section) throw new NotFoundException('Section not found (run db:seed:base).');
    return section;
  }

  listEnabled() {
    return this.prisma.landingSection.findMany({
      where: { enabled: true },
      orderBy: { sortOrder: 'asc' },
      select: { key: true, sortOrder: true },
    });
  }

  async update(actorId: string, key: SectionKey, input: LandingSectionUpdateInput) {
    await this.get(key);
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

@RequirePermission('content.view')
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

  @RequirePermission('content.manage')
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
