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
  policyCreateSchema,
  policyUpdateSchema,
  reorderSchema,
  type PolicyCreateInput,
  type PolicyUpdateInput,
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

/** Hotel policies: check-in/out, pets, minors, smoking, cancellation, payment (9.9). */
const TAGS = [CACHE_TAGS.policies];

@Injectable()
export class PoliciesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly changes: AdminChangesService,
  ) {}

  list() {
    return this.prisma.hotelPolicy.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  listPublic() {
    return this.prisma.hotelPolicy.findMany({
      where: { published: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, title: true, content: true },
    });
  }

  async create(actorId: string, input: PolicyCreateInput) {
    const max = await this.prisma.hotelPolicy.aggregate({ _max: { sortOrder: true } });
    const item = await this.prisma.hotelPolicy.create({
      data: { ...input, sortOrder: input.sortOrder ?? nextSortOrder(max._max.sortOrder) },
    });
    await this.changes.record(
      actorId,
      { action: 'policy.create', entity: 'HotelPolicy', entityId: item.id },
      TAGS,
    );
    return item;
  }

  async update(actorId: string, id: string, input: PolicyUpdateInput) {
    const item = await this.prisma.hotelPolicy.update({ where: { id }, data: input });
    await this.changes.record(
      actorId,
      {
        action: 'policy.update',
        entity: 'HotelPolicy',
        entityId: id,
        summary: { fields: changedFields(input) },
      },
      TAGS,
    );
    return item;
  }

  async remove(actorId: string, id: string) {
    await this.prisma.hotelPolicy.delete({ where: { id } });
    await this.changes.record(
      actorId,
      { action: 'policy.delete', entity: 'HotelPolicy', entityId: id },
      TAGS,
    );
  }

  async reorder(actorId: string, ids: string[]) {
    assertAllFound(await this.prisma.hotelPolicy.count({ where: { id: { in: ids } } }), ids.length);
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.hotelPolicy.update({ where: { id }, data: { sortOrder: index } }),
      ),
    );
    await this.changes.record(actorId, { action: 'policy.reorder', entity: 'HotelPolicy' }, TAGS);
    return this.list();
  }
}

@RequirePermission('content.view')
@Controller('admin/policies')
export class PoliciesController {
  constructor(private readonly items: PoliciesService) {}

  @Get()
  list() {
    return this.items.list();
  }

  @RequirePermission('content.manage')
  @Post()
  create(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Body(zod(policyCreateSchema)) body: PolicyCreateInput,
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
    @Body(zod(policyUpdateSchema)) body: PolicyUpdateInput,
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
  controllers: [PoliciesController],
  providers: [PoliciesService],
  exports: [PoliciesService],
})
export class PoliciesModule {}
