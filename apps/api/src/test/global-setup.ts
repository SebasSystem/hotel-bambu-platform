import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import type { TestProject } from 'vitest/node';
import { PrismaClient } from '../generated/prisma/client.js';

/**
 * Integration test database (separate `hotel_test` database on the same server as DATABASE_URL):
 * created if missing and migrated with `prisma migrate deploy` once per run. Without DATABASE_URL
 * (or with an unreachable server) the integration suites are skipped locally and fail in CI.
 */

export const TEST_DATABASE_NAME = 'hotel_test';
const API_ROOT = path.resolve(import.meta.dirname, '../..');

declare module 'vitest' {
  export interface ProvidedContext {
    testDatabaseUrl: string;
  }
}

export default async function setup(project: TestProject): Promise<void> {
  try {
    process.loadEnvFile(path.resolve(API_ROOT, '../../.env'));
  } catch {
    // No .env: rely on the process environment.
  }
  const baseUrl = process.env['DATABASE_URL'];
  const required = process.env['CI'] === 'true';
  if (!baseUrl) {
    if (required) throw new Error('DATABASE_URL is required for integration tests in CI');
    console.warn('[test] DATABASE_URL unset: integration tests skipped');
    project.provide('testDatabaseUrl', '');
    return;
  }

  const testUrl = new URL(baseUrl);
  testUrl.pathname = `/${TEST_DATABASE_NAME}`;

  const admin = new PrismaClient({ adapter: new PrismaPg({ connectionString: baseUrl }) });
  try {
    const rows = await admin.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname = ${TEST_DATABASE_NAME}) AS "exists"`;
    if (!rows[0]?.exists) await admin.$executeRawUnsafe(`CREATE DATABASE "${TEST_DATABASE_NAME}"`);
  } catch (error) {
    if (required) throw error;
    console.warn(`[test] database unreachable, integration tests skipped: ${String(error)}`);
    project.provide('testDatabaseUrl', '');
    return;
  } finally {
    await admin.$disconnect();
  }

  execFileSync(
    process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
    ['exec', 'prisma', 'migrate', 'deploy'],
    {
      cwd: API_ROOT,
      env: { ...process.env, DATABASE_URL: testUrl.toString() },
      stdio: 'pipe',
      shell: process.platform === 'win32',
    },
  );
  project.provide('testDatabaseUrl', testUrl.toString());
}
