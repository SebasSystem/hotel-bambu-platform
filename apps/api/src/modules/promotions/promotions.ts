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
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  CACHE_TAGS,
  promotionCreateSchema,
  promotionUpdateSchema,
  type PromotionCreateInput,
  type PromotionUpdateInput,
} from '@hotel-bambu/shared';
import { nextSortOrder } from '../../common/ordering.js';
import { type AuthenticatedAdmin, CurrentAdmin } from '../../common/request-context.js';
import { zod } from '../../common/zod-validation.pipe.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AdminChangesService } from '../audit/admin-changes.service.js';
import { changedFields } from '../audit/audit.service.js';

const TAGS = [CACHE_TAGS.promotions, CACHE_TAGS.rooms, CACHE_TAGS.site];

/** A promotion is public when PUBLISHED and `startsAt <= now < endsAt` (requirement 9.5/21). */
export function isPromotionActive(
  promotion: { status: string; startsAt: Date; endsAt: Date },
  now: Date,
): boolean {
  return (
    promotion.status === 'PUBLISHED' &&
    promotion.startsAt.getTime() <= now.getTime() &&
    promotion.endsAt.getTime() > now.getTime()
  );
}

@Injectable()
export class PromotionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly changes: AdminChangesService,
  ) {}

  list() {
    return this.prisma.promotion.findMany({
      orderBy: [{ startsAt: 'desc' }],
      include: { room: { select: { id: true, name: true, slug: true, status: true } } },
    });
  }

  /** Active promotions; a promotion tied to an unpublished room is hidden with it. */
  listActive(now = new Date()) {
    return this.prisma.promotion.findMany({
      where: {
        status: 'PUBLISHED',
        startsAt: { lte: now },
        endsAt: { gt: now },
        OR: [{ roomId: null }, { room: { status: 'PUBLISHED' } }],
      },
      orderBy: [{ sortOrder: 'asc' }, { startsAt: 'asc' }],
      select: {
        id: true,
        title: true,
        description: true,
        conditions: true,
        startsAt: true,
        endsAt: true,
        room: { select: { slug: true, name: true } },
      },
    });
  }

  async create(actorId: string, input: PromotionCreateInput) {
    const max = await this.prisma.promotion.aggregate({ _max: { sortOrder: true } });
    const promotion = await this.prisma.promotion.create({
      data: { ...input, sortOrder: input.sortOrder ?? nextSortOrder(max._max.sortOrder) },
    });
    await this.changes.record(
      actorId,
      { action: 'promotion.create', entity: 'Promotion', entityId: promotion.id },
      promotion.status === 'PUBLISHED' ? TAGS : [],
    );
    return promotion;
  }

  async update(actorId: string, id: string, input: PromotionUpdateInput) {
    const current = await this.prisma.promotion.findUniqueOrThrow({ where: { id } });
    const startsAt = input.startsAt ?? current.startsAt;
    const endsAt = input.endsAt ?? current.endsAt;
    if (endsAt <= startsAt) {
      throw new UnprocessableEntityException({
        message: 'endsAt must be after startsAt.',
        details: [{ path: 'endsAt', message: 'endsAt must be after startsAt', code: 'custom' }],
      });
    }
    const promotion = await this.prisma.promotion.update({ where: { id }, data: input });
    const visible = current.status === 'PUBLISHED' || promotion.status === 'PUBLISHED';
    await this.changes.record(
      actorId,
      {
        action: 'promotion.update',
        entity: 'Promotion',
        entityId: id,
        summary: { fields: changedFields(input) },
      },
      visible ? TAGS : [],
    );
    return promotion;
  }

  async remove(actorId: string, id: string) {
    await this.prisma.promotion.delete({ where: { id } });
    await this.changes.record(
      actorId,
      { action: 'promotion.delete', entity: 'Promotion', entityId: id },
      TAGS,
    );
  }
}

@Controller('admin/promotions')
export class PromotionsController {
  constructor(private readonly promotions: PromotionsService) {}

  @Get()
  list() {
    return this.promotions.list();
  }

  @Post()
  create(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Body(zod(promotionCreateSchema)) body: PromotionCreateInput,
  ) {
    return this.promotions.create(admin.id, body);
  }

  @Patch(':id')
  update(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(zod(promotionUpdateSchema)) body: PromotionUpdateInput,
  ) {
    return this.promotions.update(admin.id, id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentAdmin() admin: AuthenticatedAdmin, @Param('id', ParseUUIDPipe) id: string) {
    await this.promotions.remove(admin.id, id);
  }
}

@Module({
  controllers: [PromotionsController],
  providers: [PromotionsService],
  exports: [PromotionsService],
})
export class PromotionsModule {}
