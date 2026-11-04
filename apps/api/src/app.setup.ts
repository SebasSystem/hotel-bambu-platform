import { randomUUID } from 'node:crypto';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { AllExceptionsFilter } from './common/http-exception.filter.js';
import type { Env } from './config/env.js';

export const API_PREFIX = 'api/v1';

export type HttpEnv = Pick<Env, 'TRUST_PROXY' | 'BODY_LIMIT_BYTES' | 'UPLOAD_MAX_BYTES'>;

const DEFAULT_HTTP_ENV: HttpEnv = {
  TRUST_PROXY: false,
  BODY_LIMIT_BYTES: 1_048_576,
  UPLOAD_MAX_BYTES: 15 * 1024 * 1024,
};

/**
 * Fastify instance options: `trustProxy` (real client IP behind Cloudflare / reverse proxy; see
 * docs/configuration.md), JSON body limit, random request ids for log correlation.
 */
export function createFastifyAdapter(env: HttpEnv = DEFAULT_HTTP_ENV): FastifyAdapter {
  return new FastifyAdapter({
    // A hop count becomes a function: trust the N closest proxies.
    trustProxy:
      typeof env.TRUST_PROXY === 'number'
        ? (_address: string, hop: number) => hop < (env.TRUST_PROXY as number)
        : env.TRUST_PROXY,
    bodyLimit: env.BODY_LIMIT_BYTES,
    genReqId: () => randomUUID(),
    requestIdHeader: false,
  });
}

/** Cross-cutting HTTP setup shared by main.ts and tests. */
export async function configureApp(
  app: NestFastifyApplication,
  env: HttpEnv = DEFAULT_HTTP_ENV,
): Promise<void> {
  app.setGlobalPrefix(API_PREFIX);
  await app.register(helmet);
  await app.register(cookie);
  await app.register(multipart, {
    limits: { fileSize: env.UPLOAD_MAX_BYTES, files: 1, fields: 10, fieldSize: 4096, parts: 11 },
  });
  // Private responses must never land in shared caches (requirement 21); public routes override it.
  app
    .getHttpAdapter()
    .getInstance()
    .addHook('onSend', async (_request, reply) => {
      if (!reply.hasHeader('cache-control')) void reply.header('cache-control', 'no-store');
    });
  // CORS stays disabled: the browser only talks to the Next.js origin (requirement 12.4).
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();
}
