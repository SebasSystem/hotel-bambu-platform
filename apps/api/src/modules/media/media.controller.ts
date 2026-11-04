import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  mediaUpdateSchema,
  mediaUploadFieldsSchema,
  type MediaUpdateInput,
} from '@hotel-bambu/shared';
import type { FastifyRequest } from 'fastify';
import { z } from 'zod';
import { type AuthenticatedAdmin, CurrentAdmin, RateLimit } from '../../common/request-context.js';
import { toValidationIssues, zod } from '../../common/zod-validation.pipe.js';
import { MediaService } from './media.service.js';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(24),
  missingAlt: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
});

@Controller('admin/media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Get()
  list(@Query(zod(paginationSchema)) query: z.output<typeof paginationSchema>) {
    return this.media.list(query);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.media.get(id);
  }

  /**
   * multipart/form-data: text fields `altText` (required), `caption`, `galleryCategory` FIRST, then
   * one `file` part (JPEG/PNG/WebP, max UPLOAD_MAX_BYTES).
   */
  @Post()
  @RateLimit('upload')
  async upload(@CurrentAdmin() admin: AuthenticatedAdmin, @Req() request: FastifyRequest) {
    if (!request.isMultipart()) throw new BadRequestException('Expected multipart/form-data.');
    const part = await request.file();
    if (!part || part.fieldname !== 'file') throw new BadRequestException('Missing "file" part.');

    const fields: Record<string, string> = {};
    for (const [name, value] of Object.entries(part.fields)) {
      const entry = Array.isArray(value) ? value[0] : value;
      if (entry && entry.type === 'field' && typeof entry.value === 'string')
        fields[name] = entry.value;
    }
    const parsed = mediaUploadFieldsSchema.safeParse(fields);
    if (!parsed.success) {
      part.file.resume();
      throw new BadRequestException({
        message: 'Validation failed (send text fields before the file part).',
        details: toValidationIssues(parsed.error),
      });
    }

    const buffer = await part.toBuffer();
    return this.media.upload(admin.id, buffer, parsed.data);
  }

  @Patch(':id')
  update(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(zod(mediaUpdateSchema)) body: MediaUpdateInput,
  ) {
    return this.media.update(admin.id, id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentAdmin() admin: AuthenticatedAdmin, @Param('id', ParseUUIDPipe) id: string) {
    await this.media.remove(admin.id, id);
  }
}
