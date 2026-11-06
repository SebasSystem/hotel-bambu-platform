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
  nearbyPlaceCreateSchema,
  nearbyPlaceUpdateSchema,
  reorderSchema,
  type NearbyPlaceCreateInput,
  type NearbyPlaceUpdateInput,
  type ReorderInput,
} from '@hotel-bambu/shared';
import { assertAllFound, nextSortOrder } from '../../common/ordering.js';
import { type AuthenticatedAdmin, CurrentAdmin } from '../../common/request-context.js';
import { zod } from '../../common/zod-validation.pipe.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AdminChangesService } from '../audit/admin-changes.service.js';
import { changedFields } from '../audit/audit.service.js';

const TAGS = [CACHE_TAGS.nearby];

/** Nearby places with the distance and travel time the hotel measured (ADR 0016). */
@Injectable()
export class NearbyPlacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly changes: AdminChangesService,
  ) {}

  list() {
    return this.prisma.nearbyPlace.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  listPublic() {
    return this.prisma.nearbyPlace.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, name: true, category: true, distanceText: true, travelTimeText: true },
    });
  }

  async create(actorId: string, input: NearbyPlaceCreateInput) {
    const max = await this.prisma.nearbyPlace.aggregate({ _max: { sortOrder: true } });
    const place = await this.prisma.nearbyPlace.create({
      data: { ...input, sortOrder: input.sortOrder ?? nextSortOrder(max._max.sortOrder) },
    });
    await this.changes.record(
      actorId,
      { action: 'nearbyPlace.create', entity: 'NearbyPlace', entityId: place.id },
      TAGS,
    );
    return place;
  }

  async update(actorId: string, id: string, input: NearbyPlaceUpdateInput) {
    const place = await this.prisma.nearbyPlace.update({ where: { id }, data: input });
    await this.changes.record(
      actorId,
      {
        action: 'nearbyPlace.update',
        entity: 'NearbyPlace',
        entityId: id,
        summary: { fields: changedFields(input) },
      },
      TAGS,
    );
    return place;
  }

  async remove(actorId: string, id: string) {
    await this.prisma.nearbyPlace.delete({ where: { id } });
    await this.changes.record(
      actorId,
      { action: 'nearbyPlace.delete', entity: 'NearbyPlace', entityId: id },
      TAGS,
    );
  }

  async reorder(actorId: string, ids: string[]) {
    assertAllFound(await this.prisma.nearbyPlace.count({ where: { id: { in: ids } } }), ids.length);
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.nearbyPlace.update({ where: { id }, data: { sortOrder: index } }),
      ),
    );
    await this.changes.record(
      actorId,
      { action: 'nearbyPlace.reorder', entity: 'NearbyPlace' },
      TAGS,
    );
    return this.list();
  }
}

@Controller('admin/nearby-places')
export class NearbyPlacesController {
  constructor(private readonly places: NearbyPlacesService) {}

  @Get()
  list() {
    return this.places.list();
  }

  @Post()
  create(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Body(zod(nearbyPlaceCreateSchema)) body: NearbyPlaceCreateInput,
  ) {
    return this.places.create(admin.id, body);
  }

  @Put('order')
  reorder(@CurrentAdmin() admin: AuthenticatedAdmin, @Body(zod(reorderSchema)) body: ReorderInput) {
    return this.places.reorder(admin.id, body.ids);
  }

  @Patch(':id')
  update(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(zod(nearbyPlaceUpdateSchema)) body: NearbyPlaceUpdateInput,
  ) {
    return this.places.update(admin.id, id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentAdmin() admin: AuthenticatedAdmin, @Param('id', ParseUUIDPipe) id: string) {
    await this.places.remove(admin.id, id);
  }
}

@Module({
  controllers: [NearbyPlacesController],
  providers: [NearbyPlacesService],
  exports: [NearbyPlacesService],
})
export class NearbyPlacesModule {}
