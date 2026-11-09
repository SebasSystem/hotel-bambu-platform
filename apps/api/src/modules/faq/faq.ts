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
  faqCreateSchema,
  faqUpdateSchema,
  reorderSchema,
  type FaqCreateInput,
  type FaqUpdateInput,
  type ReorderInput,
} from '@hotel-bambu/shared';
import { assertAllFound, nextSortOrder } from '../../common/ordering.js';
import {
  type AuthenticatedAdmin,
  CurrentAdmin,
  RequirePermission,
} from '../../common/request-context.js';
import { zod } from '../../common/zod-validation.pipe.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AdminChangesService } from '../audit/admin-changes.service.js';
import { changedFields } from '../audit/audit.service.js';

/** Frequently asked questions (requirement 9.9). */
const TAGS = [CACHE_TAGS.faq, CACHE_TAGS.site];

@Injectable()
export class FaqsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly changes: AdminChangesService,
  ) {}

  list() {
    return this.prisma.faq.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  listPublic() {
    return this.prisma.faq.findMany({
      where: { published: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, question: true, answer: true, showOnHome: true },
    });
  }

  async create(actorId: string, input: FaqCreateInput) {
    const max = await this.prisma.faq.aggregate({ _max: { sortOrder: true } });
    const item = await this.prisma.faq.create({
      data: { ...input, sortOrder: input.sortOrder ?? nextSortOrder(max._max.sortOrder) },
    });
    await this.changes.record(
      actorId,
      { action: 'faq.create', entity: 'Faq', entityId: item.id },
      TAGS,
    );
    return item;
  }

  async update(actorId: string, id: string, input: FaqUpdateInput) {
    const item = await this.prisma.faq.update({ where: { id }, data: input });
    await this.changes.record(
      actorId,
      {
        action: 'faq.update',
        entity: 'Faq',
        entityId: id,
        summary: { fields: changedFields(input) },
      },
      TAGS,
    );
    return item;
  }

  async remove(actorId: string, id: string) {
    await this.prisma.faq.delete({ where: { id } });
    await this.changes.record(actorId, { action: 'faq.delete', entity: 'Faq', entityId: id }, TAGS);
  }

  async reorder(actorId: string, ids: string[]) {
    assertAllFound(await this.prisma.faq.count({ where: { id: { in: ids } } }), ids.length);
    await this.prisma.$transaction(
      ids.map((id, index) => this.prisma.faq.update({ where: { id }, data: { sortOrder: index } })),
    );
    await this.changes.record(actorId, { action: 'faq.reorder', entity: 'Faq' }, TAGS);
    return this.list();
  }
}

@RequirePermission('content.view')
@Controller('admin/faq')
export class FaqsController {
  constructor(private readonly items: FaqsService) {}

  @Get()
  list() {
    return this.items.list();
  }

  @RequirePermission('content.manage')
  @Post()
  create(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Body(zod(faqCreateSchema)) body: FaqCreateInput,
  ) {
    return this.items.create(admin.id, body);
  }

  @RequirePermission('content.manage')
  @Put('order')
  reorder(@CurrentAdmin() admin: AuthenticatedAdmin, @Body(zod(reorderSchema)) body: ReorderInput) {
    return this.items.reorder(admin.id, body.ids);
  }

  @RequirePermission('content.manage')
  @Patch(':id')
  update(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(zod(faqUpdateSchema)) body: FaqUpdateInput,
  ) {
    return this.items.update(admin.id, id, body);
  }

  @RequirePermission('content.manage')
  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentAdmin() admin: AuthenticatedAdmin, @Param('id', ParseUUIDPipe) id: string) {
    await this.items.remove(admin.id, id);
  }
}

@Module({
  controllers: [FaqsController],
  providers: [FaqsService],
  exports: [FaqsService],
})
export class FaqsModule {}
