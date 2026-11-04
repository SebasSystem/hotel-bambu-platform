import path from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { z } from 'zod';
import { envSchema } from '../../config/env.js';
import { PrismaClient } from '../../generated/prisma/client.js';

/**
 * Shared bootstrap for the operational CLI scripts (db:seed:*, admin:create, media:import).
 * Same env rules as the API: real environment variables win; the monorepo root .env is a local
 * fallback (Node's loadEnvFile never overrides variables that are already set).
 */
export function loadLocalEnv(): void {
  try {
    // src/scripts/lib (tsx) and dist/scripts/lib (node) are both four levels below the repo root.
    process.loadEnvFile(path.resolve(import.meta.dirname, '../../../../.env'));
  } catch {
    // No .env file: rely on the process environment.
  }
}

export function createScriptPrisma(): PrismaClient {
  loadLocalEnv();
  const { DATABASE_URL } = z
    .object({ DATABASE_URL: envSchema.shape.DATABASE_URL })
    .parse(process.env);
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: DATABASE_URL }) });
}

/** Plain stdout logger (scripts are CLIs, not Nest apps). */
export function log(message: string): void {
  process.stdout.write(`${message}\n`);
}

/** Runs a script body, prints a one-line error (no stack, no secrets) and sets the exit code. */
export async function runScript(name: string, body: () => Promise<void>): Promise<void> {
  try {
    await body();
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? `invalid environment: ${error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}`
        : error instanceof Error
          ? error.message
          : String(error);
    console.error(`[${name}] ${message}`);
    process.exitCode = 1;
  }
}
