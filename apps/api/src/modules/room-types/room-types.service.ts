import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CACHE_TAGS,
  roomCacheTag,
  uniqueSlug,
  type PublicationStatus,
  type RoomTypeCreateInput,
  type RoomTypeImagesInput,
  type RoomTypeUpdateInput,
} from '@hotel-bambu/shared';
import type { Env } from '../../config/env.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AdminChangesService } from '../audit/admin-changes.service.js';
import { changedFields } from '../audit/audit.service.js';
import { PUBLIC_MEDIA_SELECT, isPublishableMedia, toPublicMedia } from '../media/media-url.js';
import {
  ROOM_TYPE_PUBLICATION_MESSAGES,
  planSlugChange,
  roomTypePublicationIssues,
  type RoomTypeForPublication,
} from './room-type-rules.js';

const ADMIN_INCLUDE = {
  images: {
    orderBy: { sortOrder: 'asc' },
    include: { mediaAsset: { select: PUBLIC_MEDIA_SELECT } },
  },
  amenities: { select: { amenityId: true } },
  slugRedirects: { select: { oldSlug: true, createdAt: true }, orderBy: { createdAt: 'asc' } },
  _count: { select: { rooms: true } },
} satisfies Prisma.RoomTypeInclude;

/** Rooms that make a published type "available" on the site. */
const PUBLISHED_ROOMS = { where: { status: 'PUBLISHED' } } as const;

/**
 * Room types (ADR 0016): what the site sells and shows. Rooms only reference a type, so every
 * public room page is a type page; old room URLs and renamed type slugs answer `{ redirectTo }`.
 */
@Injectable()
export class RoomTypesService {
  private readonly publicBaseUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly changes: AdminChangesService,
    config: ConfigService<Env, true>,
  ) {
    this.publicBaseUrl = config.get('S3_PUBLIC_URL', { infer: true });
  }

  // ─── Admin ──────────────────────────────────────────────────────────────────

  async list() {
    const [types, published] = await Promise.all([
      this.prisma.roomType.findMany({
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        include: ADMIN_INCLUDE,
      }),
      this.publishedRoomCounts(),
    ]);
    return types.map((type) => this.presentAdmin(type, published.get(type.id) ?? 0));
  }

  async get(id: string) {
    const type = await this.prisma.roomType.findUnique({ where: { id }, include: ADMIN_INCLUDE });
    if (!type) throw new NotFoundException('Room type not found.');
    const published = await this.prisma.room.count({
      where: { roomTypeId: id, status: 'PUBLISHED' },
    });
    return this.presentAdmin(type, published);
  }

  private async publishedRoomCounts(): Promise<Map<string, number>> {
    const rows = await this.prisma.room.groupBy({
      by: ['roomTypeId'],
      where: { status: 'PUBLISHED' },
      _count: { _all: true },
      orderBy: { roomTypeId: 'asc' },
    });
    return new Map(rows.map((row) => [row.roomTypeId, row._count._all]));
  }

  private presentAdmin(
    type: Prisma.RoomTypeGetPayload<{ include: typeof ADMIN_INCLUDE }>,
    publishedRoomCount: number,
  ) {
    const { amenities, images, _count, ...rest } = type;
    return {
      ...rest,
      areaM2: rest.areaM2 === null ? null : Number(rest.areaM2),
      amenityIds: amenities.map((a) => a.amenityId),
      roomCount: _count.rooms,
      publishedRoomCount,
      images: images.map((image) => ({
        mediaAssetId: image.mediaAssetId,
        isCover: image.isCover,
        sortOrder: image.sortOrder,
        media: {
          ...image.mediaAsset,
          preview: toPublicMedia(image.mediaAsset, this.publicBaseUrl),
        },
      })),
      publicationIssues: roomTypePublicationIssues(type),
    };
  }

  private async slugIsFree(slug: string): Promise<boolean> {
    const [type, redirect] = await Promise.all([
      this.prisma.roomType.findUnique({ where: { slug }, select: { id: true } }),
      this.prisma.roomTypeSlugRedirect.findUnique({
        where: { oldSlug: slug },
        select: { id: true },
      }),
    ]);
    return !type && !redirect;
  }

  private async generateSlug(name: string): Promise<string> {
    const [types, redirects] = await Promise.all([
      this.prisma.roomType.findMany({ select: { slug: true } }),
      this.prisma.roomTypeSlugRedirect.findMany({ select: { oldSlug: true } }),
    ]);
    const taken = new Set([...types.map((t) => t.slug), ...redirects.map((r) => r.oldSlug)]);
    return uniqueSlug(name, taken, 'habitacion');
  }

  /** Only ROOM amenities are assigned to a type; HOTEL ones apply to the whole hotel (ADR 0015). */
  private async assertRoomAmenities(ids: readonly string[]): Promise<void> {
    const unique = [...new Set(ids)];
    if (unique.length === 0) return;
    const found = await this.prisma.amenity.count({ where: { id: { in: unique }, scope: 'ROOM' } });
    if (found !== unique.length) {
      throw new UnprocessableEntityException({
        message: 'Only room amenities can be assigned to a room type.',
        details: [{ path: 'amenityIds', message: 'Unknown or hotel-wide amenity.', code: 'scope' }],
      });
    }
  }

  async create(actorId: string, input: RoomTypeCreateInput) {
    const { amenityIds, slug: requestedSlug, beds, ...fields } = input;
    await this.assertRoomAmenities(amenityIds);
    let slug = requestedSlug;
    if (slug) {
      if (!(await this.slugIsFree(slug))) throw new ConflictException('Slug is already in use.');
    } else {
      slug = await this.generateSlug(input.name);
    }
    const max = await this.prisma.roomType.aggregate({ _max: { sortOrder: true } });
    const type = await this.prisma.roomType.create({
      data: {
        ...fields,
        beds: beds ?? undefined,
        slug,
        status: 'DRAFT',
        sortOrder: (max._max.sortOrder ?? -1) + 1,
        amenities: { create: amenityIds.map((amenityId) => ({ amenityId })) },
      },
      select: { id: true },
    });
    await this.changes.record(actorId, {
      action: 'roomType.create',
      entity: 'RoomType',
      entityId: type.id,
      summary: { fields: changedFields(input) },
    });
    return this.get(type.id);
  }

  async update(actorId: string, id: string, input: RoomTypeUpdateInput) {
    const current = await this.prisma.roomType.findUnique({
      where: { id },
      include: ADMIN_INCLUDE,
    });
    if (!current) throw new NotFoundException('Room type not found.');
    const isPublished = current.status === 'PUBLISHED';
    const { amenityIds, beds, ...fields } = input;
    if (amenityIds) await this.assertRoomAmenities(amenityIds);

    let redirectOps: Prisma.PrismaPromise<unknown>[] = [];
    if (input.slug !== undefined) {
      const [other, redirect] = await Promise.all([
        this.prisma.roomType.findUnique({ where: { slug: input.slug }, select: { id: true } }),
        this.prisma.roomTypeSlugRedirect.findUnique({
          where: { oldSlug: input.slug },
          select: { roomTypeId: true },
        }),
      ]);
      const plan = planSlugChange({
        ownerId: id,
        currentSlug: current.slug,
        newSlug: input.slug,
        isPublished,
        takenByOther: !!other && other.id !== id,
        redirectOwnerId: redirect?.roomTypeId ?? null,
      });
      if (plan.kind === 'conflict') throw new ConflictException('Slug is already in use.');
      if (plan.kind === 'change') {
        redirectOps = [
          ...(plan.deleteRedirectFrom
            ? [
                this.prisma.roomTypeSlugRedirect.delete({
                  where: { oldSlug: plan.deleteRedirectFrom },
                }),
              ]
            : []),
          ...(plan.createRedirectFrom
            ? [
                this.prisma.roomTypeSlugRedirect.create({
                  data: { oldSlug: plan.createRedirectFrom, roomTypeId: id },
                }),
              ]
            : []),
        ];
      }
    }

    if (isPublished) {
      this.assertPublishable({
        name: input.name ?? current.name,
        slug: input.slug ?? current.slug,
        capacity: input.capacity ?? current.capacity,
        images: current.images,
      });
    }

    await this.prisma.$transaction([
      ...redirectOps,
      this.prisma.roomType.update({
        where: { id },
        data: {
          ...fields,
          ...(beds !== undefined ? { beds: beds ?? [] } : {}),
          ...(amenityIds
            ? {
                amenities: {
                  deleteMany: {},
                  create: amenityIds.map((amenityId) => ({ amenityId })),
                },
              }
            : {}),
        },
      }),
    ]);

    const tags = isPublished
      ? [CACHE_TAGS.rooms, roomCacheTag(current.slug), roomCacheTag(input.slug ?? current.slug)]
      : [];
    await this.changes.record(
      actorId,
      {
        action: 'roomType.update',
        entity: 'RoomType',
        entityId: id,
        summary: { fields: changedFields(input) },
      },
      tags,
    );
    return this.get(id);
  }

  private assertPublishable(type: RoomTypeForPublication): void {
    const issues = roomTypePublicationIssues(type);
    if (issues.length > 0) {
      throw new UnprocessableEntityException({
        message: 'The room type does not meet the publication requirements.',
        details: issues.map((issue) => ({
          path: issue,
          message: ROOM_TYPE_PUBLICATION_MESSAGES[issue],
          code: 'publication',
        })),
      });
    }
  }

  async setStatus(actorId: string, id: string, status: PublicationStatus) {
    const type = await this.prisma.roomType.findUnique({ where: { id }, include: ADMIN_INCLUDE });
    if (!type) throw new NotFoundException('Room type not found.');
    if (status === 'PUBLISHED') this.assertPublishable(type);
    await this.prisma.roomType.update({ where: { id }, data: { status } });
    await this.changes.record(
      actorId,
      {
        action: 'roomType.status',
        entity: 'RoomType',
        entityId: id,
        summary: { from: type.status, to: status },
      },
      [CACHE_TAGS.rooms, roomCacheTag(type.slug)],
    );
    return this.get(id);
  }

  async reorder(actorId: string, ids: string[]) {
    const count = await this.prisma.roomType.count({ where: { id: { in: ids } } });
    if (count !== ids.length) throw new UnprocessableEntityException('Unknown id in order.');
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.roomType.update({ where: { id }, data: { sortOrder: index } }),
      ),
    );
    await this.changes.record(
      actorId,
      { action: 'roomType.reorder', entity: 'RoomType', summary: { count: ids.length } },
      [CACHE_TAGS.rooms],
    );
    return this.list();
  }

  /** Replaces the ordered image set and cover (PUT /admin/room-types/:id/images). */
  async setImages(actorId: string, id: string, input: RoomTypeImagesInput) {
    const type = await this.prisma.roomType.findUnique({
      where: { id },
      select: { id: true, slug: true, status: true, name: true, capacity: true },
    });
    if (!type) throw new NotFoundException('Room type not found.');
    const mediaIds = input.images.map((image) => image.mediaAssetId);
    const media = await this.prisma.mediaAsset.findMany({
      where: { id: { in: mediaIds } },
      select: { id: true, status: true, altText: true },
    });
    if (media.length !== mediaIds.length)
      throw new UnprocessableEntityException('Unknown media id.');
    const byId = new Map(media.map((m) => [m.id, m]));

    if (type.status === 'PUBLISHED') {
      const notReady = media.filter((m) => !isPublishableMedia(m));
      if (notReady.length > 0) {
        throw new UnprocessableEntityException({
          message: 'Published room types only accept processed images with alternative text.',
          details: notReady.map((m) => ({
            path: 'images',
            message: `Media ${m.id} is not publishable.`,
            code: 'media',
          })),
        });
      }
      this.assertPublishable({
        ...type,
        images: input.images.map((image) => ({
          isCover: image.isCover,
          mediaAsset: byId.get(image.mediaAssetId)!,
        })),
      });
    }

    await this.prisma.$transaction([
      this.prisma.roomTypeImage.deleteMany({ where: { roomTypeId: id } }),
      this.prisma.roomTypeImage.createMany({
        data: input.images.map((image, index) => ({
          roomTypeId: id,
          mediaAssetId: image.mediaAssetId,
          isCover: image.isCover,
          sortOrder: index,
        })),
      }),
    ]);
    await this.changes.record(
      actorId,
      {
        action: 'roomType.images',
        entity: 'RoomType',
        entityId: id,
        summary: { count: input.images.length },
      },
      type.status === 'PUBLISHED' ? [CACHE_TAGS.rooms, roomCacheTag(type.slug)] : [],
    );
    return this.get(id);
  }

  /** Published types must be unpublished first; types with rooms are protected (409). */
  async remove(actorId: string, id: string): Promise<void> {
    const type = await this.prisma.roomType.findUnique({
      where: { id },
      select: { status: true, slug: true, _count: { select: { rooms: true } } },
    });
    if (!type) throw new NotFoundException('Room type not found.');
    if (type.status === 'PUBLISHED') {
      throw new ConflictException('Unpublish the room type before deleting it.');
    }
    if (type._count.rooms > 0) {
      throw new ConflictException('Move or delete the rooms of this type first.');
    }
    await this.prisma.roomType.delete({ where: { id } });
    await this.changes.record(actorId, {
      action: 'roomType.delete',
      entity: 'RoomType',
      entityId: id,
      summary: { slug: type.slug },
    });
  }

  // ─── Public ─────────────────────────────────────────────────────────────────

  private publicInclude() {
    return {
      images: {
        orderBy: { sortOrder: 'asc' },
        include: { mediaAsset: { select: PUBLIC_MEDIA_SELECT } },
      },
      amenities: {
        where: { amenity: { active: true, scope: 'ROOM' } },
        include: { amenity: { select: { name: true, iconKey: true, sortOrder: true } } },
      },
      _count: { select: { rooms: PUBLISHED_ROOMS } },
    } satisfies Prisma.RoomTypeInclude;
  }

  private presentPublicSummary(
    type: Prisma.RoomTypeGetPayload<{ include: ReturnType<RoomTypesService['publicInclude']> }>,
  ) {
    const cover = type.images.find((image) => image.isCover);
    return {
      slug: type.slug,
      name: type.name,
      type: type.type,
      description: type.description,
      capacity: type.capacity,
      basePrice: type.basePrice,
      currency: type.currency,
      priceUnit: type.priceUnit,
      taxesIncluded: type.taxesIncluded,
      cover: toPublicMedia(cover?.mediaAsset, this.publicBaseUrl),
      publishedRoomCount: type._count.rooms,
      /** Sitemap `lastModified` (requirement 19.1). */
      updatedAt: type.updatedAt,
      amenities: type.amenities
        .map((a) => a.amenity)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(({ name, iconKey }) => ({ name, iconKey })),
    };
  }

  async listPublished() {
    const types = await this.prisma.roomType.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: this.publicInclude(),
    });
    return types.map((type) => this.presentPublicSummary(type));
  }

  /** Published type by slug; an old slug answers `{ redirectTo }` (301 handled by the web). */
  async getPublishedBySlug(slug: string) {
    const type = await this.prisma.roomType.findFirst({
      where: { slug, status: 'PUBLISHED' },
      include: this.publicInclude(),
    });
    if (type) {
      return {
        ...this.presentPublicSummary(type),
        beds: type.beds,
        areaM2: type.areaM2 === null ? null : Number(type.areaM2),
        priceNotes: type.priceNotes,
        images: type.images
          .map((image) => toPublicMedia(image.mediaAsset, this.publicBaseUrl))
          .filter((media) => media !== null),
      };
    }

    const redirect = await this.prisma.roomTypeSlugRedirect.findUnique({
      where: { oldSlug: slug },
      select: { roomType: { select: { slug: true, status: true } } },
    });
    if (redirect?.roomType.status === 'PUBLISHED') return { redirectTo: redirect.roomType.slug };
    throw new NotFoundException('Room type not found.');
  }
}
