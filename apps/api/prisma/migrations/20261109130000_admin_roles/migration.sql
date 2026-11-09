-- Feature admin-users-roles: roles become rows with a permission list (shared catalog in
-- packages/shared/src/auth/permissions.ts) and replace the single-value AdminRole enum.
-- The three seeded roles use the stable ids of apps/api/src/seeds/base-data.ts (DEFAULT_ROLES);
-- seedBase converges them on every run. Every existing admin becomes Administrador.

-- CreateTable
CREATE TABLE "Role" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- At most one system role (Prisma cannot express a partial unique index).
CREATE UNIQUE INDEX "Role_single_system_key" ON "Role"("isSystem") WHERE "isSystem";

-- Seeded roles
INSERT INTO "Role" ("id", "name", "description", "permissions", "isSystem", "updatedAt") VALUES
  ('00000000-0000-7000-8000-000000000001', 'Administrador',
   'Acceso completo al panel, incluidos usuarios y roles.',
   ARRAY['dashboard.view', 'dashboard.manage', 'hotel.view', 'hotel.manage', 'rooms.view',
         'rooms.manage', 'content.view', 'content.manage', 'media.view', 'media.manage',
         'activity.view', 'activity.manage', 'users.view', 'users.manage']::TEXT[],
   true, CURRENT_TIMESTAMP),
  ('00000000-0000-7000-8000-000000000002', 'Editor de contenido',
   'Edita el hotel, las habitaciones, el contenido y la biblioteca de medios.',
   ARRAY['dashboard.view', 'hotel.view', 'hotel.manage', 'rooms.view', 'rooms.manage',
         'content.view', 'content.manage', 'media.view', 'media.manage']::TEXT[],
   false, CURRENT_TIMESTAMP),
  ('00000000-0000-7000-8000-000000000003', 'Recepción',
   'Consulta el resumen del panel.',
   ARRAY['dashboard.view']::TEXT[],
   false, CURRENT_TIMESTAMP);

-- AlterTable: every existing admin becomes Administrador, then the enum column goes away.
ALTER TABLE "AdminUser" ADD COLUMN "roleId" UUID;
UPDATE "AdminUser" SET "roleId" = '00000000-0000-7000-8000-000000000001';
ALTER TABLE "AdminUser" ALTER COLUMN "roleId" SET NOT NULL;
ALTER TABLE "AdminUser" DROP COLUMN "role";

-- DropEnum
DROP TYPE "AdminRole";

-- CreateIndex
CREATE INDEX "AdminUser_roleId_idx" ON "AdminUser"("roleId");

-- AddForeignKey
ALTER TABLE "AdminUser" ADD CONSTRAINT "AdminUser_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
