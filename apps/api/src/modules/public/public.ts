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
import { HeroSlidesModule, HeroSlidesService } from '../hero-slides/hero-slides.js';
import { HotelModule, HotelService } from '../hotel/hotel.js';
import { toPublicMedia, type MediaRow } from '../media/media-url.js';
import { NearbyPlacesModule, NearbyPlacesService } from '../nearby-places/nearby-places.js';
import { PoliciesModule, PoliciesService } from '../policies/policies.js';
import { RoomTypesModule } from '../room-types/room-types.module.js';
import { RoomTypesService } from '../room-types/room-types.service.js';
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
    private readonly roomTypes: RoomTypesService,
    private readonly amenities: AmenitiesService,
    private readonly heroSlides: HeroSlidesService,
    private readonly gallery: GalleryService,
    private readonly content: ContentService,
    private readonly faqs: FaqsService,
    private readonly policies: PoliciesService,
    private readonly socialLinks: SocialLinksService,
    private readonly nearbyPlaces: NearbyPlacesService,
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
    const [profile, socialLinks, slides, amenities, sections] = await Promise.all([
      this.hotel.getProfile(),
      this.socialLinks.listPublic(),
      this.heroSlides.listPublic(),
      this.amenities.listPublic(),
      this.content.listEnabled(),
    ]);
    const { logoMedia, logoMediaId: _l, id: _id, createdAt: _c, ...hotel } = profile;
    return {
      hotel: { ...hotel, logo: this.media(logoMedia) },
      socialLinks,
      heroSlides: slides.flatMap(({ media, ...slide }) => {
        const publicMedia = this.media(media);
        return publicMedia ? [{ ...slide, media: publicMedia }] : [];
      }),
      /** Every active hotel-wide amenity; `showOnHome` picks the home panel (ADR 0015). */
      hotelAmenities: amenities
        .filter((amenity) => amenity.scope === 'HOTEL')
        .map(({ scope: _sc, ...amenity }) => amenity),
      /** Room equipment flagged for the home "in every room" grid. */
      homeAmenities: amenities
        .filter((amenity) => amenity.scope === 'ROOM' && amenity.showOnHome)
        .map(({ showOnHome: _s, scope: _sc, ...amenity }) => amenity),
      /** Enabled home sections in order; headings and copy live in the web and the hotel profile. */
      sections,
    };
  }

  /** Published room types with their count of published rooms (ADR 0016). */
  @Get('room-types')
  @Header('Cache-Control', PUBLIC_CACHE)
  listRoomTypes() {
    return this.roomTypes.listPublished();
  }

  /** Type detail; an old slug (renamed type or former room URL) answers { redirectTo }. */
  @Get('room-types/:slug')
  @Header('Cache-Control', PUBLIC_CACHE)
  getRoomType(@Param('slug', zod(slugSchema)) slug: string) {
    return this.roomTypes.getPublishedBySlug(slug);
  }

  @Get('nearby-places')
  @Header('Cache-Control', PUBLIC_CACHE)
  listNearbyPlaces() {
    return this.nearbyPlaces.listPublic();
  }

  @Get('amenities')
  @Header('Cache-Control', PUBLIC_CACHE)
  async listAmenities() {
    return (await this.amenities.listPublic()).map(({ showOnHome: _s, ...amenity }) => amenity);
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
    RoomTypesModule,
    AmenitiesModule,
    HeroSlidesModule,
    GalleryModule,
    ContentModule,
    FaqsModule,
    PoliciesModule,
    SocialLinksModule,
    NearbyPlacesModule,
    AnalyticsModule,
  ],
  controllers: [PublicController],
})
export class PublicModule {}
