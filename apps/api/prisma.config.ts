import path from 'node:path';
import { defineConfig } from 'prisma/config';

// Local dev: load the monorepo root .env if present. CI/production inject real env vars.
try {
  process.loadEnvFile(path.resolve(import.meta.dirname, '../../.env'));
} catch {
  // No .env file: rely on the process environment.
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // `prisma db seed` runs the idempotent base seed (migrate dev no longer seeds automatically).
    seed: 'tsx src/scripts/seed-base.ts',
  },
  datasource: {
    // `prisma generate` does not need a live URL; migrate/db commands do.
    url: process.env['DATABASE_URL'] ?? '',
  },
});
