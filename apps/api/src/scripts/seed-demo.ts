import { assertDemoSeedAllowed } from '../seeds/seed-guards.js';
import { seedDemo } from '../seeds/seed-demo.js';
import { createScriptPrisma, loadLocalEnv, log, runScript } from './lib/script-runtime.js';

// Usage: pnpm --filter @hotel-bambu/api db:seed:demo  (local/staging only; refuses in production)
await runScript('db:seed:demo', async () => {
  loadLocalEnv();
  assertDemoSeedAllowed(process.env); // fail before opening a database connection
  const prisma = createScriptPrisma();
  try {
    const result = await seedDemo(prisma);
    log(`db:seed:demo done: ${JSON.stringify(result)}`);
  } finally {
    await prisma.$disconnect();
  }
});
