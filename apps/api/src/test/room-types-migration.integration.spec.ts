import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest';

/**
 * Data migration check for `room_types_and_single_sources` (ADR 0016): a scratch database gets the
 * schema of the previous migrations plus legacy rows (rooms carrying the shared fields, images,
 * amenity links, redirects, promotions, templates, section copy, hotel hero media, an EDITOR), then
 * the new migration runs on top of it.
 */

const MIGRATIONS = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../prisma/migrations',
);
const SCRATCH_DB = 'hotel_migration_room_types_test';
const PREVIOUS = [
  '20261104213307_init',
  '20261105120000_amenity_scope_hero_slides',
  '20261105130000_clear_restated_amenity_descriptions',
];
const TARGET = '20261105140000_room_types_and_single_sources';

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

const id = (suffix: string) => `00000000-0000-7000-8000-${suffix.padStart(12, '0')}`;

const databaseUrl = inject('testDatabaseUrl');

describe.skipIf(!databaseUrl)('migration room_types_and_single_sources', () => {
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
    for (const name of PREVIOUS) await db.query(sql(name));
    await db.query(`
      INSERT INTO "MediaAsset" (id, "storageKey", "mimeType", checksum, "sizeBytes", status, "altText", "updatedAt") VALUES
        ('${id('f1')}', 'media/k1', 'image/jpeg', 'c1', 1, 'READY', 'Cama doble', now()),
        ('${id('f2')}', 'media/k2', 'image/jpeg', 'c2', 1, 'READY', 'Baño privado', now()),
        ('${id('f3')}', 'media/k3', 'image/jpeg', 'c3', 1, 'READY', 'Fachada del hotel', now()),
        ('${id('f4')}', 'media/k4', 'image/jpeg', 'c4', 1, 'READY', NULL, now()),
        ('${id('f5')}', 'media/k5', 'video/mp4', 'c5', 1, 'READY', 'Video', now());
      INSERT INTO "Amenity" (id, name, "iconKey", scope, "sortOrder", "updatedAt") VALUES
        ('${id('a1')}', 'Baño privado', 'bath', 'ROOM', 0, now()),
        ('${id('a2')}', 'Televisor', 'tv', 'ROOM', 1, now()),
        ('${id('a3')}', 'Wi-Fi en todo el hotel', 'wifi', 'HOTEL', 2, now());
      INSERT INTO "Room" (id, slug, name, type, status, "shortDescription", description, capacity, beds, "basePrice", "priceUnit", "sortOrder", "seoTitle", "updatedAt") VALUES
        ('${id('c1')}', 'habitacion-101', 'Habitación 101', 'COUPLE', 'PUBLISHED', 'Para dos.', 'Cama doble y vista a la calle.', 2, '[{"type":"DOUBLE","count":1}]', 120000, 'PER_NIGHT', 0, 'SEO 101', now()),
        ('${id('c2')}', 'habitacion-102', 'Habitación 102', 'COUPLE', 'DRAFT', 'Para dos personas.', NULL, 3, NULL, 90000, 'PER_PERSON_PER_NIGHT', 1, NULL, now()),
        ('${id('c3')}', 'habitacion-individual', 'Habitación 201', 'INDIVIDUAL', 'INACTIVE', 'Para una persona.', NULL, 1, NULL, NULL, 'PER_NIGHT', 2, NULL, now());
      INSERT INTO "RoomImage" (id, "roomId", "mediaAssetId", "sortOrder", "isCover", "updatedAt") VALUES
        ('${id('d1')}', '${id('c1')}', '${id('f2')}', 0, false, now()),
        ('${id('d2')}', '${id('c1')}', '${id('f1')}', 1, true, now()),
        ('${id('d3')}', '${id('c2')}', '${id('f2')}', 0, true, now());
      INSERT INTO "RoomAmenity" ("roomId", "amenityId") VALUES
        ('${id('c1')}', '${id('a1')}'), ('${id('c2')}', '${id('a1')}'), ('${id('c2')}', '${id('a2')}');
      INSERT INTO "RoomSlugRedirect" (id, "oldSlug", "roomId") VALUES ('${id('e1')}', 'suite-101', '${id('c1')}');
      INSERT INTO "Promotion" (id, title, "startsAt", "endsAt", "roomId", "updatedAt")
        VALUES ('${id('b1')}', 'Promo', now(), now() + interval '1 day', '${id('c1')}', now());
      INSERT INTO "WhatsAppTemplate" (id, key, label, body, "allowedVariables", "updatedAt") VALUES
        ('${id('b2')}', 'GENERAL', 'General', 'Hola, vi su hotel en su página web y quisiera obtener más información.', '{}', now()),
        ('${id('b3')}', 'ROOM', 'Habitación', 'Buenas, me interesa {{habitacion}}.', '{habitacion}', now());
      INSERT INTO "LandingSection" (id, key, title, body, "mediaAssetId", enabled, "sortOrder", "updatedAt") VALUES
        ('${id('b4')}', 'HERO', 'Hotel Bambú Plaza', NULL, '${id('f4')}', true, 0, now()),
        ('${id('b5')}', 'ABOUT', 'Sobre nosotros', 'Texto sobre nosotros.', NULL, true, 1, now());
      INSERT INTO "HotelProfile" (id, name, "heroMediaId", "heroVideoMediaId", "updatedAt")
        VALUES (1, 'Hotel Bambú Plaza', '${id('f3')}', '${id('f5')}', now());
      INSERT INTO "AdminUser" (id, email, "passwordHash", role, "updatedAt")
        VALUES ('${id('99')}', 'editor@example.test', 'x', 'EDITOR', now());
    `);
    await db.query(sql(TARGET));
  });

  afterAll(async () => {
    await db?.end();
    const admin = new pg.Client({ connectionString: adminUrl.toString() });
    await admin.connect();
    await admin.query(`DROP DATABASE IF EXISTS "${SCRATCH_DB}" WITH (FORCE)`);
    await admin.end();
  });

  it('creates one room type per distinct room type, from the published room first', async () => {
    const types = await rows<Record<string, unknown>>(`
      SELECT slug, name, type::text, status::text, description, capacity, beds, "basePrice",
        "priceUnit"::text, "sortOrder" FROM "RoomType" ORDER BY "sortOrder"`);
    expect(types).toEqual([
      {
        slug: 'habitacion-individual',
        name: 'Habitación individual',
        type: 'INDIVIDUAL',
        status: 'INACTIVE',
        description: 'Para una persona.',
        capacity: 1,
        beds: null,
        basePrice: null,
        priceUnit: 'PER_NIGHT',
        sortOrder: 0,
      },
      {
        slug: 'habitacion-pareja',
        name: 'Habitación de pareja',
        type: 'COUPLE',
        status: 'PUBLISHED',
        description: 'Cama doble y vista a la calle.',
        capacity: 2,
        beds: [{ type: 'DOUBLE', count: 1 }],
        basePrice: 120000,
        priceUnit: 'PER_NIGHT',
        sortOrder: 1,
      },
    ]);
  });

  it('keeps every room with its id, name, status and order, linked to its type', async () => {
    const rooms = await rows<Record<string, unknown>>(`
      SELECT r.id, r.name, r.status::text, r."sortOrder", t.slug AS type FROM "Room" r
      JOIN "RoomType" t ON t.id = r."roomTypeId" ORDER BY r."sortOrder"`);
    expect(rooms).toEqual([
      {
        id: id('c1'),
        name: 'Habitación 101',
        status: 'PUBLISHED',
        sortOrder: 0,
        type: 'habitacion-pareja',
      },
      {
        id: id('c2'),
        name: 'Habitación 102',
        status: 'DRAFT',
        sortOrder: 1,
        type: 'habitacion-pareja',
      },
      {
        id: id('c3'),
        name: 'Habitación 201',
        status: 'INACTIVE',
        sortOrder: 2,
        type: 'habitacion-individual',
      },
    ]);
    const columns = await rows<{ column_name: string }>(`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'Room' ORDER BY column_name`);
    expect(columns.map((c) => c.column_name)).toEqual([
      'createdAt',
      'id',
      'name',
      'roomTypeId',
      'sortOrder',
      'status',
      'updatedAt',
    ]);
  });

  it('moves the photos onto the type without duplicates, cover first', async () => {
    const images = await rows<Record<string, unknown>>(`
      SELECT t.slug, i."mediaAssetId", i."sortOrder", i."isCover" FROM "RoomTypeImage" i
      JOIN "RoomType" t ON t.id = i."roomTypeId" ORDER BY t.slug, i."sortOrder"`);
    expect(images).toEqual([
      { slug: 'habitacion-pareja', mediaAssetId: id('f1'), sortOrder: 0, isCover: true },
      { slug: 'habitacion-pareja', mediaAssetId: id('f2'), sortOrder: 1, isCover: false },
    ]);
  });

  it('moves the room amenity links onto the type', async () => {
    const links = await rows<{ slug: string; name: string }>(`
      SELECT t.slug, a.name FROM "RoomTypeAmenity" l JOIN "RoomType" t ON t.id = l."roomTypeId"
      JOIN "Amenity" a ON a.id = l."amenityId" ORDER BY t.slug, a.name`);
    expect(links).toEqual([
      { slug: 'habitacion-pareja', name: 'Baño privado' },
      { slug: 'habitacion-pareja', name: 'Televisor' },
    ]);
  });

  it('keeps the old room URLs as redirects to the type page', async () => {
    const redirects = await rows<{ oldSlug: string; slug: string }>(`
      SELECT r."oldSlug", t.slug FROM "RoomTypeSlugRedirect" r
      JOIN "RoomType" t ON t.id = r."roomTypeId" ORDER BY r."oldSlug"`);
    // "habitacion-individual" is now the type URL itself, so it needs no redirect.
    expect(redirects).toEqual([
      { oldSlug: 'habitacion-101', slug: 'habitacion-pareja' },
      { oldSlug: 'habitacion-102', slug: 'habitacion-pareja' },
      { oldSlug: 'suite-101', slug: 'habitacion-pareja' },
    ]);
  });

  it('turns the hotel hero and the HERO section media into hero slides', async () => {
    const slides = await rows<Record<string, unknown>>(
      `SELECT "mediaAssetId", active, "sortOrder" FROM "HeroSlide" ORDER BY "sortOrder"`,
    );
    // The section media has no alt text, so its slide starts inactive.
    expect(slides).toEqual([
      { mediaAssetId: id('f3'), active: true, sortOrder: 0 },
      { mediaAssetId: id('f4'), active: false, sortOrder: 1 },
    ]);
    const hotel = await rows<{ column_name: string }>(`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'HotelProfile'
      AND column_name IN ('heroMediaId', 'heroVideoMediaId', 'tagline', 'country', 'whatsappGreeting')
      ORDER BY column_name`);
    expect(hotel.map((c) => c.column_name)).toEqual(['country', 'tagline', 'whatsappGreeting']);
    const [media] = await rows<{ count: number }>(
      `SELECT count(*)::int AS count FROM "MediaAsset"`,
    );
    expect(media?.count).toBe(5);
  });

  it('moves the ABOUT body into the hotel description and strips section copy', async () => {
    const [hotel] = await rows<{ description: string | null }>(
      `SELECT description FROM "HotelProfile"`,
    );
    expect(hotel?.description).toBe('Texto sobre nosotros.');
    const columns = await rows<{ column_name: string }>(`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'LandingSection'
      ORDER BY column_name`);
    expect(columns.map((c) => c.column_name)).toEqual([
      'createdAt',
      'enabled',
      'id',
      'key',
      'sortOrder',
      'updatedAt',
    ]);
  });

  it('drops promotions, templates and the old room tables and enums', async () => {
    const [tables] = await rows<Record<string, boolean>>(`
      SELECT to_regclass('public."Promotion"') IS NULL AS promotion,
        to_regclass('public."WhatsAppTemplate"') IS NULL AS templates,
        to_regclass('public."RoomImage"') IS NULL AS images,
        to_regclass('public."RoomAmenity"') IS NULL AS amenities,
        to_regclass('public."RoomSlugRedirect"') IS NULL AS redirects,
        to_regclass('public."NearbyPlace"') IS NOT NULL AS nearby`);
    expect(tables).toEqual({
      promotion: true,
      templates: true,
      images: true,
      amenities: true,
      redirects: true,
      nearby: true,
    });
    const enums = await rows<{ typname: string }>(`
      SELECT typname FROM pg_type WHERE typtype = 'e'
      AND typname IN ('RoomType', 'RoomKind', 'WhatsAppTemplateKey') ORDER BY typname`);
    expect(enums.map((e) => e.typname)).toEqual(['RoomKind']);
  });

  it('keeps a single ADMIN role and turns editors into admins', async () => {
    const labels = await rows<{ label: string }>(
      `SELECT unnest(enum_range(NULL::"AdminRole"))::text AS label`,
    );
    expect(labels.map((l) => l.label)).toEqual(['ADMIN']);
    const [user] = await rows<{ role: string }>(`SELECT role::text FROM "AdminUser"`);
    expect(user?.role).toBe('ADMIN');
  });

  it('records what was removed in a system audit entry', async () => {
    const audit = await rows<{ entity: string; summary: Record<string, unknown> }>(
      `SELECT entity, summary FROM "AuditLog" WHERE action = 'system.migration' AND entity = 'RoomType'`,
    );
    expect(audit).toHaveLength(1);
    expect(audit[0]?.summary).toMatchObject({
      migration: TARGET,
      roomTypesCreated: 2,
      promotionsRemoved: 1,
      seoFieldsRemoved: 1,
      customTemplates: [{ key: 'ROOM', body: 'Buenas, me interesa {{habitacion}}.' }],
    });
  });
});
