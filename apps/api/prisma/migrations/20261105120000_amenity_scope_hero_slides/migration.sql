-- Owner decision 2026-11-05 (ADR 0015): one "Comodidades" catalog. Hotel services become Amenity
-- rows with scope HOTEL, the duplicated Wi-Fi (room amenity + internet service) becomes one HOTEL
-- amenity, and the Service table is dropped. Also adds the ordered home hero slides.
-- Safe on existing data: rows are moved before the table is dropped; it runs in one transaction.

-- CreateEnum
CREATE TYPE "AmenityScope" AS ENUM ('HOTEL', 'ROOM');

-- AlterTable: every existing amenity is room equipment.
ALTER TABLE "Amenity" ADD COLUMN "scope" "AmenityScope" NOT NULL DEFAULT 'ROOM';

-- ─── Data: services → HOTEL amenities ────────────────────────────────────────
-- The service id is kept (audit entries stay meaningful). highlighted → showOnHome. Service media
-- is dropped from the row (the asset stays in the media library). Amenity.iconKey is required, so a
-- service without icon gets 'sparkles'. A same-named amenity becomes the HOTEL one.
INSERT INTO "Amenity" (id, name, description, "iconKey", scope, active, "showOnHome", "sortOrder", "createdAt", "updatedAt")
SELECT s.id, s.name, s.description, COALESCE(s."iconKey", 'sparkles'), 'HOTEL', s.active, s.highlighted, s."sortOrder", s."createdAt", now()
FROM "Service" s
WHERE s.name <> 'Internet en todos los pisos'
ON CONFLICT (name) DO UPDATE SET scope = 'HOTEL', "showOnHome" = "Amenity"."showOnHome" OR EXCLUDED."showOnHome", "updatedAt" = now();

-- The internet service becomes "Wi-Fi en todo el hotel" (skipped when that name already exists).
INSERT INTO "Amenity" (id, name, description, "iconKey", scope, active, "showOnHome", "sortOrder", "createdAt", "updatedAt")
SELECT s.id, 'Wi-Fi en todo el hotel',
  CASE WHEN s.description IS NULL OR s.description = 'Conexión a internet disponible en todos los pisos del hotel.'
    THEN 'Conexión Wi-Fi en las habitaciones y en todos los pisos del hotel.' ELSE s.description END,
  CASE WHEN s."iconKey" IS NULL OR s."iconKey" = 'router' THEN 'wifi' ELSE s."iconKey" END,
  'HOTEL', s.active, s.highlighted, s."sortOrder", s."createdAt", now()
FROM "Service" s
WHERE s.name = 'Internet en todos los pisos'
ON CONFLICT (name) DO NOTHING;

-- ─── Data: Wi-Fi room amenity → the HOTEL Wi-Fi ──────────────────────────────
-- Wi-Fi now applies to the whole hotel, so its per-room links go.
DELETE FROM "RoomAmenity" WHERE "amenityId" IN (
  SELECT id FROM "Amenity" WHERE scope = 'ROOM' AND lower(name) IN ('wi-fi', 'wifi'));

-- If the hotel Wi-Fi exists, it inherits the home flag and the room row goes; otherwise the room row
-- itself becomes the hotel Wi-Fi.
UPDATE "Amenity" h SET "showOnHome" = h."showOnHome" OR r."showOnHome", "updatedAt" = now()
FROM "Amenity" r
WHERE h.name = 'Wi-Fi en todo el hotel' AND r.scope = 'ROOM' AND lower(r.name) IN ('wi-fi', 'wifi');

DELETE FROM "Amenity" WHERE scope = 'ROOM' AND lower(name) IN ('wi-fi', 'wifi')
  AND EXISTS (SELECT 1 FROM "Amenity" WHERE name = 'Wi-Fi en todo el hotel');

UPDATE "Amenity" SET name = 'Wi-Fi en todo el hotel', scope = 'HOTEL',
  description = COALESCE(description, 'Conexión Wi-Fi en las habitaciones y en todos los pisos del hotel.'),
  "updatedAt" = now()
WHERE scope = 'ROOM' AND lower(name) IN ('wi-fi', 'wifi');

-- HOTEL amenities are never assigned per room.
DELETE FROM "RoomAmenity" WHERE "amenityId" IN (SELECT id FROM "Amenity" WHERE scope = 'HOTEL');

-- System audit entry (no admin user).
INSERT INTO "AuditLog" (id, "adminUserId", action, entity, summary)
SELECT uuidv7(), NULL, 'system.migration', 'Amenity',
  jsonb_build_object('migration', '20261105120000_amenity_scope_hero_slides',
    'servicesMoved', (SELECT count(*) FROM "Service"),
    'note', 'Services moved to HOTEL amenities; Wi-Fi merged into "Wi-Fi en todo el hotel".');

-- ─── Drop Service ────────────────────────────────────────────────────────────
-- DropForeignKey
ALTER TABLE "Service" DROP CONSTRAINT "Service_mediaAssetId_fkey";

-- DropTable
DROP TABLE "Service";

-- CreateIndex
CREATE INDEX "Amenity_scope_active_sortOrder_idx" ON "Amenity"("scope", "active", "sortOrder");

-- ─── Hero slides ─────────────────────────────────────────────────────────────
-- CreateTable
CREATE TABLE "HeroSlide" (
    "id" UUID NOT NULL,
    "mediaAssetId" UUID NOT NULL,
    "altText" TEXT,
    "caption" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "HeroSlide_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HeroSlide_mediaAssetId_key" ON "HeroSlide"("mediaAssetId");

-- CreateIndex
CREATE INDEX "HeroSlide_active_sortOrder_idx" ON "HeroSlide"("active", "sortOrder");

-- AddForeignKey
ALTER TABLE "HeroSlide" ADD CONSTRAINT "HeroSlide_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
