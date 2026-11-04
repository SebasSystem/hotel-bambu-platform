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
  type RoomCreateInput,
  type RoomImagesInput,
  type RoomUpdateInput,
} from '@hotel-bambu/shared';
import type { Env } from '../../config/env.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AdminChangesService } from '../audit/admin-changes.service.js';
import { changedFields } from '../audit/audit.service.js';
import { PUBLIC_MEDIA_SELECT, isPublishableMedia, toPublicMedia } from '../media/media-url.js';
import {
  ROOM_PUBLICATION_MESSAGES,
  planSlugChange,
  roomPublicationIssues,
  type RoomForPublication,
} from './room-rules.js';

const ADMIN_ROOM_INCLUDE = {
  images: {
    orderBy: { sortOrder: 'asc' },
    include: { mediaAsset: { select: PUBLIC_MEDIA_SELECT } },
  },
  amenities: { select: { amenityId: true } },
  slugRedirects: { select: { oldSlug: true, createdAt: true } },
} satisfies Prisma.RoomInclude;

@Injectable()
export class RoomsService {
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
    const rooms = await this.prisma.room.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: ADMIN_ROOM_INCLUDE,
    });
    return rooms.map((room) => this.presentAdmin(room));
  }

  async get(id: string) {
    const room = await this.prisma.room.findUnique({ where: { id }, include: ADMIN_ROOM_INCLUDE });
    if (!room) throw new NotFoundException('Room not found.');
    return this.presentAdmin(room);
  }

  private presentAdmin(room: Prisma.RoomGetPayload<{ include: typeof ADMIN_ROOM_INCLUDE }>) {
    const { amenities, images, ...rest } = room;
    return {
      ...rest,
      areaM2: rest.areaM2 === null ? null : Number(rest.areaM2),
      amenityIds: amenities.map((a) => a.amenityId),
      images: images.map((image) => ({
        mediaAssetId: image.mediaAssetId,
        isCover: image.isCover,
        sortOrder: image.sortOrder,
        media: {
          ...image.mediaAsset,
          preview: toPublicMedia(image.mediaAsset, this.publicBaseUrl),
        },
      })),
      publicationIssues: roomPublicationIssues(room),
    };
  }

  private async slugIsFree(slug: string): Promise<boolean> {
    const [room, redirect] = await Promise.all([
      this.prisma.room.findUnique({ where: { slug }, select: { id: true } }),
      this.prisma.roomSlugRedirect.findUnique({ where: { oldSlug: slug }, select: { id: true } }),
    ]);
    return !room && !redirect;
  }

  private async generateSlug(name: string): Promise<string> {
    const [rooms, redirects] = await Promise.all([
      this.prisma.room.findMany({ select: { slug: true } }),
      this.prisma.roomSlugRedirect.findMany({ select: { oldSlug: true } }),
    ]);
    const taken = new Set([...rooms.map((r) => r.slug), ...redirects.map((r) => r.oldSlug)]);
    return uniqueSlug(name, taken, 'habitacion');
  }

  async create(actorId: string, input: RoomCreateInput) {
    const { amenityIds, slug: requestedSlug, beds, ...fields } = input;
    let slug = requestedSlug;
    if (slug) {
      if (!(await this.slugIsFree(slug))) throw new ConflictException('Slug is already in use.');
    } else {
      slug = await this.generateSlug(input.name);
    }
    const max = await this.prisma.room.aggregate({ _max: { sortOrder: true } });
    const room = await this.prisma.room.create({
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
      action: 'room.create',
      entity: 'Room',
      entityId: room.id,
      summary: { fields: changedFields(input) },
    });
    return this.get(room.id);
  }

  async update(actorId: string, id: string, input: RoomUpdateInput) {
    const current = await this.prisma.room.findUnique({
      where: { id },
      include: ADMIN_ROOM_INCLUDE,
    });
    if (!current) throw new NotFoundException('Room not found.');
    const isPublished = current.status === 'PUBLISHED';
    const { amenityIds, beds, ...fields } = input;

    let redirectOps: Prisma.PrismaPromise<unknown>[] = [];
    if (input.slug !== undefined) {
      const [other, redirect] = await Promise.all([
        this.prisma.room.findUnique({ where: { slug: input.slug }, select: { id: true } }),
        this.prisma.roomSlugRedirect.findUnique({
          where: { oldSlug: input.slug },
          select: { roomId: true },
        }),
      ]);
      const plan = planSlugChange({
        roomId: id,
        currentSlug: current.slug,
        newSlug: input.slug,
        isPublished,
        takenByOtherRoom: !!other && other.id !== id,
        redirectOwnerRoomId: redirect?.roomId ?? null,
      });
      if (plan.kind === 'conflict') throw new ConflictException('Slug is already in use.');
      if (plan.kind === 'change') {
        redirectOps = [
          ...(plan.deleteRedirectFrom
            ? [this.prisma.roomSlugRedirect.delete({ where: { oldSlug: plan.deleteRedirectFrom } })]
            : []),
          ...(plan.createRedirectFrom
            ? [
                this.prisma.roomSlugRedirect.create({
                  data: { oldSlug: plan.createRedirectFrom, roomId: id },
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
        shortDescription:
          input.shortDescription !== undefined ? input.shortDescription : current.shortDescription,
        capacity: input.capacity ?? current.capacity,
        images: current.images,
      });
    }

    await this.prisma.$transaction([
      ...redirectOps,
      this.prisma.room.update({
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
      ? [
          CACHE_TAGS.rooms,
          CACHE_TAGS.promotions,
          roomCacheTag(current.slug),
          roomCacheTag(input.slug ?? current.slug),
        ]
      : [];
    await this.changes.record(
      actorId,
      {
        action: 'room.update',
        entity: 'Room',
        entityId: id,
        summary: { fields: changedFields(input) },
      },
      tags,
    );
    return this.get(id);
  }

  private assertPublishable(room: RoomForPublication): void {
    const issues = roomPublicationIssues(room);
    if (issues.length > 0) {
      throw new UnprocessableEntityException({
        message: 'The room does not meet the publication requirements.',
        details: issues.map((issue) => ({
          path: issue,
          message: ROOM_PUBLICATION_MESSAGES[issue],
          code: 'publication',
        })),
      });
    }
  }

  async setStatus(actorId: string, id: string, status: PublicationStatus) {
    const room = await this.prisma.room.findUnique({ where: { id }, include: ADMIN_ROOM_INCLUDE });
    if (!room) throw new NotFoundException('Room not found.');
    if (status === 'PUBLISHED') this.assertPublishable(room);
    await this.prisma.room.update({ where: { id }, data: { status } });
    await this.changes.record(
      actorId,
      {
        action: 'room.status',
        entity: 'Room',
        entityId: id,
        summary: { from: room.status, to: status },
      },
      [CACHE_TAGS.rooms, CACHE_TAGS.promotions, roomCacheTag(room.slug)],
    );
    return this.get(id);
  }

  async reorder(actorId: string, ids: string[]) {
    const count = await this.prisma.room.count({ where: { id: { in: ids } } });
    if (count !== ids.length) throw new UnprocessableEntityException('Unknown room id in order.');
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.room.update({ where: { id }, data: { sortOrder: index } }),
      ),
    );
    await this.changes.record(
      actorId,
      { action: 'room.reorder', entity: 'Room', summary: { count: ids.length } },
      [CACHE_TAGS.rooms],
    );
    return this.list();
  }

  /** Replaces the ordered image set and cover (requirement 9.4, 12.10 PUT /rooms/:id/images). */
  async setImages(actorId: string, id: string, input: RoomImagesInput) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        status: true,
        name: true,
        shortDescription: true,
        capacity: true,
      },
    });
    if (!room) throw new NotFoundException('Room not found.');
    const mediaIds = input.images.map((image) => image.mediaAssetId);
    const media = await this.prisma.mediaAsset.findMany({
      where: { id: { in: mediaIds } },
      select: { id: true, status: true, altText: true },
    });
    if (media.length !== mediaIds.length)
      throw new UnprocessableEntityException('Unknown media id.');
    const byId = new Map(media.map((m) => [m.id, m]));

    if (room.status === 'PUBLISHED') {
      const notReady = media.filter((m) => !isPublishableMedia(m));
      if (notReady.length > 0) {
        throw new UnprocessableEntityException({
          message: 'Published rooms only accept processed images with alternative text.',
          details: notReady.map((m) => ({
            path: 'images',
            message: `Media ${m.id} is not publishable.`,
            code: 'media',
          })),
        });
      }
      this.assertPublishable({
        ...room,
        images: input.images.map((image) => ({
          isCover: image.isCover,
          mediaAsset: byId.get(image.mediaAssetId)!,
        })),
      });
    }

    await this.prisma.$transaction([
      this.prisma.roomImage.deleteMany({ where: { roomId: id } }),
      this.prisma.roomImage.createMany({
        data: input.images.map((image, index) => ({
          roomId: id,
          mediaAssetId: image.mediaAssetId,
          isCover: image.isCover,
          sortOrder: index,
        })),
      }),
    ]);
    await this.changes.record(
      actorId,
      {
        action: 'room.images',
        entity: 'Room',
        entityId: id,
        summary: { count: input.images.length },
      },
      room.status === 'PUBLISHED' ? [CACHE_TAGS.rooms, roomCacheTag(room.slug)] : [],
    );
    return this.get(id);
  }

  /** Published rooms must be unpublished first (dependency on the live site). */
  async remove(actorId: string, id: string): Promise<void> {
    const room = await this.prisma.room.findUnique({
      where: { id },
      select: { status: true, slug: true },
    });
    if (!room) throw new NotFoundException('Room not found.');
    if (room.status === 'PUBLISHED') {
      throw new ConflictException('Unpublish the room before deleting it.');
    }
    await this.prisma.room.delete({ where: { id } });
    await this.changes.record(
      actorId,
      { action: 'room.delete', entity: 'Room', entityId: id, summary: { slug: room.slug } },
      [CACHE_TAGS.promotions],
    );
  }

  // ─── Public ─────────────────────────────────────────────────────────────────

  private publicRoomInclude() {
    return {
      images: {
        orderBy: { sortOrder: 'asc' },
        include: { mediaAsset: { select: PUBLIC_MEDIA_SELECT } },
      },
      amenities: {
        where: { amenity: { active: true } },
        include: { amenity: { select: { name: true, iconKey: true, sortOrder: true } } },
      },
    } satisfies Prisma.RoomInclude;
  }

  private presentPublicSummary(
    room: Prisma.RoomGetPayload<{ include: ReturnType<RoomsService['publicRoomInclude']> }>,
  ) {
    const cover = room.images.find((image) => image.isCover);
    return {
      slug: room.slug,
      name: room.name,
      type: room.type,
      shortDescription: room.shortDescription,
      capacity: room.capacity,
      basePrice: room.basePrice,
      currency: room.currency,
      priceUnit: room.priceUnit,
      taxesIncluded: room.taxesIncluded,
      cover: toPublicMedia(cover?.mediaAsset, this.publicBaseUrl),
      /** Sitemap `lastModified` (requirement 19.1). */
      updatedAt: room.updatedAt,
      amenities: room.amenities
        .map((a) => a.amenity)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(({ name, iconKey }) => ({ name, iconKey })),
    };
  }

  async listPublished() {
    const rooms = await this.prisma.room.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: this.publicRoomInclude(),
    });
    return rooms.map((room) => this.presentPublicSummary(room));
  }

  /** Published room by slug; an old slug answers `{ redirectTo }` (301 handled by the web). */
  async getPublishedBySlug(slug: string, now = new Date()) {
    const room = await this.prisma.room.findFirst({
      where: { slug, status: 'PUBLISHED' },
      include: {
        ...this.publicRoomInclude(),
        promotions: {
          where: { status: 'PUBLISHED', startsAt: { lte: now }, endsAt: { gt: now } },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            conditions: true,
            startsAt: true,
            endsAt: true,
          },
        },
      },
    });
    if (room) {
      return {
        ...this.presentPublicSummary(room),
        description: room.description,
        beds: room.beds,
        areaM2: room.areaM2 === null ? null : Number(room.areaM2),
        priceNotes: room.priceNotes,
        seoTitle: room.seoTitle,
        seoDescription: room.seoDescription,
        images: room.images
          .map((image) => toPublicMedia(image.mediaAsset, this.publicBaseUrl))
          .filter((media) => media !== null),
        promotions: room.promotions,
      };
    }

    const redirect = await this.prisma.roomSlugRedirect.findUnique({
      where: { oldSlug: slug },
      select: { room: { select: { slug: true, status: true } } },
    });
    if (redirect?.room.status === 'PUBLISHED') return { redirectTo: redirect.room.slug };
    throw new NotFoundException('Room not found.');
  }
}
