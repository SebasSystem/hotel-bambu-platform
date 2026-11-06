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
  reorderSchema,
  roomCreateSchema,
  roomUpdateSchema,
  type ReorderInput,
  type RoomCreateInput,
  type RoomUpdateInput,
} from '@hotel-bambu/shared';
import { assertAllFound, nextSortOrder } from '../../common/ordering.js';
import { type AuthenticatedAdmin, CurrentAdmin } from '../../common/request-context.js';
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
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * Physical rooms (ADR 0016): number or name, type and status only. Everything the site shows
 * about a room lives on its RoomType.
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

  async create(actorId: string, input: RoomCreateInput) {
    await this.assertType(input.roomTypeId);
    const max = await this.prisma.room.aggregate({ _max: { sortOrder: true } });
    const room = await this.prisma.room.create({
      data: { ...input, sortOrder: input.sortOrder ?? nextSortOrder(max._max.sortOrder) },
      select: ROOM_SELECT,
    });
    await this.changes.record(
      actorId,
      { action: 'room.create', entity: 'Room', entityId: room.id },
      TAGS,
    );
    return room;
  }

  async update(actorId: string, id: string, input: RoomUpdateInput) {
    if (!(await this.prisma.room.count({ where: { id } }))) {
      throw new NotFoundException('Room not found.');
    }
    await this.assertType(input.roomTypeId);
    const room = await this.prisma.room.update({ where: { id }, data: input, select: ROOM_SELECT });
    await this.changes.record(
      actorId,
      {
        action: 'room.update',
        entity: 'Room',
        entityId: id,
        summary: { fields: changedFields(input) },
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

@Controller('admin/rooms')
export class RoomsController {
  constructor(private readonly rooms: RoomsService) {}

  @Get()
  list() {
    return this.rooms.list();
  }

  @Post()
  create(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Body(zod(roomCreateSchema)) body: RoomCreateInput,
  ) {
    return this.rooms.create(admin.id, body);
  }

  @Put('order')
  reorder(@CurrentAdmin() admin: AuthenticatedAdmin, @Body(zod(reorderSchema)) body: ReorderInput) {
    return this.rooms.reorder(admin.id, body.ids);
  }

  @Patch(':id')
  update(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(zod(roomUpdateSchema)) body: RoomUpdateInput,
  ) {
    return this.rooms.update(admin.id, id, body);
  }

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
