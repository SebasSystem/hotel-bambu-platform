-- Owner decisions 2026-11-05 (ADR 0016): a RoomType level (rooms keep only number/name, status and
-- order), nearby places, one hero source (HeroSlide), one description source (HotelProfile),
-- WhatsApp messages as code defaults, no promotions, no per-room SEO fields, a single ADMIN role.
-- Safe on existing data: every move runs before the DDL that drops its source, and the whole file
-- runs in one transaction. What cannot move is counted (or kept) in a system AuditLog entry.

-- ─── Enum rename ─────────────────────────────────────────────────────────────
-- A table creates a row type with its own name, so the enum "RoomType" must give way to the new
-- table. The existing Room.type column follows the rename.
ALTER TYPE "RoomType" RENAME TO "RoomKind";

-- ─── New tables ──────────────────────────────────────────────────────────────
-- CreateTable
CREATE TABLE "RoomType" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "RoomKind" NOT NULL,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "description" TEXT,
    "capacity" INTEGER NOT NULL,
    "beds" JSONB,
    "areaM2" DECIMAL(6,2),
    "basePrice" INTEGER,
    "currency" CHAR(3) NOT NULL DEFAULT 'COP',
    "priceUnit" "PriceUnit" NOT NULL DEFAULT 'PER_NIGHT',
    "taxesIncluded" BOOLEAN NOT NULL DEFAULT true,
    "priceNotes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "RoomType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomTypeSlugRedirect" (
    "id" UUID NOT NULL,
    "oldSlug" TEXT NOT NULL,
    "roomTypeId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomTypeSlugRedirect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomTypeImage" (
    "id" UUID NOT NULL,
    "roomTypeId" UUID NOT NULL,
    "mediaAssetId" UUID NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "RoomTypeImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomTypeAmenity" (
    "roomTypeId" UUID NOT NULL,
    "amenityId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomTypeAmenity_pkey" PRIMARY KEY ("roomTypeId","amenityId")
);

-- CreateTable
CREATE TABLE "NearbyPlace" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "distanceText" TEXT,
    "travelTimeText" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "NearbyPlace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoomType_slug_key" ON "RoomType"("slug");
CREATE INDEX "RoomType_status_sortOrder_idx" ON "RoomType"("status", "sortOrder");
CREATE UNIQUE INDEX "RoomTypeSlugRedirect_oldSlug_key" ON "RoomTypeSlugRedirect"("oldSlug");
CREATE INDEX "RoomTypeSlugRedirect_roomTypeId_idx" ON "RoomTypeSlugRedirect"("roomTypeId");
CREATE INDEX "RoomTypeImage_roomTypeId_sortOrder_idx" ON "RoomTypeImage"("roomTypeId", "sortOrder");
CREATE INDEX "RoomTypeImage_mediaAssetId_idx" ON "RoomTypeImage"("mediaAssetId");
CREATE UNIQUE INDEX "RoomTypeImage_roomTypeId_mediaAssetId_key" ON "RoomTypeImage"("roomTypeId", "mediaAssetId");
CREATE INDEX "RoomTypeAmenity_amenityId_idx" ON "RoomTypeAmenity"("amenityId");
CREATE INDEX "NearbyPlace_active_sortOrder_idx" ON "NearbyPlace"("active", "sortOrder");

-- ─── Data: rooms → room types ────────────────────────────────────────────────
-- Rooms of one kind in a stable order: published first, then admin order, then name. The first
-- room is the representative: each shared field comes from the first room (in that order) that has
-- a value for it. The rate keeps the unit and taxes flag of the room it comes from.
CREATE TEMP TABLE "_ranked_room" AS
SELECT r.*, row_number() OVER (
  PARTITION BY r.type ORDER BY (r.status = 'PUBLISHED') DESC, r."sortOrder", r.name, r.id) AS rn
FROM "Room" r;

INSERT INTO "RoomType" (id, slug, name, type, status, description, capacity, beds, "areaM2",
  "basePrice", currency, "priceUnit", "taxesIncluded", "priceNotes", "sortOrder", "createdAt", "updatedAt")
SELECT uuidv7(),
  CASE k.type WHEN 'INDIVIDUAL' THEN 'habitacion-individual' WHEN 'COUPLE' THEN 'habitacion-pareja'
    WHEN 'TWIN' THEN 'habitacion-doble' ELSE 'habitacion-familiar' END,
  CASE k.type WHEN 'INDIVIDUAL' THEN 'Habitación individual' WHEN 'COUPLE' THEN 'Habitación de pareja'
    WHEN 'TWIN' THEN 'Habitación doble' ELSE 'Habitación familiar' END,
  k.type,
  CASE WHEN k.any_published THEN 'PUBLISHED'::"PublicationStatus"
    WHEN k.all_inactive THEN 'INACTIVE'::"PublicationStatus" ELSE 'DRAFT'::"PublicationStatus" END,
  k.description, k.capacity, k.beds, k."areaM2", k."basePrice", 'COP',
  COALESCE(k."priceUnit", 'PER_NIGHT'), COALESCE(k."taxesIncluded", true), k."priceNotes",
  (row_number() OVER (ORDER BY array_position(enum_range(NULL::"RoomKind"), k.type)) - 1)::int,
  k."createdAt", now()
FROM (
  SELECT r.type,
    bool_or(r.status = 'PUBLISHED') AS any_published,
    bool_and(r.status = 'INACTIVE') AS all_inactive,
    (array_agg(COALESCE(r.description, r."shortDescription") ORDER BY r.rn)
      FILTER (WHERE COALESCE(r.description, r."shortDescription") IS NOT NULL))[1] AS description,
    (array_agg(r.capacity ORDER BY r.rn))[1] AS capacity,
    (array_agg(r.beds ORDER BY r.rn) FILTER (WHERE r.beds IS NOT NULL AND r.beds <> '[]'::jsonb))[1] AS beds,
    (array_agg(r."areaM2" ORDER BY r.rn) FILTER (WHERE r."areaM2" IS NOT NULL))[1] AS "areaM2",
    (array_agg(r."basePrice" ORDER BY r.rn) FILTER (WHERE r."basePrice" IS NOT NULL))[1] AS "basePrice",
    (array_agg(r."priceUnit" ORDER BY r.rn) FILTER (WHERE r."basePrice" IS NOT NULL))[1] AS "priceUnit",
    (array_agg(r."taxesIncluded" ORDER BY r.rn) FILTER (WHERE r."basePrice" IS NOT NULL))[1] AS "taxesIncluded",
    (array_agg(r."priceNotes" ORDER BY r.rn) FILTER (WHERE r."priceNotes" IS NOT NULL))[1] AS "priceNotes",
    min(r."createdAt") AS "createdAt"
  FROM "_ranked_room" r
  GROUP BY r.type
) k;

-- Photos: the union of the rooms' photos, once each, in first-seen order. The cover is the first
-- cover found in room order and goes first.
CREATE TEMP TABLE "_type_image" AS
SELECT t.id AS "roomTypeId", i."mediaAssetId",
  min(r.rn * 100000 + i."sortOrder") AS first_seen,
  min(i."createdAt") AS "createdAt"
FROM "RoomImage" i
JOIN "_ranked_room" r ON r.id = i."roomId"
JOIN "RoomType" t ON t.type = r.type
GROUP BY t.id, i."mediaAssetId";

CREATE TEMP TABLE "_type_cover" AS
SELECT DISTINCT ON (t.id) t.id AS "roomTypeId", i."mediaAssetId"
FROM "RoomImage" i
JOIN "_ranked_room" r ON r.id = i."roomId"
JOIN "RoomType" t ON t.type = r.type
WHERE i."isCover"
ORDER BY t.id, r.rn, i."sortOrder";

INSERT INTO "RoomTypeImage" (id, "roomTypeId", "mediaAssetId", "sortOrder", "isCover", "createdAt", "updatedAt")
SELECT uuidv7(), ti."roomTypeId", ti."mediaAssetId",
  (row_number() OVER (PARTITION BY ti."roomTypeId" ORDER BY (c."mediaAssetId" IS NOT NULL) DESC, ti.first_seen) - 1)::int,
  c."mediaAssetId" IS NOT NULL, ti."createdAt", now()
FROM "_type_image" ti
LEFT JOIN "_type_cover" c ON c."roomTypeId" = ti."roomTypeId" AND c."mediaAssetId" = ti."mediaAssetId";

-- Room amenities: the union of the rooms' links (only ROOM amenities have links, ADR 0015).
INSERT INTO "RoomTypeAmenity" ("roomTypeId", "amenityId", "createdAt")
SELECT t.id, ra."amenityId", min(ra."createdAt")
FROM "RoomAmenity" ra
JOIN "Room" r ON r.id = ra."roomId"
JOIN "RoomType" t ON t.type = r.type
GROUP BY t.id, ra."amenityId";

-- Old room URLs (current slugs and their redirects) answer a 301 to the type page. A slug that is
-- now a type slug needs no redirect: that URL serves the type itself.
INSERT INTO "RoomTypeSlugRedirect" (id, "oldSlug", "roomTypeId", "createdAt")
SELECT uuidv7(), s.slug, s."roomTypeId", now()
FROM (
  SELECT r.slug, t.id AS "roomTypeId" FROM "Room" r JOIN "RoomType" t ON t.type = r.type
  UNION
  SELECT rr."oldSlug", t.id FROM "RoomSlugRedirect" rr
  JOIN "Room" r ON r.id = rr."roomId" JOIN "RoomType" t ON t.type = r.type
) s
WHERE NOT EXISTS (SELECT 1 FROM "RoomType" t WHERE t.slug = s.slug)
ON CONFLICT ("oldSlug") DO NOTHING;

-- Rooms point to their type.
ALTER TABLE "Room" ADD COLUMN "roomTypeId" UUID;
UPDATE "Room" r SET "roomTypeId" = t.id FROM "RoomType" t WHERE t.type = r.type;
ALTER TABLE "Room" ALTER COLUMN "roomTypeId" SET NOT NULL;

-- ─── Data: single hero source ────────────────────────────────────────────────
-- The hotel hero image and the HERO section image become slides after the existing ones. A slide
-- is active only when its media is publishable (READY with alt text), as the API requires.
INSERT INTO "HeroSlide" (id, "mediaAssetId", active, "sortOrder", "createdAt", "updatedAt")
SELECT uuidv7(), m.id, m.status = 'READY' AND COALESCE(btrim(m."altText"), '') <> '',
  (SELECT COALESCE(max("sortOrder"), -1) FROM "HeroSlide") + c.position, now(), now()
FROM (
  SELECT "heroMediaId" AS media_id, 1 AS position FROM "HotelProfile" WHERE "heroMediaId" IS NOT NULL
  UNION ALL
  SELECT "mediaAssetId", 2 FROM "LandingSection" WHERE key = 'HERO' AND "mediaAssetId" IS NOT NULL
) c
JOIN "MediaAsset" m ON m.id = c.media_id
ON CONFLICT ("mediaAssetId") DO NOTHING;

-- ─── Data: single description source ─────────────────────────────────────────
UPDATE "HotelProfile" h SET description = s.body, "updatedAt" = now()
FROM "LandingSection" s
WHERE s.key = 'ABOUT' AND COALESCE(btrim(s.body), '') <> '' AND COALESCE(btrim(h.description), '') = '';

-- ─── Data: single role ───────────────────────────────────────────────────────
UPDATE "AdminUser" SET role = 'ADMIN', "updatedAt" = now() WHERE role = 'EDITOR';

-- ─── System audit entry (no admin user) ──────────────────────────────────────
-- Removed content that has no new home is counted; edited WhatsApp bodies are kept for reference.
INSERT INTO "AuditLog" (id, "adminUserId", action, entity, summary)
SELECT uuidv7(), NULL, 'system.migration', 'RoomType',
  jsonb_build_object(
    'migration', '20261105140000_room_types_and_single_sources',
    'roomTypesCreated', (SELECT count(*) FROM "RoomType"),
    'roomsLinked', (SELECT count(*) FROM "Room"),
    'roomRedirects', (SELECT count(*) FROM "RoomTypeSlugRedirect"),
    'promotionsRemoved', (SELECT count(*) FROM "Promotion"),
    'seoFieldsRemoved', (SELECT count(*) FROM "Room" WHERE "seoTitle" IS NOT NULL OR "seoDescription" IS NOT NULL),
    'sectionCopyRemoved', (SELECT count(*) FROM "LandingSection"
      WHERE subtitle IS NOT NULL OR "ctaLabel" IS NOT NULL OR (body IS NOT NULL AND key <> 'ABOUT')),
    'sectionMediaRemoved', (SELECT count(*) FROM "LandingSection" WHERE "mediaAssetId" IS NOT NULL AND key <> 'HERO'),
    'heroVideoRemoved', (SELECT count(*) FROM "HotelProfile" WHERE "heroVideoMediaId" IS NOT NULL),
    'customTemplates', COALESCE((SELECT jsonb_agg(jsonb_build_object('key', key, 'body', body) ORDER BY key)
      FROM "WhatsAppTemplate"
      WHERE (key = 'GENERAL' AND body <> 'Hola, vi su hotel en su página web y quisiera obtener más información.')
        OR (key = 'ROOM' AND body <> 'Hola, estoy interesado en la habitación {{habitacion}}. ¿Podrían brindarme información sobre disponibilidad y tarifa?')
        OR (key = 'PROMOTION' AND body <> 'Hola, vi la promoción {{promocion}} en su página web y quisiera más información.')),
      '[]'::jsonb),
    'note', 'Rooms grouped into room types; promotions, WhatsApp templates, per-room SEO fields and section copy removed.');

-- ─── DDL: drop the moved sources ─────────────────────────────────────────────
DROP TABLE "_type_cover";
DROP TABLE "_type_image";
DROP TABLE "_ranked_room";

-- DropForeignKey
ALTER TABLE "HotelProfile" DROP CONSTRAINT "HotelProfile_heroMediaId_fkey";
ALTER TABLE "HotelProfile" DROP CONSTRAINT "HotelProfile_heroVideoMediaId_fkey";
ALTER TABLE "LandingSection" DROP CONSTRAINT "LandingSection_mediaAssetId_fkey";
ALTER TABLE "Promotion" DROP CONSTRAINT "Promotion_roomId_fkey";
ALTER TABLE "RoomAmenity" DROP CONSTRAINT "RoomAmenity_amenityId_fkey";
ALTER TABLE "RoomAmenity" DROP CONSTRAINT "RoomAmenity_roomId_fkey";
ALTER TABLE "RoomImage" DROP CONSTRAINT "RoomImage_mediaAssetId_fkey";
ALTER TABLE "RoomImage" DROP CONSTRAINT "RoomImage_roomId_fkey";
ALTER TABLE "RoomSlugRedirect" DROP CONSTRAINT "RoomSlugRedirect_roomId_fkey";

-- DropIndex
DROP INDEX "Room_slug_key";
DROP INDEX "Room_status_sortOrder_idx";

-- AlterTable
ALTER TABLE "HotelProfile" DROP COLUMN "heroMediaId",
DROP COLUMN "heroVideoMediaId",
ADD COLUMN     "country" TEXT,
ADD COLUMN     "tagline" TEXT,
ADD COLUMN     "whatsappGreeting" TEXT;

-- AlterTable
ALTER TABLE "LandingSection" DROP COLUMN "body",
DROP COLUMN "ctaLabel",
DROP COLUMN "mediaAssetId",
DROP COLUMN "subtitle",
DROP COLUMN "title";

-- AlterTable (the column CHECK constraints of the init migration go with their columns)
ALTER TABLE "Room" DROP COLUMN "areaM2",
DROP COLUMN "basePrice",
DROP COLUMN "beds",
DROP COLUMN "capacity",
DROP COLUMN "currency",
DROP COLUMN "description",
DROP COLUMN "priceNotes",
DROP COLUMN "priceUnit",
DROP COLUMN "seoDescription",
DROP COLUMN "seoTitle",
DROP COLUMN "shortDescription",
DROP COLUMN "slug",
DROP COLUMN "taxesIncluded",
DROP COLUMN "type";

-- DropTable
DROP TABLE "Promotion";
DROP TABLE "RoomAmenity";
DROP TABLE "RoomImage";
DROP TABLE "RoomSlugRedirect";
DROP TABLE "WhatsAppTemplate";

-- DropEnum
DROP TYPE "WhatsAppTemplateKey";

-- AlterEnum: AdminRole loses EDITOR (no row uses it any more, see above).
CREATE TYPE "AdminRole_new" AS ENUM ('ADMIN');
ALTER TABLE "AdminUser" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "AdminUser" ALTER COLUMN "role" TYPE "AdminRole_new" USING ("role"::text::"AdminRole_new");
ALTER TYPE "AdminRole" RENAME TO "AdminRole_old";
ALTER TYPE "AdminRole_new" RENAME TO "AdminRole";
DROP TYPE "AdminRole_old";
ALTER TABLE "AdminUser" ALTER COLUMN "role" SET DEFAULT 'ADMIN';

-- CreateIndex
CREATE INDEX "Room_roomTypeId_status_idx" ON "Room"("roomTypeId", "status");
CREATE INDEX "Room_sortOrder_idx" ON "Room"("sortOrder");

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RoomTypeSlugRedirect" ADD CONSTRAINT "RoomTypeSlugRedirect_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoomTypeImage" ADD CONSTRAINT "RoomTypeImage_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoomTypeImage" ADD CONSTRAINT "RoomTypeImage_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RoomTypeAmenity" ADD CONSTRAINT "RoomTypeAmenity_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoomTypeAmenity" ADD CONSTRAINT "RoomTypeAmenity_amenityId_fkey" FOREIGN KEY ("amenityId") REFERENCES "Amenity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─── Database-level rules Prisma cannot express ─────────────────────────────
ALTER TABLE "RoomType" ADD CONSTRAINT "RoomType_slug_format_check" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
ALTER TABLE "RoomType" ADD CONSTRAINT "RoomType_capacity_check" CHECK ("capacity" BETWEEN 1 AND 50);
ALTER TABLE "RoomType" ADD CONSTRAINT "RoomType_base_price_check" CHECK ("basePrice" IS NULL OR "basePrice" >= 0);
ALTER TABLE "RoomType" ADD CONSTRAINT "RoomType_area_check" CHECK ("areaM2" IS NULL OR "areaM2" > 0);
ALTER TABLE "RoomType" ADD CONSTRAINT "RoomType_currency_check" CHECK ("currency" = 'COP');

-- At most one cover image per room type.
CREATE UNIQUE INDEX "RoomTypeImage_one_cover_per_type" ON "RoomTypeImage" ("roomTypeId") WHERE "isCover";
