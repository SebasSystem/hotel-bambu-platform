import { seedBase } from '../seeds/seed-base.js';
import { createScriptPrisma, log, runScript } from './lib/script-runtime.js';

// Usage: pnpm --filter @hotel-bambu/api db:seed:base  (idempotent, every environment)
await runScript('db:seed:base', async () => {
  const prisma = createScriptPrisma();
  try {
    const result = await seedBase(prisma);
    log(`db:seed:base done: ${JSON.stringify(result)}`);
  } finally {
    await prisma.$disconnect();
  }
});
