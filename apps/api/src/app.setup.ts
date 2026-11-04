import helmet from '@fastify/helmet';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';

export const API_PREFIX = 'api/v1';

/** Cross-cutting HTTP setup shared by main.ts and tests. */
export async function configureApp(app: NestFastifyApplication): Promise<void> {
  app.setGlobalPrefix(API_PREFIX);
  await app.register(helmet);
  app.enableShutdownHooks();
}
