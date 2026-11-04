import {
  Body,
  UnprocessableEntityException,
  Controller,
  Delete,
  Get,
  HttpCode,
  Injectable,
  Module,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import {
  CACHE_TAGS,
  isAllowedSocialUrl,
  socialLinkCreateSchema,
  socialLinkUpdateSchema,
  reorderSchema,
  type SocialLinkCreateInput,
  type SocialLinkUpdateInput,
  type ReorderInput,
} from '@hotel-bambu/shared';
import { assertAllFound, nextSortOrder } from '../../common/ordering.js';
import { type AuthenticatedAdmin, CurrentAdmin } from '../../common/request-context.js';
import { zod } from '../../common/zod-validation.pipe.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AdminChangesService } from '../audit/admin-changes.service.js';
import { changedFields } from '../audit/audit.service.js';

/** Social network links (requirement 9.10): https only, host must match the platform. */
const TAGS = [CACHE_TAGS.site];

@Injectable()
export class SocialLinksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly changes: AdminChangesService,
  ) {}

  list() {
    return this.prisma.socialLink.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  listPublic() {
    return this.prisma.socialLink.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, platform: true, url: true },
    });
  }

  async create(actorId: string, input: SocialLinkCreateInput) {
    const max = await this.prisma.socialLink.aggregate({ _max: { sortOrder: true } });
    const item = await this.prisma.socialLink.create({
      data: { ...input, sortOrder: input.sortOrder ?? nextSortOrder(max._max.sortOrder) },
    });
    await this.changes.record(
      actorId,
      { action: 'social_link.create', entity: 'SocialLink', entityId: item.id },
      TAGS,
    );
    return item;
  }

  async update(actorId: string, id: string, input: SocialLinkUpdateInput) {
    if (input.url !== undefined || input.platform !== undefined) {
      const current = await this.prisma.socialLink.findUniqueOrThrow({ where: { id } });
      if (!isAllowedSocialUrl(input.platform ?? current.platform, input.url ?? current.url)) {
        throw new UnprocessableEntityException({
          message: 'URL host does not match the platform.',
          details: [
            { path: 'url', message: 'URL host does not match the platform', code: 'custom' },
          ],
        });
      }
    }
    const item = await this.prisma.socialLink.update({ where: { id }, data: input });
    await this.changes.record(
      actorId,
      {
        action: 'social_link.update',
        entity: 'SocialLink',
        entityId: id,
        summary: { fields: changedFields(input) },
      },
      TAGS,
    );
    return item;
  }

  async remove(actorId: string, id: string) {
    await this.prisma.socialLink.delete({ where: { id } });
    await this.changes.record(
      actorId,
      { action: 'social_link.delete', entity: 'SocialLink', entityId: id },
      TAGS,
    );
  }

  async reorder(actorId: string, ids: string[]) {
    assertAllFound(await this.prisma.socialLink.count({ where: { id: { in: ids } } }), ids.length);
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.socialLink.update({ where: { id }, data: { sortOrder: index } }),
      ),
    );
    await this.changes.record(
      actorId,
      { action: 'social_link.reorder', entity: 'SocialLink' },
      TAGS,
    );
    return this.list();
  }
}

@Controller('admin/social-links')
export class SocialLinksController {
  constructor(private readonly items: SocialLinksService) {}

  @Get()
  list() {
    return this.items.list();
  }

  @Post()
  create(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Body(zod(socialLinkCreateSchema)) body: SocialLinkCreateInput,
  ) {
    return this.items.create(admin.id, body);
  }

  @Put('order')
  reorder(@CurrentAdmin() admin: AuthenticatedAdmin, @Body(zod(reorderSchema)) body: ReorderInput) {
    return this.items.reorder(admin.id, body.ids);
  }

  @Patch(':id')
  update(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(zod(socialLinkUpdateSchema)) body: SocialLinkUpdateInput,
  ) {
    return this.items.update(admin.id, id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentAdmin() admin: AuthenticatedAdmin, @Param('id', ParseUUIDPipe) id: string) {
    await this.items.remove(admin.id, id);
  }
}

@Module({
  controllers: [SocialLinksController],
  providers: [SocialLinksService],
  exports: [SocialLinksService],
})
export class SocialLinksModule {}
