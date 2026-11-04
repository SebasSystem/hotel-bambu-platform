import 'reflect-metadata';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, inject, it, vi } from 'vitest';
import { AppModule } from '../app.module.js';
import { configureApp, createFastifyAdapter } from '../app.setup.js';
import { createAdminUser } from '../modules/admin-users/create-admin.js';
import { OBJECT_STORAGE } from '../modules/media/media.service.js';
import type { ObjectStorage } from '../modules/media/object-storage.js';
import { RevalidationService } from '../modules/revalidation/revalidation.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { seedBase } from '../seeds/seed-base.js';

/**
 * End-to-end through Fastify inject against the real `hotel_test` PostgreSQL database
 * (src/test/global-setup.ts). Object storage and Next.js revalidation are faked.
 */

const ORIGIN = 'http://localhost:3000';
const ADMIN = { email: 'it-admin@example.test', password: 'integration-pass-2026' };
const VICTIM = { email: 'it-locked@example.test', password: 'integration-lock-2026' };

class MemoryStorage implements ObjectStorage {
  readonly objects = new Map<string, number>();
  async putObject(key: string, body: Uint8Array): Promise<void> {
    this.objects.set(key, body.length);
  }
  async deleteObjects(keys: readonly string[]): Promise<void> {
    for (const key of keys) this.objects.delete(key);
  }
  async listKeys(prefix: string): Promise<string[]> {
    return [...this.objects.keys()].filter((key) => key.startsWith(prefix));
  }
}

function multipart(fields: Record<string, string>, file: Buffer) {
  const boundary = '----hotelbambutest';
  const parts: Buffer[] = [];
  for (const [name, value] of Object.entries(fields)) {
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`,
      ),
    );
  }
  parts.push(
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="photo.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`,
    ),
    file,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  );
  return {
    payload: Buffer.concat(parts),
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}

const databaseUrl = inject('testDatabaseUrl');

describe.skipIf(!databaseUrl)('API integration (hotel_test database)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  const storage = new MemoryStorage();
  const revalidate = vi.fn();
  let cookie = '';
  let csrf = '';

  async function call(
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
    url: string,
    options: {
      body?: unknown;
      auth?: boolean;
      csrf?: boolean;
      headers?: Record<string, string>;
    } = {},
  ) {
    const headers: Record<string, string> = { origin: ORIGIN, ...options.headers };
    if (options.auth !== false && cookie) headers['cookie'] = cookie;
    if (options.csrf !== false && csrf && method !== 'GET') headers['x-csrf-token'] ??= csrf;
    return app.inject({
      method,
      url: `/api/v1${url}`,
      headers,
      ...(options.body !== undefined ? { payload: options.body as object } : {}),
    });
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(OBJECT_STORAGE)
      .useValue(storage)
      .overrideProvider(RevalidationService)
      .useValue({ revalidate, send: vi.fn(async () => true) })
      .compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(createFastifyAdapter());
    await configureApp(app);
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    prisma = app.get(PrismaService);
    const tables = await prisma.$queryRaw<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
    await prisma.$executeRawUnsafe(
      `TRUNCATE ${tables.map((t) => `"${t.tablename}"`).join(', ')} RESTART IDENTITY CASCADE`,
    );
    await seedBase(prisma);
    await createAdminUser(prisma, ADMIN);
    await createAdminUser(prisma, VICTIM);
  });

  afterAll(async () => {
    await app?.close();
  });

  it('serves health and public content without a session', async () => {
    expect((await call('GET', '/health')).statusCode).toBe(200);
    const rooms = await call('GET', '/public/rooms');
    expect(rooms.statusCode).toBe(200);
    expect(rooms.json()).toEqual([]);
    expect(rooms.headers['cache-control']).toContain('public');
    const site = await call('GET', '/public/site');
    expect(site.json().hotel.name).toBe('Hotel Bambú Plaza');
  });

  it('denies admin routes without a session (401) and marks them no-store', async () => {
    const res = await call('GET', '/admin/rooms');
    expect(res.statusCode).toBe(401);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(
      (await call('POST', '/admin/faq', { body: { question: 'q', answer: 'a' } })).statusCode,
    ).toBe(401);
  });

  it('answers the same generic error for unknown email and wrong password', async () => {
    const unknown = await call('POST', '/auth/login', {
      body: { email: 'nobody@example.test', password: 'x' },
    });
    const wrong = await call('POST', '/auth/login', {
      body: { email: ADMIN.email, password: 'wrong-password' },
    });
    expect(unknown.statusCode).toBe(401);
    expect(wrong.statusCode).toBe(401);
    expect(unknown.json().message).toBe(wrong.json().message);
  });

  it('rejects a login posted from a foreign origin', async () => {
    const res = await call('POST', '/auth/login', {
      body: ADMIN,
      headers: { origin: 'https://evil.example' },
    });
    expect(res.statusCode).toBe(403);
  });

  it('logs in with an HttpOnly session cookie and a CSRF token', async () => {
    const res = await call('POST', '/auth/login', {
      body: { ...ADMIN, email: ` ${ADMIN.email.toUpperCase()} ` },
    });
    expect(res.statusCode).toBe(200);
    const setCookie = ([] as string[]).concat(res.headers['set-cookie'] ?? []);
    const session = setCookie.find((c) => c.startsWith('hb_session='));
    expect(session).toMatch(/HttpOnly/i);
    expect(session).toMatch(/SameSite=Lax/i);
    expect(session).toMatch(/Path=\//);
    cookie = session!.split(';')[0]!;
    csrf = res.json().csrfToken;
    expect(csrf).toBeTruthy();

    const me = await call('GET', '/auth/me');
    expect(me.json()).toMatchObject({ user: { email: ADMIN.email }, csrfToken: csrf });
    // The raw token is never stored.
    const token = cookie.split('=')[1]!;
    expect(await prisma.session.count({ where: { tokenHash: token } })).toBe(0);
  });

  it('requires the CSRF token on authenticated writes (403)', async () => {
    const body = { name: 'Habitación Prueba', type: 'COUPLE', capacity: 2 };
    expect((await call('POST', '/admin/rooms', { body, csrf: false })).statusCode).toBe(403);
    expect(
      (await call('POST', '/admin/rooms', { body, headers: { 'x-csrf-token': 'forged' } }))
        .statusCode,
    ).toBe(403);
    expect(
      (await call('POST', '/admin/rooms', { body, headers: { origin: 'https://evil.example' } }))
        .statusCode,
    ).toBe(403);
  });

  it('rejects unexpected properties (400 with details)', async () => {
    const res = await call('POST', '/admin/faq', {
      body: { question: 'q', answer: 'a', admin: true },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().details[0].code).toBe('unrecognized_keys');
  });

  let roomId = '';
  let mediaId = '';

  it('creates a draft room that stays hidden from the public site', async () => {
    const res = await call('POST', '/admin/rooms', {
      body: {
        name: 'Habitación Prueba',
        type: 'COUPLE',
        capacity: 2,
        shortDescription: 'Para dos.',
      },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({ slug: 'habitacion-prueba', status: 'DRAFT' });
    roomId = res.json().id;
    expect((await call('GET', '/public/rooms')).json()).toEqual([]);
    expect((await call('GET', '/public/rooms/habitacion-prueba')).statusCode).toBe(404);
  });

  it('refuses to publish a room without a cover image (422)', async () => {
    const res = await call('PATCH', `/admin/rooms/${roomId}/status`, {
      body: { status: 'PUBLISHED' },
    });
    expect(res.statusCode).toBe(422);
    expect(res.json().details.map((d: { path: string }) => d.path)).toContain('coverImage');
  });

  it('uploads an image through the pipeline (multipart, alt text required)', async () => {
    const jpeg = await sharp({
      create: { width: 700, height: 500, channels: 3, background: '#1d6247' },
    })
      .jpeg()
      .toBuffer();
    const missingAlt = multipart({}, jpeg);
    const bad = await call('POST', '/admin/media', {
      body: missingAlt.payload,
      headers: { 'content-type': missingAlt.contentType },
    });
    expect(bad.statusCode).toBe(400);

    const notImage = multipart(
      { altText: 'x' },
      Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),
    );
    const svg = await call('POST', '/admin/media', {
      body: notImage.payload,
      headers: { 'content-type': notImage.contentType },
    });
    expect(svg.statusCode).toBe(422);

    const form = multipart({ altText: 'Cama doble con lencería blanca' }, jpeg);
    const res = await call('POST', '/admin/media', {
      body: form.payload,
      headers: { 'content-type': form.contentType },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({
      status: 'READY',
      width: 700,
      altText: 'Cama doble con lencería blanca',
    });
    mediaId = res.json().id;
    expect(storage.objects.size).toBeGreaterThan(0);
  });

  it('publishes the room once it has a cover and shows it publicly with variant URLs', async () => {
    revalidate.mockClear();
    const images = await call('PUT', `/admin/rooms/${roomId}/images`, {
      body: { images: [{ mediaAssetId: mediaId, isCover: true }] },
    });
    expect(images.statusCode).toBe(200);
    const publish = await call('PATCH', `/admin/rooms/${roomId}/status`, {
      body: { status: 'PUBLISHED' },
    });
    expect(publish.statusCode).toBe(200);
    expect(revalidate).toHaveBeenCalledWith(
      expect.arrayContaining(['rooms', 'room:habitacion-prueba']),
    );

    const list = (await call('GET', '/public/rooms')).json();
    expect(list).toHaveLength(1);
    expect(list[0].cover.altText).toBe('Cama doble con lencería blanca');
    expect(list[0].cover.variants[0].url).toMatch(/^http:\/\/localhost:9000\/hotel-media\/media\//);
  });

  it('keeps the old URL alive with a redirect after renaming a published room', async () => {
    const res = await call('PATCH', `/admin/rooms/${roomId}`, { body: { slug: 'suite-prueba' } });
    expect(res.statusCode).toBe(200);
    expect((await call('GET', '/public/rooms/habitacion-prueba')).json()).toEqual({
      redirectTo: 'suite-prueba',
    });
    expect((await call('GET', '/public/rooms/suite-prueba')).json()).toMatchObject({
      name: 'Habitación Prueba',
    });
  });

  it('protects in-use media and published rooms from deletion (409)', async () => {
    expect((await call('DELETE', `/admin/media/${mediaId}`)).statusCode).toBe(409);
    expect((await call('DELETE', `/admin/rooms/${roomId}`)).statusCode).toBe(409);
  });

  it('records an audit trail without secrets', async () => {
    const logs = await prisma.auditLog.findMany({ where: { entity: 'Room', entityId: roomId } });
    expect(logs.map((l) => l.action)).toEqual(
      expect.arrayContaining(['room.create', 'room.images', 'room.status', 'room.update']),
    );
    expect(JSON.stringify(logs)).not.toMatch(/password|csrf/i);
  });

  it('counts whitelisted public events and stores consent evidence without IP', async () => {
    const event = await call('POST', '/public/events', {
      auth: false,
      body: { type: 'WHATSAPP_CLICK', source: 'room_detail', entityId: 'suite-prueba' },
    });
    expect(event.statusCode).toBe(204);
    await call('POST', '/public/events', {
      auth: false,
      body: { type: 'WHATSAPP_CLICK', source: 'room_detail', entityId: 'suite-prueba' },
    });
    const counts = await prisma.analyticsDailyCount.findMany();
    expect(counts).toEqual([
      expect.objectContaining({ type: 'WHATSAPP_CLICK', entityId: 'suite-prueba', count: 2 }),
    ]);
    expect(
      (await call('POST', '/public/events', { auth: false, body: { type: 'PURCHASE' } }))
        .statusCode,
    ).toBe(400);

    const consent = await call('POST', '/public/consents', {
      auth: false,
      body: {
        consentId: 'c0ffee00c0ffee00c0ffee00',
        policyVersion: '2026-11',
        categories: { functional: true, analytics: false, marketing: false },
      },
    });
    expect(consent.statusCode).toBe(204);
    expect(await prisma.consentRecord.count()).toBe(1);
  });

  it('logs out and invalidates the session server-side', async () => {
    expect((await call('POST', '/auth/logout')).statusCode).toBe(204);
    expect((await call('GET', '/admin/rooms')).statusCode).toBe(401);
    expect(await prisma.session.count({ where: { adminUser: { email: ADMIN.email } } })).toBe(0);
  });

  it('locks an account after repeated failures, even for the right password', async () => {
    for (let i = 0; i < 5; i += 1) {
      const res = await call('POST', '/auth/login', {
        auth: false,
        body: { email: VICTIM.email, password: 'wrong-password-123' },
      });
      expect(res.statusCode).toBe(401);
    }
    const locked = await call('POST', '/auth/login', { auth: false, body: VICTIM });
    expect(locked.statusCode).toBe(401);
    const user = await prisma.adminUser.findUniqueOrThrow({ where: { email: VICTIM.email } });
    expect(user.lockedUntil?.getTime()).toBeGreaterThan(Date.now());
  });
});
