import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PERMISSIONS } from '@hotel-bambu/shared';
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest';
import { DEFAULT_ROLES } from '../seeds/base-data.js';

/**
 * Data migration check for `admin_roles` (feature admin-users-roles): a scratch database gets every
 * previous migration plus two admins on the old `AdminRole` enum, then the new migration runs.
 */

const MIGRATIONS = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../prisma/migrations',
);
const SCRATCH_DB = 'hotel_migration_admin_roles_test';
const TARGET = '20261109130000_admin_roles';
const PREVIOUS = readdirSync(MIGRATIONS)
  .filter((name) => /^\d{14}_/.test(name) && name < TARGET)
  .sort();

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

describe.skipIf(!databaseUrl)('migration admin_roles', () => {
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
      INSERT INTO "AdminUser" (id, email, "passwordHash", role, "updatedAt") VALUES
        ('00000000-0000-7000-8000-0000000000f1', 'owner@example.test', 'x', 'ADMIN', now()),
        ('00000000-0000-7000-8000-0000000000f2', 'second@example.test', 'x', 'ADMIN', now());
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

  it('creates the three seeded roles with their stable ids and permissions', async () => {
    const roles = await rows<{
      id: string;
      name: string;
      permissions: string[];
      isSystem: boolean;
    }>(`SELECT id, name, permissions, "isSystem" FROM "Role" ORDER BY id`);
    expect(roles).toEqual(
      DEFAULT_ROLES.map((role) => ({
        id: role.id,
        name: role.name,
        permissions: [...role.permissions],
        isSystem: role.isSystem,
      })),
    );
    expect(roles[0]?.permissions).toEqual([...PERMISSIONS]);
  });

  it('maps every existing admin to Administrador and drops the enum', async () => {
    const users = await rows<{ name: string }>(
      `SELECT r.name FROM "AdminUser" u JOIN "Role" r ON r.id = u."roleId"`,
    );
    expect(users.map((u) => u.name)).toEqual(['Administrador', 'Administrador']);
    const enums = await rows<{ typname: string }>(
      `SELECT typname FROM pg_type WHERE typname = 'AdminRole'`,
    );
    expect(enums).toEqual([]);
  });

  it('keeps a single system role and refuses to delete a role in use', async () => {
    await expect(
      db.query(
        `INSERT INTO "Role" (id, name, "isSystem", "updatedAt") VALUES ('00000000-0000-7000-8000-0000000000e1', 'Otro', true, now())`,
      ),
    ).rejects.toThrow(/unique/i);
    await expect(db.query(`DELETE FROM "Role" WHERE name = 'Administrador'`)).rejects.toThrow(
      /foreign key/i,
    );
  });
});
