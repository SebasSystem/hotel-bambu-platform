import {
  Body,
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
  serviceCreateSchema,
  serviceUpdateSchema,
  reorderSchema,
  type ServiceCreateInput,
  type ServiceUpdateInput,
  type ReorderInput,
} from '@hotel-bambu/shared';
import { assertAllFound, nextSortOrder } from '../../common/ordering.js';
import { type AuthenticatedAdmin, CurrentAdmin } from '../../common/request-context.js';
import { zod } from '../../common/zod-validation.pipe.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AdminChangesService } from '../audit/admin-changes.service.js';
import { changedFields } from '../audit/audit.service.js';
import { PUBLIC_MEDIA_SELECT } from '../media/media-url.js';

/** Hotel-level features (solar panels, water reserve...). Highlighted ones appear on the home. */
const TAGS = [CACHE_TAGS.services, CACHE_TAGS.site];

@Injectable()
export class ServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly changes: AdminChangesService,
  ) {}

  list() {
    return this.prisma.service.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  listPublic() {
    return this.prisma.service.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        description: true,
        iconKey: true,
        highlighted: true,
        mediaAsset: { select: PUBLIC_MEDIA_SELECT },
      },
    });
  }

  async create(actorId: string, input: ServiceCreateInput) {
    const max = await this.prisma.service.aggregate({ _max: { sortOrder: true } });
    const item = await this.prisma.service.create({
      data: { ...input, sortOrder: input.sortOrder ?? nextSortOrder(max._max.sortOrder) },
    });
    await this.changes.record(
      actorId,
      { action: 'service.create', entity: 'Service', entityId: item.id },
      TAGS,
    );
    return item;
  }

  async update(actorId: string, id: string, input: ServiceUpdateInput) {
    const item = await this.prisma.service.update({ where: { id }, data: input });
    await this.changes.record(
      actorId,
      {
        action: 'service.update',
        entity: 'Service',
        entityId: id,
        summary: { fields: changedFields(input) },
      },
      TAGS,
    );
    return item;
  }

  async remove(actorId: string, id: string) {
    await this.prisma.service.delete({ where: { id } });
    await this.changes.record(
      actorId,
      { action: 'service.delete', entity: 'Service', entityId: id },
      TAGS,
    );
  }

  async reorder(actorId: string, ids: string[]) {
    assertAllFound(await this.prisma.service.count({ where: { id: { in: ids } } }), ids.length);
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.service.update({ where: { id }, data: { sortOrder: index } }),
      ),
    );
    await this.changes.record(actorId, { action: 'service.reorder', entity: 'Service' }, TAGS);
    return this.list();
  }
}

@Controller('admin/services')
export class ServicesController {
  constructor(private readonly items: ServicesService) {}

  @Get()
  list() {
    return this.items.list();
  }

  @Post()
  create(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Body(zod(serviceCreateSchema)) body: ServiceCreateInput,
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
    @Body(zod(serviceUpdateSchema)) body: ServiceUpdateInput,
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
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
