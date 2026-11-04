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
  },
  datasource: {
    // `prisma generate` does not need a live URL; migrate/db commands do.
    url: process.env['DATABASE_URL'] ?? '',
  },
});
