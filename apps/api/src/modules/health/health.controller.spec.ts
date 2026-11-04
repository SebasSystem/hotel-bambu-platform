import 'reflect-metadata';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { configureApp } from '../../app.setup.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { HealthController } from './health.controller.js';
import { HealthService } from './health.service.js';

async function createApp(queryRaw: () => Promise<unknown>): Promise<NestFastifyApplication> {
  const moduleRef = await Test.createTestingModule({
    controllers: [HealthController],
    providers: [
      HealthService,
      { provide: PrismaService, useValue: { $queryRaw: vi.fn(queryRaw) } },
    ],
  }).compile();

  const app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
  await configureApp(app);
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  return app;
}

describe('GET /api/v1/health', () => {
  let app: NestFastifyApplication | undefined;

  afterEach(async () => {
    await app?.close();
  });

  it('returns 200 with database up and security headers', async () => {
    app = await createApp(async () => [{ '?column?': 1 }]);

    const res = await app.inject({ method: 'GET', url: '/api/v1/health' });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ status: 'ok', checks: { database: 'up' } });
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('returns 503 without leaking the database error when the database is down', async () => {
    app = await createApp(async () => {
      throw new Error('connect ECONNREFUSED secret-host:5432');
    });

    const res = await app.inject({ method: 'GET', url: '/api/v1/health' });

    expect(res.statusCode).toBe(503);
    expect(res.json()).toMatchObject({ status: 'error', checks: { database: 'down' } });
    expect(res.body).not.toContain('secret-host');
  });

  it('is not served without the /api/v1 prefix', async () => {
    app = await createApp(async () => []);
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(404);
  });
});
