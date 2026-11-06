import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest';

/**
 * Data migration check for `amenity_scope_hero_slides` (ADR 0015): a scratch database gets the
 * previous schema (init migration) plus legacy rows, then the new migration runs on top of it.
 */

const MIGRATIONS = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../prisma/migrations',
);
const SCRATCH_DB = 'hotel_migration_test';
const INIT = '20261104213307_init';
const TARGET = '20261105120000_amenity_scope_hero_slides';
const CLEANUP = '20261105130000_clear_restated_amenity_descriptions';

/** `pg` (the Prisma driver) ships no types and @types/pg is not a dependency: only these are used. */
interface SqlClient {
  connect(): Promise<void>;
  query(text: string): Promise<{ rows: unknown[] }>;
  end(): Promise<void>;
}
const PG_MODULE = 'pg';
const pg = (
  (await import(PG_MODULE)) as {
    default: { Client: new (options: { connectionString: string }) => SqlClient };
  }
).default;

const sql = (name: string) => readFileSync(path.join(MIGRATIONS, name, 'migration.sql'), 'utf8');

const databaseUrl = inject('testDatabaseUrl');

describe.skipIf(!databaseUrl)(
  'migrations amenity_scope_hero_slides + clear_restated_amenity_descriptions',
  () => {
    // A placeholder keeps collection working when the suite is skipped (no database).
    const adminUrl = new URL(databaseUrl || 'postgresql://localhost/skipped');
    const scratchUrl = new URL(adminUrl);
    scratchUrl.pathname = `/${SCRATCH_DB}`;
    let db: SqlClient;

    const rows = async <T>(query: string) => (await db.query(query)).rows as T[];

    beforeAll(async () => {
      const admin = new pg.Client({ connectionString: adminUrl.toString() });
      await admin.connect();
      await admin.query(`DROP DATABASE IF EXISTS "${SCRATCH_DB}" WITH (FORCE)`);
      await admin.query(`CREATE DATABASE "${SCRATCH_DB}"`);
      await admin.end();

      db = new pg.Client({ connectionString: scratchUrl.toString() });
      await db.connect();
      await db.query(sql(INIT));
      // Legacy data as seeded on 2026-11-04 (ADR 0006), plus one service with an image and one
      // without icon, and two rooms linked to every room amenity.
      await db.query(`
      INSERT INTO "MediaAsset" (id, "storageKey", "mimeType", checksum, "sizeBytes", "updatedAt")
        VALUES ('00000000-0000-7000-8000-0000000000f1', 'media/k1', 'image/jpeg', 'c1', 1, now());
      INSERT INTO "Amenity" (id, name, "iconKey", "showOnHome", "sortOrder", "updatedAt") VALUES
        ('00000000-0000-7000-8000-0000000000a1', 'Baño privado', 'bath', true, 0, now()),
        ('00000000-0000-7000-8000-0000000000a2', 'Televisor', 'tv', true, 1, now()),
        ('00000000-0000-7000-8000-0000000000a3', 'Ventilador', 'fan', true, 2, now()),
        ('00000000-0000-7000-8000-0000000000a4', 'Wi-Fi', 'wifi', true, 3, now());
      INSERT INTO "Service" (id, name, description, "iconKey", "mediaAssetId", active, highlighted, "sortOrder", "updatedAt") VALUES
        ('00000000-0000-7000-8000-0000000000b1', 'Paneles solares', 'El hotel cuenta con paneles solares.', 'sun', NULL, true, true, 0, now()),
        ('00000000-0000-7000-8000-0000000000b2', 'Reserva de agua', 'El hotel cuenta con reserva de agua.', 'droplets', '00000000-0000-7000-8000-0000000000f1', true, false, 1, now()),
        ('00000000-0000-7000-8000-0000000000b3', 'Internet en todos los pisos', 'Conexión a internet disponible en todos los pisos del hotel.', 'router', NULL, true, true, 2, now()),
        ('00000000-0000-7000-8000-0000000000b4', 'Recepción', NULL, NULL, NULL, false, false, 3, now());
      INSERT INTO "Room" (id, slug, name, type, capacity, "updatedAt") VALUES
        ('00000000-0000-7000-8000-0000000000c1', 'habitacion-1', 'Habitación 1', 'COUPLE', 2, now()),
        ('00000000-0000-7000-8000-0000000000c2', 'habitacion-2', 'Habitación 2', 'INDIVIDUAL', 1, now());
      INSERT INTO "RoomAmenity" ("roomId", "amenityId")
        SELECT r.id, a.id FROM "Room" r CROSS JOIN "Amenity" a;
    `);
      await db.query(sql(TARGET));
      await db.query(sql(CLEANUP));
    });

    afterAll(async () => {
      await db?.end();
      const admin = new pg.Client({ connectionString: adminUrl.toString() });
      await admin.connect();
      await admin.query(`DROP DATABASE IF EXISTS "${SCRATCH_DB}" WITH (FORCE)`);
      await admin.end();
    });

    it('drops the Service table', async () => {
      const [row] = await rows<{ exists: boolean }>(
        `SELECT to_regclass('public."Service"') IS NOT NULL AS exists`,
      );
      expect(row?.exists).toBe(false);
    });

    it('keeps the room equipment as ROOM amenities with their room links', async () => {
      const room = await rows<{ name: string; links: number }>(`
      SELECT a.name, count(ra."roomId")::int AS links FROM "Amenity" a
      LEFT JOIN "RoomAmenity" ra ON ra."amenityId" = a.id
      WHERE a.scope = 'ROOM' GROUP BY a.name ORDER BY a.name`);
      expect(room).toEqual([
        { name: 'Baño privado', links: 2 },
        { name: 'Televisor', links: 2 },
        { name: 'Ventilador', links: 2 },
      ]);
    });

    it('merges the Wi-Fi amenity and the internet service into one HOTEL amenity', async () => {
      const wifi = await rows<Record<string, unknown>>(`
      SELECT name, description, "iconKey", "showOnHome", active FROM "Amenity"
      WHERE lower(name) LIKE '%wi-fi%' OR lower(name) LIKE '%internet%'`);
      expect(wifi).toEqual([
        {
          name: 'Wi-Fi en todo el hotel',
          description: 'Conexión Wi-Fi en las habitaciones y en todos los pisos del hotel.',
          iconKey: 'wifi',
          showOnHome: true,
          active: true,
        },
      ]);
    });

    it('moves every other service into a HOTEL amenity (highlighted → showOnHome, icon fallback)', async () => {
      const hotel = await rows<Record<string, unknown>>(`
      SELECT id, name, "iconKey", "showOnHome", active, "sortOrder" FROM "Amenity"
      WHERE scope = 'HOTEL' ORDER BY "sortOrder"`);
      expect(hotel.map((a) => a['name'])).toEqual([
        'Paneles solares',
        'Reserva de agua',
        'Wi-Fi en todo el hotel',
        'Recepción',
      ]);
      expect(hotel[0]).toMatchObject({
        id: '00000000-0000-7000-8000-0000000000b1',
        showOnHome: true,
      });
      expect(hotel[1]).toMatchObject({ iconKey: 'droplets', showOnHome: false });
      expect(hotel[3]).toMatchObject({ iconKey: 'sparkles', active: false, showOnHome: false });
    });

    it('leaves no room links on HOTEL amenities and keeps the service media in the library', async () => {
      const [links] = await rows<{ count: number }>(`
      SELECT count(*)::int AS count FROM "RoomAmenity" ra
      JOIN "Amenity" a ON a.id = ra."amenityId" WHERE a.scope = 'HOTEL'`);
      expect(links?.count).toBe(0);
      const [media] = await rows<{ count: number }>(
        `SELECT count(*)::int AS count FROM "MediaAsset"`,
      );
      expect(media?.count).toBe(1);
    });

    it('records the data move in the audit log and creates the HeroSlide table', async () => {
      const audit = await rows<{ action: string; adminUserId: string | null }>(
        `SELECT action, "adminUserId" FROM "AuditLog"`,
      );
      expect(audit).toEqual([{ action: 'system.migration', adminUserId: null }]);
      const [slides] = await rows<{ exists: boolean }>(
        `SELECT to_regclass('public."HeroSlide"') IS NOT NULL AS exists`,
      );
      expect(slides?.exists).toBe(true);
    });

    it('clears hotel descriptions that only restate the name, keeping real ones', async () => {
      const descriptions = await rows<{ name: string; description: string | null }>(`
      SELECT name, description FROM "Amenity" WHERE scope = 'HOTEL' ORDER BY "sortOrder"`);
      expect(descriptions).toEqual([
        { name: 'Paneles solares', description: null },
        { name: 'Reserva de agua', description: null },
        {
          name: 'Wi-Fi en todo el hotel',
          description: 'Conexión Wi-Fi en las habitaciones y en todos los pisos del hotel.',
        },
        { name: 'Recepción', description: null },
      ]);
    });
  },
);
