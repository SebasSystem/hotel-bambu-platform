import {
  Body,
  Controller,
  Get,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Patch,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  CACHE_TAGS,
  hotelProfileUpdateSchema,
  templateVariables,
  whatsAppTemplateKeySchema,
  whatsAppTemplateUpdateSchema,
  type HotelProfileUpdateInput,
  type WhatsAppTemplateUpdateInput,
} from '@hotel-bambu/shared';
import type { z } from 'zod';
import { type AuthenticatedAdmin, CurrentAdmin } from '../../common/request-context.js';
import { zod } from '../../common/zod-validation.pipe.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AdminChangesService } from '../audit/admin-changes.service.js';
import { changedFields } from '../audit/audit.service.js';
import { PUBLIC_MEDIA_SELECT, isPublishableMedia } from '../media/media-url.js';

type TemplateKey = z.output<typeof whatsAppTemplateKeySchema>;
const HOTEL_ID = 1;

/** Variables used in `body` that the template does not allow (requirement 5.2). */
export function disallowedVariables(body: string, allowed: readonly string[]): string[] {
  return [...new Set(templateVariables(body).filter((name) => !allowed.includes(name)))];
}

/** Hotel profile singleton and WhatsApp templates (requirements 9.3, 9.10, 5). */
@Injectable()
export class HotelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly changes: AdminChangesService,
  ) {}

  async getProfile() {
    const profile = await this.prisma.hotelProfile.findUnique({
      where: { id: HOTEL_ID },
      include: {
        logoMedia: { select: PUBLIC_MEDIA_SELECT },
        heroMedia: { select: PUBLIC_MEDIA_SELECT },
      },
    });
    if (!profile) throw new NotFoundException('Hotel profile missing (run db:seed:base).');
    return {
      ...profile,
      latitude: profile.latitude === null ? null : Number(profile.latitude),
      longitude: profile.longitude === null ? null : Number(profile.longitude),
    };
  }

  async updateProfile(actorId: string, input: HotelProfileUpdateInput) {
    for (const field of ['logoMediaId', 'heroMediaId'] as const) {
      const id = input[field];
      if (!id) continue;
      const media = await this.prisma.mediaAsset.findUnique({
        where: { id },
        select: { status: true, altText: true },
      });
      if (!isPublishableMedia(media)) {
        throw new UnprocessableEntityException({
          message: 'Images must be processed and have alternative text.',
          details: [{ path: field, message: 'Media is not publishable.', code: 'publication' }],
        });
      }
    }
    const { openingHours, ...rest } = input;
    await this.prisma.hotelProfile.update({
      where: { id: HOTEL_ID },
      data: {
        ...rest,
        ...(openingHours !== undefined ? { openingHours: openingHours ?? [] } : {}),
      },
    });
    await this.changes.record(
      actorId,
      {
        action: 'hotel.update',
        entity: 'HotelProfile',
        entityId: String(HOTEL_ID),
        summary: { fields: changedFields(input) },
      },
      [CACHE_TAGS.site, CACHE_TAGS.rooms],
    );
    return this.getProfile();
  }

  listTemplates() {
    return this.prisma.whatsAppTemplate.findMany({ orderBy: { key: 'asc' } });
  }

  async updateTemplate(actorId: string, key: TemplateKey, input: WhatsAppTemplateUpdateInput) {
    const template = await this.prisma.whatsAppTemplate.findUnique({ where: { key } });
    if (!template) throw new NotFoundException('Template not found (run db:seed:base).');
    if (input.body !== undefined) {
      const invalid = disallowedVariables(input.body, template.allowedVariables);
      if (invalid.length > 0) {
        throw new UnprocessableEntityException({
          message: `Variables not allowed: ${invalid.join(', ')}.`,
          details: [
            {
              path: 'body',
              message: `Allowed: ${template.allowedVariables.join(', ') || 'none'}`,
              code: 'variables',
            },
          ],
        });
      }
    }
    const updated = await this.prisma.whatsAppTemplate.update({ where: { key }, data: input });
    await this.changes.record(
      actorId,
      {
        action: 'whatsapp_template.update',
        entity: 'WhatsAppTemplate',
        entityId: key,
        summary: { fields: changedFields(input) },
      },
      [CACHE_TAGS.site],
    );
    return updated;
  }
}

@Controller('admin')
export class HotelController {
  constructor(private readonly hotel: HotelService) {}

  @Get('hotel')
  getProfile() {
    return this.hotel.getProfile();
  }

  @Patch('hotel')
  updateProfile(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Body(zod(hotelProfileUpdateSchema)) body: HotelProfileUpdateInput,
  ) {
    return this.hotel.updateProfile(admin.id, body);
  }

  @Get('whatsapp-templates')
  listTemplates() {
    return this.hotel.listTemplates();
  }

  @Patch('whatsapp-templates/:key')
  updateTemplate(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('key', zod(whatsAppTemplateKeySchema)) key: TemplateKey,
    @Body(zod(whatsAppTemplateUpdateSchema)) body: WhatsAppTemplateUpdateInput,
  ) {
    return this.hotel.updateTemplate(admin.id, key, body);
  }
}

@Module({
  controllers: [HotelController],
  providers: [HotelService],
  exports: [HotelService],
})
export class HotelModule {}
