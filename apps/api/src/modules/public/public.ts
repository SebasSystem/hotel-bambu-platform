import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Module,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  analyticsEventSchema,
  consentSchema,
  galleryCategorySchema,
  slugSchema,
  type AnalyticsEventInput,
  type ConsentInput,
} from '@hotel-bambu/shared';
import { z } from 'zod';
import type { Env } from '../../config/env.js';
import { Public, RateLimit } from '../../common/request-context.js';
import { zod } from '../../common/zod-validation.pipe.js';
import { AmenitiesModule, AmenitiesService } from '../amenities/amenities.js';
import { AnalyticsModule, AnalyticsService } from '../analytics/analytics.js';
import { ContentModule, ContentService } from '../content/content.js';
import { FaqsModule, FaqsService } from '../faq/faq.js';
import { GalleryModule, GalleryService } from '../gallery/gallery.js';
import { HotelModule, HotelService } from '../hotel/hotel.js';
import { toPublicMedia, type MediaRow } from '../media/media-url.js';
import { PoliciesModule, PoliciesService } from '../policies/policies.js';
import { PromotionsModule, PromotionsService } from '../promotions/promotions.js';
import { RoomsModule } from '../rooms/rooms.module.js';
import { RoomsService } from '../rooms/rooms.service.js';
import { ServicesModule, ServicesService } from '../services/services.js';
import { SocialLinksModule, SocialLinksService } from '../social-links/social-links.js';

/**
 * Short shared-cache lifetime: the web caches with tags and is revalidated on demand
 * (requirement 21); this header only bounds staleness for intermediaries.
 */
const PUBLIC_CACHE = 'public, max-age=60, stale-while-revalidate=300';

const galleryQuerySchema = z.object({ category: galleryCategorySchema.optional() });

/** Read-only public API: published content only (requirement 10, 12.10). */
@Public()
@Controller('public')
export class PublicController {
  private readonly mediaBase: string;

  constructor(
    private readonly hotel: HotelService,
    private readonly rooms: RoomsService,
    private readonly amenities: AmenitiesService,
    private readonly services: ServicesService,
    private readonly gallery: GalleryService,
    private readonly content: ContentService,
    private readonly faqs: FaqsService,
    private readonly policies: PoliciesService,
    private readonly socialLinks: SocialLinksService,
    private readonly promotions: PromotionsService,
    private readonly analytics: AnalyticsService,
    config: ConfigService<Env, true>,
  ) {
    this.mediaBase = config.get('S3_PUBLIC_URL', { infer: true });
  }

  private media(row: MediaRow | null | undefined) {
    return toPublicMedia(row, this.mediaBase);
  }

  @Get('site')
  @Header('Cache-Control', PUBLIC_CACHE)
  async site() {
    const [profile, templates, socialLinks, services, amenities, sections] = await Promise.all([
      this.hotel.getProfile(),
      this.hotel.listTemplates(),
      this.socialLinks.listPublic(),
      this.services.listPublic(),
      this.amenities.listPublic(),
      this.content.listEnabled(),
    ]);
    const {
      logoMedia,
      heroMedia,
      logoMediaId: _l,
      heroMediaId: _h,
      heroVideoMediaId: _v,
      id: _id,
      createdAt: _c,
      ...hotel
    } = profile;
    return {
      hotel: { ...hotel, logo: this.media(logoMedia), hero: this.media(heroMedia) },
      socialLinks,
      whatsappTemplates: templates.map(({ key, body, allowedVariables }) => ({
        key,
        body,
        allowedVariables,
      })),
      highlightedServices: services
        .filter((service) => service.highlighted)
        .map(({ mediaAsset, highlighted: _hl, ...service }) => ({
          ...service,
          media: this.media(mediaAsset),
        })),
      homeAmenities: amenities
        .filter((amenity) => amenity.showOnHome)
        .map(({ showOnHome: _s, ...amenity }) => amenity),
      sections: sections.map(({ mediaAsset, ...section }) => ({
        ...section,
        media: this.media(mediaAsset),
      })),
    };
  }

  @Get('rooms')
  @Header('Cache-Control', PUBLIC_CACHE)
  listRooms() {
    return this.rooms.listPublished();
  }

  @Get('rooms/:slug')
  @Header('Cache-Control', PUBLIC_CACHE)
  getRoom(@Param('slug', zod(slugSchema)) slug: string) {
    return this.rooms.getPublishedBySlug(slug);
  }

  @Get('amenities')
  @Header('Cache-Control', PUBLIC_CACHE)
  async listAmenities() {
    return (await this.amenities.listPublic()).map(({ showOnHome: _s, ...amenity }) => amenity);
  }

  @Get('services')
  @Header('Cache-Control', PUBLIC_CACHE)
  async listServices() {
    return (await this.services.listPublic()).map(({ mediaAsset, ...service }) => ({
      ...service,
      media: this.media(mediaAsset),
    }));
  }

  @Get('gallery')
  @Header('Cache-Control', PUBLIC_CACHE)
  async listGallery(@Query(zod(galleryQuerySchema)) query: z.output<typeof galleryQuerySchema>) {
    const items = await this.gallery.listPublished();
    return items
      .filter((item) => !query.category || item.category === query.category)
      .map((item) => ({
        id: item.id,
        category: item.category,
        featured: item.featured,
        media: this.media(item.mediaAsset),
      }))
      .filter((item) => item.media !== null);
  }

  @Get('faq')
  @Header('Cache-Control', PUBLIC_CACHE)
  listFaq() {
    return this.faqs.listPublic();
  }

  @Get('policies')
  @Header('Cache-Control', PUBLIC_CACHE)
  listPolicies() {
    return this.policies.listPublic();
  }

  /** Active by date; the web should use a short revalidate window so expired ones disappear (21). */
  @Get('promotions')
  @Header('Cache-Control', 'public, max-age=60')
  listPromotions() {
    return this.promotions.listActive();
  }

  @Post('events')
  @HttpCode(204)
  @RateLimit('public-write')
  async trackEvent(@Body(zod(analyticsEventSchema)) body: AnalyticsEventInput): Promise<void> {
    await this.analytics.track(body);
  }

  @Post('consents')
  @HttpCode(204)
  @RateLimit('public-write')
  async recordConsent(@Body(zod(consentSchema)) body: ConsentInput): Promise<void> {
    await this.analytics.recordConsent(body);
  }
}

@Module({
  imports: [
    HotelModule,
    RoomsModule,
    AmenitiesModule,
    ServicesModule,
    GalleryModule,
    ContentModule,
    FaqsModule,
    PoliciesModule,
    SocialLinksModule,
    PromotionsModule,
    AnalyticsModule,
  ],
  controllers: [PublicController],
})
export class PublicModule {}
