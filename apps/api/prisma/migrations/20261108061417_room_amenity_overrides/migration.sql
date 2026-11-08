-- CreateTable
CREATE TABLE "RoomAmenityOverride" (
    "roomId" UUID NOT NULL,
    "amenityId" UUID NOT NULL,
    "available" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomAmenityOverride_pkey" PRIMARY KEY ("roomId","amenityId")
);

-- CreateIndex
CREATE INDEX "RoomAmenityOverride_amenityId_idx" ON "RoomAmenityOverride"("amenityId");

-- AddForeignKey
ALTER TABLE "RoomAmenityOverride" ADD CONSTRAINT "RoomAmenityOverride_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomAmenityOverride" ADD CONSTRAINT "RoomAmenityOverride_amenityId_fkey" FOREIGN KEY ("amenityId") REFERENCES "Amenity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
