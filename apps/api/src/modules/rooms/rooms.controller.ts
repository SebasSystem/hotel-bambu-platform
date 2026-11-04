import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import {
  reorderSchema,
  roomCreateSchema,
  roomImagesSchema,
  roomStatusSchema,
  roomUpdateSchema,
  type ReorderInput,
  type RoomCreateInput,
  type RoomImagesInput,
  type RoomUpdateInput,
} from '@hotel-bambu/shared';
import type { z } from 'zod';
import { type AuthenticatedAdmin, CurrentAdmin } from '../../common/request-context.js';
import { zod } from '../../common/zod-validation.pipe.js';
import { RoomsService } from './rooms.service.js';

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

  /** Declared before `:id` routes so "order" is never parsed as an id. */
  @Put('order')
  reorder(@CurrentAdmin() admin: AuthenticatedAdmin, @Body(zod(reorderSchema)) body: ReorderInput) {
    return this.rooms.reorder(admin.id, body.ids);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.rooms.get(id);
  }

  @Patch(':id')
  update(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(zod(roomUpdateSchema)) body: RoomUpdateInput,
  ) {
    return this.rooms.update(admin.id, id, body);
  }

  @Patch(':id/status')
  setStatus(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(zod(roomStatusSchema)) body: z.output<typeof roomStatusSchema>,
  ) {
    return this.rooms.setStatus(admin.id, id, body.status);
  }

  @Put(':id/images')
  setImages(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(zod(roomImagesSchema)) body: RoomImagesInput,
  ) {
    return this.rooms.setImages(admin.id, id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentAdmin() admin: AuthenticatedAdmin, @Param('id', ParseUUIDPipe) id: string) {
    await this.rooms.remove(admin.id, id);
  }
}
