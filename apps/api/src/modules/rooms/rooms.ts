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
  normalizeRoomAmenityOverrides,
  reorderSchema,
  roomCreateSchema,
  roomUpdateSchema,
  type ReorderInput,
  type RoomAmenityOverride,
  type RoomCreateInput,
  type RoomUpdateInput,
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

/** Published room counts are part of the public room types (ADR 0016). */
const TAGS = [CACHE_TAGS.rooms];

const ROOM_SELECT = {
  id: true,
  name: true,
  status: true,
  sortOrder: true,
  roomTypeId: true,
  roomType: { select: { id: true, name: true, type: true, status: true } },
  amenityOverrides: {
    select: { amenityId: true, available: true },
    orderBy: { createdAt: 'asc' },
  },
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * Physical rooms (ADR 0016): number or name, type, status and amenity overrides (owner review A9).
 * Everything else the site shows about a room lives on its RoomType.
 */
@Injectable()
export class RoomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly changes: AdminChangesService,
  ) {}

  list() {
    return this.prisma.room.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: ROOM_SELECT,
    });
  }

  private async assertType(roomTypeId: string | undefined): Promise<void> {
    if (!roomTypeId) return;
    const found = await this.prisma.roomType.count({ where: { id: roomTypeId } });
    if (!found) {
      throw new UnprocessableEntityException({
        message: 'Unknown room type.',
        details: [{ path: 'roomTypeId', message: 'Unknown room type.', code: 'reference' }],
      });
    }
  }

  /**
   * Validates overrides (ROOM amenities only, 422 on `amenityOverrides`) and keeps only the real
   * differences from the room's type.
   */
  private async prepareOverrides(
    roomTypeId: string,
    overrides: readonly RoomAmenityOverride[],
  ): Promise<RoomAmenityOverride[]> {
    const ids = overrides.map((o) => o.amenityId);
    const found = await this.prisma.amenity.count({ where: { id: { in: ids }, scope: 'ROOM' } });
    if (found !== ids.length) {
      throw new UnprocessableEntityException({
        message: 'Only room amenities can be overridden per room.',
        details: [
          { path: 'amenityOverrides', message: 'Unknown or hotel-wide amenity.', code: 'scope' },
        ],
      });
    }
    const typeAmenities = await this.prisma.roomTypeAmenity.findMany({
      where: { roomTypeId },
      select: { amenityId: true },
    });
    return normalizeRoomAmenityOverrides(
      typeAmenities.map((a) => a.amenityId),
      overrides,
    );
  }

  async create(actorId: string, input: RoomCreateInput) {
    const { amenityOverrides, ...fields } = input;
    await this.assertType(fields.roomTypeId);
    const overrides = amenityOverrides
      ? await this.prepareOverrides(fields.roomTypeId, amenityOverrides)
      : [];
    const max = await this.prisma.room.aggregate({ _max: { sortOrder: true } });
    const room = await this.prisma.room.create({
      data: {
        ...fields,
        sortOrder: fields.sortOrder ?? nextSortOrder(max._max.sortOrder),
        amenityOverrides: { create: overrides },
      },
      select: ROOM_SELECT,
    });
    await this.changes.record(
      actorId,
      {
        action: 'room.create',
        entity: 'Room',
        entityId: room.id,
        ...(overrides.length > 0 ? { summary: { amenityOverrides: overrides.length } } : {}),
      },
      TAGS,
    );
    return room;
  }

  async update(actorId: string, id: string, input: RoomUpdateInput) {
    const current = await this.prisma.room.findUnique({
      where: { id },
      select: { roomTypeId: true },
    });
    if (!current) throw new NotFoundException('Room not found.');
    const { amenityOverrides, ...fields } = input;
    await this.assertType(fields.roomTypeId);
    const overrides = amenityOverrides
      ? await this.prepareOverrides(fields.roomTypeId ?? current.roomTypeId, amenityOverrides)
      : null;
    // The override list is replaced as a whole, in the same transaction as the room fields.
    const room = await this.prisma.$transaction(async (tx) => {
      if (overrides) await tx.roomAmenityOverride.deleteMany({ where: { roomId: id } });
      return tx.room.update({
        where: { id },
        data: { ...fields, ...(overrides ? { amenityOverrides: { create: overrides } } : {}) },
        select: ROOM_SELECT,
      });
    });
    await this.changes.record(
      actorId,
      {
        action: 'room.update',
        entity: 'Room',
        entityId: id,
        summary: {
          fields: changedFields(input),
          ...(overrides ? { amenityOverrides: overrides.length } : {}),
        },
      },
      TAGS,
    );
    return room;
  }

  async remove(actorId: string, id: string) {
    await this.prisma.room.delete({ where: { id } });
    await this.changes.record(
      actorId,
      { action: 'room.delete', entity: 'Room', entityId: id },
      TAGS,
    );
  }

  async reorder(actorId: string, ids: string[]) {
    assertAllFound(await this.prisma.room.count({ where: { id: { in: ids } } }), ids.length);
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.room.update({ where: { id }, data: { sortOrder: index } }),
      ),
    );
    await this.changes.record(actorId, { action: 'room.reorder', entity: 'Room' }, TAGS);
    return this.list();
  }
}

@RequirePermission('rooms.view')
@Controller('admin/rooms')
export class RoomsController {
  constructor(private readonly rooms: RoomsService) {}

  @Get()
  list() {
    return this.rooms.list();
  }

  @RequirePermission('rooms.manage')
  @Post()
  create(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Body(zod(roomCreateSchema)) body: RoomCreateInput,
  ) {
    return this.rooms.create(admin.id, body);
  }

  @RequirePermission('rooms.manage')
  @Put('order')
  reorder(@CurrentAdmin() admin: AuthenticatedAdmin, @Body(zod(reorderSchema)) body: ReorderInput) {
    return this.rooms.reorder(admin.id, body.ids);
  }

  @RequirePermission('rooms.manage')
  @Patch(':id')
  update(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(zod(roomUpdateSchema)) body: RoomUpdateInput,
  ) {
    return this.rooms.update(admin.id, id, body);
  }

  @RequirePermission('rooms.manage')
  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentAdmin() admin: AuthenticatedAdmin, @Param('id', ParseUUIDPipe) id: string) {
    await this.rooms.remove(admin.id, id);
  }
}

@Module({
  controllers: [RoomsController],
  providers: [RoomsService],
})
export class RoomsModule {}
