import {
  Body,
  Controller,
  Get,
  Injectable,
  Module,
  NotFoundException,
  Patch,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  CACHE_TAGS,
  hotelProfileUpdateSchema,
  type HotelProfileUpdateInput,
} from '@hotel-bambu/shared';
import {
  type AuthenticatedAdmin,
  CurrentAdmin,
  RequirePermission,
} from '../../common/request-context.js';
import { zod } from '../../common/zod-validation.pipe.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AdminChangesService } from '../audit/admin-changes.service.js';
import { changedFields } from '../audit/audit.service.js';
import { PUBLIC_MEDIA_SELECT, isPublishableMedia } from '../media/media-url.js';

const HOTEL_ID = 1;

/**
 * Hotel profile singleton (requirement 9.3): contact data, the single description source and the
 * WhatsApp greeting (the messages themselves are code defaults, ADR 0016).
 */
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
    if (input.logoMediaId) {
      const media = await this.prisma.mediaAsset.findUnique({
        where: { id: input.logoMediaId },
        select: { status: true, altText: true },
      });
      if (!isPublishableMedia(media)) {
        throw new UnprocessableEntityException({
          message: 'Images must be processed and have alternative text.',
          details: [
            { path: 'logoMediaId', message: 'Media is not publishable.', code: 'publication' },
          ],
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
}

@RequirePermission('hotel.view')
@Controller('admin')
export class HotelController {
  constructor(private readonly hotel: HotelService) {}

  @Get('hotel')
  getProfile() {
    return this.hotel.getProfile();
  }

  @RequirePermission('hotel.manage')
  @Patch('hotel')
  updateProfile(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Body(zod(hotelProfileUpdateSchema)) body: HotelProfileUpdateInput,
  ) {
    return this.hotel.updateProfile(admin.id, body);
  }
}

@Module({
  controllers: [HotelController],
  providers: [HotelService],
  exports: [HotelService],
})
export class HotelModule {}
