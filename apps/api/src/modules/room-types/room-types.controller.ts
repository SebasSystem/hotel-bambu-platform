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
  roomTypeCreateSchema,
  roomTypeImagesSchema,
  roomTypeStatusSchema,
  roomTypeUpdateSchema,
  type ReorderInput,
  type RoomTypeCreateInput,
  type RoomTypeImagesInput,
  type RoomTypeUpdateInput,
} from '@hotel-bambu/shared';
import type { z } from 'zod';
import { type AuthenticatedAdmin, CurrentAdmin } from '../../common/request-context.js';
import { zod } from '../../common/zod-validation.pipe.js';
import { RoomTypesService } from './room-types.service.js';

@Controller('admin/room-types')
export class RoomTypesController {
  constructor(private readonly roomTypes: RoomTypesService) {}

  @Get()
  list() {
    return this.roomTypes.list();
  }

  @Post()
  create(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Body(zod(roomTypeCreateSchema)) body: RoomTypeCreateInput,
  ) {
    return this.roomTypes.create(admin.id, body);
  }

  /** Declared before `:id` routes so "order" is never parsed as an id. */
  @Put('order')
  reorder(@CurrentAdmin() admin: AuthenticatedAdmin, @Body(zod(reorderSchema)) body: ReorderInput) {
    return this.roomTypes.reorder(admin.id, body.ids);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.roomTypes.get(id);
  }

  @Patch(':id')
  update(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(zod(roomTypeUpdateSchema)) body: RoomTypeUpdateInput,
  ) {
    return this.roomTypes.update(admin.id, id, body);
  }

  @Patch(':id/status')
  setStatus(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(zod(roomTypeStatusSchema)) body: z.output<typeof roomTypeStatusSchema>,
  ) {
    return this.roomTypes.setStatus(admin.id, id, body.status);
  }

  @Put(':id/images')
  setImages(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(zod(roomTypeImagesSchema)) body: RoomTypeImagesInput,
  ) {
    return this.roomTypes.setImages(admin.id, id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentAdmin() admin: AuthenticatedAdmin, @Param('id', ParseUUIDPipe) id: string) {
    await this.roomTypes.remove(admin.id, id);
  }
}
