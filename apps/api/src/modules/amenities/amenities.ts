import {
  Body,
  ConflictException,
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
  amenityCreateSchema,
  amenityUpdateSchema,
  reorderSchema,
  type AmenityCreateInput,
  type AmenityUpdateInput,
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

/**
 * "Comodidades" (ADR 0015): HOTEL amenities apply to the whole hotel (Wi-Fi, solar panels) and show
 * in the home hotel panel; ROOM amenities are assigned per room type and show on room type cards and pages.
 */
const TAGS = [CACHE_TAGS.amenities, CACHE_TAGS.rooms, CACHE_TAGS.site];

@Injectable()
export class AmenitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly changes: AdminChangesService,
  ) {}

  list() {
    return this.prisma.amenity.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { roomTypes: true } } },
    });
  }

  listPublic() {
    return this.prisma.amenity.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        description: true,
        iconKey: true,
        scope: true,
        showOnHome: true,
      },
    });
  }

  async create(actorId: string, input: AmenityCreateInput) {
    const max = await this.prisma.amenity.aggregate({ _max: { sortOrder: true } });
    const amenity = await this.prisma.amenity.create({
      data: { ...input, sortOrder: input.sortOrder ?? nextSortOrder(max._max.sortOrder) },
    });
    await this.changes.record(
      actorId,
      { action: 'amenity.create', entity: 'Amenity', entityId: amenity.id },
      TAGS,
    );
    return amenity;
  }

  async update(actorId: string, id: string, input: AmenityUpdateInput) {
    if (input.scope === 'HOTEL') {
      const [types, rooms] = await Promise.all([
        this.prisma.roomTypeAmenity.count({ where: { amenityId: id } }),
        this.prisma.roomAmenityOverride.count({ where: { amenityId: id } }),
      ]);
      if (types + rooms > 0) {
        throw new ConflictException(
          'Remove the amenity from every room type and room before making it hotel-wide.',
        );
      }
    }
    const amenity = await this.prisma.amenity.update({ where: { id }, data: input });
    await this.changes.record(
      actorId,
      {
        action: 'amenity.update',
        entity: 'Amenity',
        entityId: id,
        summary: { fields: changedFields(input) },
      },
      TAGS,
    );
    return amenity;
  }

  /**
   * Amenities assigned to room types or used in room overrides are protected by the FK (409);
   * deactivate them instead.
   */
  async remove(actorId: string, id: string) {
    await this.prisma.amenity.delete({ where: { id } });
    await this.changes.record(
      actorId,
      { action: 'amenity.delete', entity: 'Amenity', entityId: id },
      TAGS,
    );
  }

  async reorder(actorId: string, ids: string[]) {
    assertAllFound(await this.prisma.amenity.count({ where: { id: { in: ids } } }), ids.length);
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.amenity.update({ where: { id }, data: { sortOrder: index } }),
      ),
    );
    await this.changes.record(actorId, { action: 'amenity.reorder', entity: 'Amenity' }, TAGS);
    return this.list();
  }
}

@RequirePermission('rooms.view')
@Controller('admin/amenities')
export class AmenitiesController {
  constructor(private readonly amenities: AmenitiesService) {}

  @Get()
  list() {
    return this.amenities.list();
  }

  @RequirePermission('rooms.manage')
  @Post()
  create(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Body(zod(amenityCreateSchema)) body: AmenityCreateInput,
  ) {
    return this.amenities.create(admin.id, body);
  }

  @RequirePermission('rooms.manage')
  @Put('order')
  reorder(@CurrentAdmin() admin: AuthenticatedAdmin, @Body(zod(reorderSchema)) body: ReorderInput) {
    return this.amenities.reorder(admin.id, body.ids);
  }

  @RequirePermission('rooms.manage')
  @Patch(':id')
  update(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(zod(amenityUpdateSchema)) body: AmenityUpdateInput,
  ) {
    return this.amenities.update(admin.id, id, body);
  }

  @RequirePermission('rooms.manage')
  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentAdmin() admin: AuthenticatedAdmin, @Param('id', ParseUUIDPipe) id: string) {
    await this.amenities.remove(admin.id, id);
  }
}

@Module({
  controllers: [AmenitiesController],
  providers: [AmenitiesService],
  exports: [AmenitiesService],
})
export class AmenitiesModule {}
