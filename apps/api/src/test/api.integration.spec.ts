import 'reflect-metadata';
import { PERMISSIONS } from '@hotel-bambu/shared';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { PATH_METADATA } from '@nestjs/common/constants.js';
import { MetadataScanner, ModulesContainer, Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, inject, it, vi } from 'vitest';
import { AppModule } from '../app.module.js';
import { configureApp, createFastifyAdapter } from '../app.setup.js';
import {
  AUTHENTICATED_ONLY_KEY,
  IS_PUBLIC_KEY,
  PERMISSIONS_KEY,
} from '../common/request-context.js';
import { createAdminUser } from '../modules/admin-users/create-admin.js';
import { OBJECT_STORAGE } from '../modules/media/media.service.js';
import type { ObjectStorage } from '../modules/media/object-storage.js';
import { RevalidationService } from '../modules/revalidation/revalidation.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { DEFAULT_ROLES } from '../seeds/base-data.js';
import { DEFAULT_POLICIES } from '../seeds/default-content.js';
import { seedBase } from '../seeds/seed-base.js';

/**
 * End-to-end through Fastify inject against the real `hotel_test` PostgreSQL database
 * (src/test/global-setup.ts). Object storage and Next.js revalidation are faked.
 */

const ORIGIN = 'http://localhost:3000';
const ADMIN = { email: 'it-admin@example.test', password: 'integration-pass-2026' };
const VICTIM = { email: 'it-locked@example.test', password: 'integration-lock-2026' };
const EDITOR = { email: 'it-editor@example.test', password: 'integration-editor-2026' };
const RECEPTION = { email: 'it-reception@example.test', password: 'integration-front-2026' };
const CONTENT_ONLY = { email: 'it-content@example.test', password: 'integration-content-2026' };
const USER_MANAGER = { email: 'it-users@example.test', password: 'integration-users-2026' };

/** Cookie + CSRF token of one signed-in admin (the default jar is the Administrador). */
interface Jar {
  cookie: string;
  csrf: string;
}

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
  const editor: Jar = { cookie: '', csrf: '' };
  const reception: Jar = { cookie: '', csrf: '' };
  const contentOnly: Jar = { cookie: '', csrf: '' };
  const userManager: Jar = { cookie: '', csrf: '' };

  async function call(
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
    url: string,
    options: {
      body?: unknown;
      auth?: boolean;
      csrf?: boolean;
      headers?: Record<string, string>;
      /** Act as another signed-in admin instead of the default Administrador. */
      as?: Jar;
    } = {},
  ) {
    const jar = options.as ?? { cookie, csrf };
    const headers: Record<string, string> = { origin: ORIGIN, ...options.headers };
    if (options.auth !== false && jar.cookie) headers['cookie'] = jar.cookie;
    if (options.csrf !== false && jar.csrf && method !== 'GET')
      headers['x-csrf-token'] ??= jar.csrf;
    return app.inject({
      method,
      url: `/api/v1${url}`,
      headers,
      ...(options.body !== undefined ? { payload: options.body as object } : {}),
    });
  }

  async function signIn(jar: Jar, credentials: { email: string; password: string }) {
    const res = await call('POST', '/auth/login', { auth: false, csrf: false, body: credentials });
    expect(res.statusCode).toBe(200);
    const setCookie = ([] as string[]).concat(res.headers['set-cookie'] ?? []);
    jar.cookie = setCookie.find((c) => c.startsWith('hb_session='))!.split(';')[0]!;
    jar.csrf = res.json().csrfToken;
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
    await createAdminUser(prisma, { ...EDITOR, role: 'Editor de contenido' });
    await createAdminUser(prisma, { ...RECEPTION, role: 'Recepción' });
    const contentRole = await prisma.role.create({
      data: { name: 'Solo contenido', permissions: ['content.view', 'content.manage'] },
    });
    await createAdminUser(prisma, { ...CONTENT_ONLY, roleId: contentRole.id });
  });

  afterAll(async () => {
    await app?.close();
  });

  it('serves health and public content without a session', async () => {
    expect((await call('GET', '/health')).statusCode).toBe(200);
    const types = await call('GET', '/public/room-types');
    expect(types.statusCode).toBe(200);
    expect(types.json()).toEqual([]);
    expect(types.headers['cache-control']).toContain('public');
    const site = await call('GET', '/public/site');
    expect(site.json().hotel.name).toBe('Hotel Bambú Plaza');
  });

  it('serves the approved hotel facts from the base seed, without a WhatsApp number', async () => {
    const site = (await call('GET', '/public/site')).json();
    expect(site.hotel).toMatchObject({
      tagline: 'Hotel Bambú Plaza: descanso, comodidad y confianza en el corazón de Mocoa',
      address: 'Calle 8 # 7-10',
      municipality: 'Mocoa',
      department: 'Putumayo',
      country: 'Colombia',
      latitude: 1.146883,
      longitude: -76.64794,
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=1.146883,-76.647940',
      phone: '+57 310 679 8260',
      rntNumber: '232175',
      whatsappNumber: null,
      whatsappGreeting: null,
    });
    expect(site.hotel.description.split('\n\n')).toHaveLength(2);
    // Single hero and description sources (ADR 0016).
    expect(site.hotel.hero).toBeUndefined();
    expect(site.whatsappTemplates).toBeUndefined();
    expect(site.sections[0]).toEqual({ key: 'HERO', sortOrder: 0 });
  });

  it('serves the default guest policies, FAQ and stay times from the base seed, without a child-protection notice', async () => {
    const policies = (await call('GET', '/public/policies')).json() as { title: string }[];
    expect(policies.map((p) => p.title)).toEqual(DEFAULT_POLICIES.map((p) => p.title));
    const faqs = (await call('GET', '/public/faq')).json() as { question: string }[];
    expect(faqs).toHaveLength(8);
    expect(faqs[0]!.question).toBe('¿A qué hora es el check-in y el check-out?');
    const { hotel } = (await call('GET', '/public/site')).json();
    // Owner decision 2026-11-09: the notice is posted at reception, not on the website.
    expect(Object.keys(hotel).some((key) => /notice/i.test(key))).toBe(false);
    expect(hotel).toMatchObject({ checkInTime: '15:00', checkOutTime: '12:00' });
  });

  it('re-runs the base seed without overwriting edits and removes leftover [DEMO] rows', async () => {
    const firstPolicy = await prisma.hotelPolicy.findFirstOrThrow({
      orderBy: { sortOrder: 'asc' },
    });
    await prisma.hotelPolicy.update({
      where: { id: firstPolicy.id },
      data: { content: 'Texto editado por el hotel.' },
    });
    await prisma.hotelProfile.update({
      where: { id: 1 },
      data: { checkInTime: '14:00' },
    });
    await prisma.hotelPolicy.create({
      data: { title: '[DEMO] Mascotas', content: 'x', published: true },
    });
    await prisma.faq.create({
      data: { question: '[DEMO] ¿Hay wifi?', answer: 'x', published: true },
    });

    const result = await seedBase(prisma);
    expect(result).toMatchObject({ policies: 'kept', faqs: 'kept', demoRowsRemoved: 2 });
    expect(await prisma.hotelPolicy.count()).toBe(DEFAULT_POLICIES.length);
    expect(await prisma.faq.count()).toBe(8);
    expect(
      (await prisma.hotelPolicy.findUniqueOrThrow({ where: { id: firstPolicy.id } })).content,
    ).toBe('Texto editado por el hotel.');
    const profile = await prisma.hotelProfile.findUniqueOrThrow({ where: { id: 1 } });
    expect(profile).toMatchObject({ checkInTime: '14:00' });

    // Restore the seeded profile values for the remaining tests.
    await prisma.hotelProfile.update({
      where: { id: 1 },
      data: { checkInTime: '15:00' },
    });
  });

  it('ensures the seeded roles on every run without overwriting edited ordinary roles', async () => {
    const [system, editor, reception] = DEFAULT_ROLES;
    await prisma.role.update({ where: { id: system!.id }, data: { permissions: [] } });
    await prisma.role.update({
      where: { id: editor!.id },
      data: { permissions: ['rooms.view'], description: 'Editado' },
    });
    // A renamed seeded role is kept (matched by its stable id), not duplicated.
    await prisma.role.update({ where: { id: reception!.id }, data: { name: 'Front desk' } });

    const result = await seedBase(prisma);
    // Three seeded roles plus the custom role created in beforeAll.
    expect(result.roles).toBe(4);
    const roles = await prisma.role.findMany({
      where: { id: { in: DEFAULT_ROLES.map((r) => r.id) } },
      orderBy: { id: 'asc' },
    });
    expect(roles.map((r) => [r.name, r.permissions, r.isSystem])).toEqual([
      ['Administrador', [...PERMISSIONS], true],
      ['Editor de contenido', ['rooms.view'], false],
      ['Front desk', ['dashboard.view'], false],
    ]);

    await prisma.role.update({
      where: { id: editor!.id },
      data: { permissions: [...editor!.permissions], description: editor!.description },
    });
    await prisma.role.update({ where: { id: reception!.id }, data: { name: reception!.name } });
  });

  it('answers 404 for the removed promotion, template and per-room endpoints', async () => {
    for (const url of [
      '/public/promotions',
      '/public/rooms',
      '/public/rooms/habitacion-101',
      '/admin/promotions',
      '/admin/whatsapp-templates',
    ]) {
      expect((await call('GET', url, { auth: false })).statusCode, url).toBe(404);
    }
  });

  it('sends locked-down security headers on JSON responses', async () => {
    const res = await call('GET', '/health');
    expect(res.headers['content-security-policy']).toBe(
      "default-src 'none';base-uri 'none';form-action 'none';frame-ancestors 'none'",
    );
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['referrer-policy']).toBe('no-referrer');
    expect(res.headers['x-powered-by']).toBeUndefined();
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
    expect(me.json()).toMatchObject({
      user: {
        email: ADMIN.email,
        role: { id: DEFAULT_ROLES[0]!.id, name: 'Administrador' },
        permissions: [...PERMISSIONS],
      },
      csrfToken: csrf,
    });
    // The raw token is never stored.
    const token = cookie.split('=')[1]!;
    expect(await prisma.session.count({ where: { tokenHash: token } })).toBe(0);
  });

  it('requires the CSRF token on authenticated writes (403)', async () => {
    const body = { name: 'Habitación Prueba', type: 'COUPLE', capacity: 2 };
    expect((await call('POST', '/admin/room-types', { body, csrf: false })).statusCode).toBe(403);
    expect(
      (await call('POST', '/admin/room-types', { body, headers: { 'x-csrf-token': 'forged' } }))
        .statusCode,
    ).toBe(403);
    expect(
      (
        await call('POST', '/admin/room-types', {
          body,
          headers: { origin: 'https://evil.example' },
        })
      ).statusCode,
    ).toBe(403);
  });

  it('rejects unexpected properties (400 with details)', async () => {
    const res = await call('POST', '/admin/faq', {
      body: { question: 'q', answer: 'a', admin: true },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().details[0].code).toBe('unrecognized_keys');
  });

  let typeId = '';
  let mediaId = '';

  it('creates a draft room type that stays hidden from the public site', async () => {
    const res = await call('POST', '/admin/room-types', {
      body: { name: 'Habitación Prueba', type: 'COUPLE', capacity: 2 },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({
      slug: 'habitacion-prueba',
      status: 'DRAFT',
      description: null,
      roomCount: 0,
      publishedRoomCount: 0,
    });
    typeId = res.json().id;
    expect((await call('GET', '/public/room-types')).json()).toEqual([]);
    expect((await call('GET', '/public/room-types/habitacion-prueba')).statusCode).toBe(404);
  });

  it('refuses to publish a room type without a cover image (422)', async () => {
    const res = await call('PATCH', `/admin/room-types/${typeId}/status`, {
      body: { status: 'PUBLISHED' },
    });
    expect(res.statusCode).toBe(422);
    expect(res.json().details.map((d: { path: string }) => d.path)).toEqual(['coverImage']);
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

  it('creates a draft room type with its images in one call (atomic, media validated)', async () => {
    const unknown = await call('POST', '/admin/room-types', {
      body: {
        name: 'Tipo Con Fotos',
        type: 'FAMILY',
        capacity: 4,
        images: [{ mediaAssetId: '00000000-0000-7000-8000-000000000000', isCover: true }],
      },
    });
    expect(unknown.statusCode).toBe(422);
    expect(unknown.json().details[0].path).toBe('images');
    // Nothing was written: the slug is still free.
    expect(await prisma.roomType.count({ where: { slug: 'tipo-con-fotos' } })).toBe(0);

    const twoCovers = await call('POST', '/admin/room-types', {
      body: {
        name: 'Tipo Con Fotos',
        type: 'FAMILY',
        capacity: 4,
        images: [
          { mediaAssetId: mediaId, isCover: true },
          { mediaAssetId: mediaId, isCover: true },
        ],
      },
    });
    expect(twoCovers.statusCode).toBe(400);

    const res = await call('POST', '/admin/room-types', {
      body: {
        name: 'Tipo Con Fotos',
        type: 'FAMILY',
        capacity: 4,
        images: [{ mediaAssetId: mediaId, isCover: true }],
      },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({ slug: 'tipo-con-fotos', status: 'DRAFT' });
    expect(res.json().images).toEqual([
      expect.objectContaining({ mediaAssetId: mediaId, isCover: true }),
    ]);
    expect((await call('DELETE', `/admin/room-types/${res.json().id}`)).statusCode).toBe(204);
  });

  it('publishes the type once it has a cover and shows it publicly with variant URLs', async () => {
    revalidate.mockClear();
    const images = await call('PUT', `/admin/room-types/${typeId}/images`, {
      body: { images: [{ mediaAssetId: mediaId, isCover: true }] },
    });
    expect(images.statusCode).toBe(200);
    const publish = await call('PATCH', `/admin/room-types/${typeId}/status`, {
      body: { status: 'PUBLISHED' },
    });
    expect(publish.statusCode).toBe(200);
    expect(revalidate).toHaveBeenCalledWith(
      expect.arrayContaining(['rooms', 'room:habitacion-prueba']),
    );

    const list = (await call('GET', '/public/room-types')).json();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ slug: 'habitacion-prueba', publishedRoomCount: 0 });
    expect(list[0].cover.altText).toBe('Cama doble con lencería blanca');
    expect(list[0].cover.variants[0].url).toMatch(/^http:\/\/localhost:9000\/hotel-media\/media\//);
    const detail = (await call('GET', '/public/room-types/habitacion-prueba')).json();
    expect(detail.seoTitle).toBeUndefined();
    expect(detail.promotions).toBeUndefined();
  });

  it('includes the 480 px variant for phones and thumbnails (D7)', async () => {
    const [type] = (await call('GET', '/public/room-types')).json();
    const widths = [...new Set(type.cover.variants.map((v: { width: number }) => v.width))];
    // 700 px source: the standard widths below it, then the source width itself.
    expect(widths).toEqual([480, 640, 700]);
  });

  it('lists beds and area in the public room-type list (null until set, then the values)', async () => {
    const [before] = (await call('GET', '/public/room-types')).json();
    expect(before).toMatchObject({ beds: null, areaM2: null });

    const res = await call('PATCH', `/admin/room-types/${typeId}`, {
      body: { beds: [{ type: 'DOUBLE', count: 1 }], areaM2: 18.5 },
    });
    expect(res.statusCode).toBe(200);
    const [after] = (await call('GET', '/public/room-types')).json();
    expect(after).toMatchObject({ beds: [{ type: 'DOUBLE', count: 1 }], areaM2: 18.5 });
    expect(typeof after.areaM2).toBe('number');
  });

  it('keeps the old URL alive with a redirect after renaming a published type', async () => {
    const res = await call('PATCH', `/admin/room-types/${typeId}`, {
      body: { slug: 'suite-prueba' },
    });
    expect(res.statusCode).toBe(200);
    expect((await call('GET', '/public/room-types/habitacion-prueba')).json()).toEqual({
      redirectTo: 'suite-prueba',
    });
    expect((await call('GET', '/public/room-types/suite-prueba')).json()).toMatchObject({
      name: 'Habitación Prueba',
    });
  });

  it('maps a former per-room URL to its type page (migrated redirect)', async () => {
    await prisma.roomTypeSlugRedirect.create({
      data: { oldSlug: 'habitacion-101', roomTypeId: typeId },
    });
    expect((await call('GET', '/public/room-types/habitacion-101')).json()).toEqual({
      redirectTo: 'suite-prueba',
    });
    // The slug stays reserved for that type.
    const taken = await call('POST', '/admin/room-types', {
      body: { name: 'Otra', slug: 'habitacion-101', type: 'TWIN', capacity: 2 },
    });
    expect(taken.statusCode).toBe(409);
  });

  let roomIds: string[] = [];

  it('manages lightweight rooms and counts only the published ones on the type', async () => {
    revalidate.mockClear();
    const first = await call('POST', '/admin/rooms', {
      body: { name: '101', roomTypeId: typeId, status: 'PUBLISHED' },
    });
    expect(first.statusCode).toBe(201);
    expect(first.json()).toMatchObject({
      name: '101',
      status: 'PUBLISHED',
      roomType: { id: typeId, name: 'Habitación Prueba' },
    });
    expect(revalidate).toHaveBeenCalledWith(expect.arrayContaining(['rooms']));
    const second = await call('POST', '/admin/rooms', {
      body: { name: '102', roomTypeId: typeId },
    });
    expect(second.statusCode).toBe(201);
    expect(second.json().status).toBe('DRAFT');
    expect(second.json().sortOrder).toBeGreaterThan(first.json().sortOrder);
    roomIds = [first.json().id, second.json().id];

    const unknownType = await call('POST', '/admin/rooms', {
      body: { name: '103', roomTypeId: '00000000-0000-7000-8000-000000000000' },
    });
    expect(unknownType.statusCode).toBe(422);
    expect(unknownType.json().details[0].path).toBe('roomTypeId');

    const count = async () =>
      (await call('GET', '/public/room-types')).json()[0].publishedRoomCount as number;
    expect(await count()).toBe(1);
    expect(
      (await call('PATCH', `/admin/rooms/${roomIds[1]}`, { body: { status: 'PUBLISHED' } }))
        .statusCode,
    ).toBe(200);
    expect(await count()).toBe(2);
    expect(
      (await call('PATCH', `/admin/rooms/${roomIds[0]}`, { body: { status: 'INACTIVE' } }))
        .statusCode,
    ).toBe(200);
    expect(await count()).toBe(1);

    const admin = (await call('GET', `/admin/room-types/${typeId}`)).json();
    expect(admin).toMatchObject({ roomCount: 2, publishedRoomCount: 1 });
    const order = await call('PUT', '/admin/rooms/order', {
      body: { ids: [...roomIds].reverse() },
    });
    expect(order.json().map((r: { name: string }) => r.name)).toEqual(['102', '101']);
  });

  it('protects in-use media, published types and types with rooms from deletion (409)', async () => {
    expect((await call('DELETE', `/admin/media/${mediaId}`)).statusCode).toBe(409);
    expect((await call('DELETE', `/admin/room-types/${typeId}`)).statusCode).toBe(409);
    await call('PATCH', `/admin/room-types/${typeId}/status`, { body: { status: 'DRAFT' } });
    expect((await call('DELETE', `/admin/room-types/${typeId}`)).statusCode).toBe(409);
    expect((await call('GET', '/public/room-types')).json()).toEqual([]);
    await call('PATCH', `/admin/room-types/${typeId}/status`, { body: { status: 'PUBLISHED' } });
    expect((await call('DELETE', `/admin/rooms/${roomIds[0]}`)).statusCode).toBe(204);
    expect((await call('GET', '/admin/rooms')).json()).toHaveLength(1);
  });

  it('manages nearby places and lists only the active ones publicly', async () => {
    revalidate.mockClear();
    const park = await call('POST', '/admin/nearby-places', {
      body: { name: 'Parque principal', distanceText: '300 m', travelTimeText: '4 min a pie' },
    });
    expect(park.statusCode).toBe(201);
    expect(revalidate).toHaveBeenCalledWith(['nearby']);
    const terminal = await call('POST', '/admin/nearby-places', {
      body: { name: 'Terminal de transporte', category: 'Transporte', distanceText: '' },
    });
    expect(terminal.statusCode).toBe(201);
    expect(terminal.json()).toMatchObject({ distanceText: null, active: true });
    expect(
      (await call('POST', '/admin/nearby-places', { body: { distanceText: '1 km' } })).statusCode,
    ).toBe(400);

    const order = await call('PUT', '/admin/nearby-places/order', {
      body: { ids: [terminal.json().id, park.json().id] },
    });
    expect(order.statusCode).toBe(200);
    await call('PATCH', `/admin/nearby-places/${park.json().id}`, { body: { active: false } });
    const list = await call('GET', '/public/nearby-places', { auth: false });
    expect(list.headers['cache-control']).toContain('public');
    expect(list.json()).toEqual([
      {
        id: terminal.json().id,
        name: 'Terminal de transporte',
        category: 'Transporte',
        distanceText: null,
        travelTimeText: null,
      },
    ]);
    expect((await call('DELETE', `/admin/nearby-places/${terminal.json().id}`)).statusCode).toBe(
      204,
    );
    expect((await call('GET', '/admin/nearby-places')).json()).toHaveLength(1);
  });

  it('has no hotel services module any more (ADR 0015)', async () => {
    expect((await call('GET', '/admin/services')).statusCode).toBe(404);
    expect((await call('GET', '/public/services')).statusCode).toBe(404);
  });

  it('serves HOTEL amenities and ROOM amenities apart, without a room-level Wi-Fi', async () => {
    const site = (await call('GET', '/public/site')).json();
    expect(site.highlightedServices).toBeUndefined();
    expect(site.hotelAmenities.map((a: { name: string }) => a.name)).toEqual([
      'Wi-Fi en todo el hotel',
      'Paneles solares',
      'Reserva de agua',
    ]);
    expect(site.homeAmenities.map((a: { name: string }) => a.name)).toEqual([
      'Baño privado',
      'Televisor',
      'Ventilador',
    ]);
    const all = (await call('GET', '/public/amenities')).json();
    expect(all.find((a: { name: string }) => a.name === 'Wi-Fi')).toBeUndefined();
    expect(all.find((a: { name: string }) => a.name === 'Paneles solares').scope).toBe('HOTEL');
  });

  it('assigns only ROOM amenities to room types (422 for a HOTEL amenity)', async () => {
    const amenities = (await call('GET', '/admin/amenities')).json() as {
      id: string;
      name: string;
      scope: string;
    }[];
    const wifi = amenities.find((a) => a.scope === 'HOTEL')!;
    const tv = amenities.find((a) => a.name === 'Televisor')!;
    const bad = await call('PATCH', `/admin/room-types/${typeId}`, {
      body: { amenityIds: [wifi.id] },
    });
    expect(bad.statusCode).toBe(422);
    expect(bad.json().details[0].path).toBe('amenityIds');
    const ok = await call('PATCH', `/admin/room-types/${typeId}`, {
      body: { amenityIds: [tv.id] },
    });
    expect(ok.statusCode).toBe(200);
    const type = (await call('GET', '/public/room-types/suite-prueba')).json();
    expect(type.amenities).toEqual([{ name: 'Televisor', iconKey: 'tv', availability: 'ALL' }]);
    // An amenity still assigned to room types cannot move to the HOTEL scope.
    const scope = await call('PATCH', `/admin/amenities/${tv.id}`, { body: { scope: 'HOTEL' } });
    expect(scope.statusCode).toBe(409);
  });

  it('overrides amenities per room and shows partial ones as available in some rooms', async () => {
    const amenities = (await call('GET', '/admin/amenities')).json() as {
      id: string;
      name: string;
      scope: string;
    }[];
    const tv = amenities.find((a) => a.name === 'Televisor')!;
    const fan = amenities.find((a) => a.name === 'Ventilador')!;
    const bathroom = amenities.find((a) => a.name === 'Baño privado')!;
    const wifi = amenities.find((a) => a.scope === 'HOTEL')!;
    const publicAmenities = async () =>
      (await call('GET', '/public/room-types/suite-prueba')).json().amenities as unknown[];

    // Two published rooms of the type (102 is left from the rooms test).
    const second = await call('POST', '/admin/rooms', {
      body: { name: '103', roomTypeId: typeId, status: 'PUBLISHED' },
    });
    expect(second.statusCode).toBe(201);
    expect(second.json().amenityOverrides).toEqual([]);
    const rooms = (await call('GET', '/admin/rooms')).json() as { id: string; name: string }[];
    const room102 = rooms.find((r) => r.name === '102')!;

    // HOTEL amenities cannot be overridden per room.
    const bad = await call('PATCH', `/admin/rooms/${room102.id}`, {
      body: { amenityOverrides: [{ amenityId: wifi.id, available: true }] },
    });
    expect(bad.statusCode).toBe(422);
    expect(bad.json().details[0].path).toBe('amenityOverrides');

    revalidate.mockClear();
    const changed = await call('PATCH', `/admin/rooms/${room102.id}`, {
      body: {
        amenityOverrides: [
          { amenityId: tv.id, available: false },
          { amenityId: fan.id, available: true },
          // Redundant (the type has no private bathroom either): not stored.
          { amenityId: bathroom.id, available: false },
        ],
      },
    });
    expect(changed.statusCode).toBe(200);
    expect(changed.json().amenityOverrides).toHaveLength(2);
    expect(changed.json().amenityOverrides).toEqual(
      expect.arrayContaining([
        { amenityId: tv.id, available: false },
        { amenityId: fan.id, available: true },
      ]),
    );
    expect(revalidate).toHaveBeenCalledWith(expect.arrayContaining(['rooms']));
    const audit = await prisma.auditLog.findFirst({
      where: { action: 'room.update', entityId: room102.id },
      orderBy: { createdAt: 'desc' },
    });
    expect(audit?.summary).toMatchObject({ fields: ['amenityOverrides'] });

    // TV in one of two rooms, fan only in one: both "in some rooms".
    expect(await publicAmenities()).toEqual([
      { name: 'Televisor', iconKey: 'tv', availability: 'SOME' },
      { name: 'Ventilador', iconKey: 'fan', availability: 'SOME' },
    ]);
    const [summary] = (await call('GET', '/public/room-types')).json();
    expect(summary.amenities).toEqual(await publicAmenities());

    // The other room drops the TV too: hidden. Unpublished rooms do not count.
    await call('PATCH', `/admin/rooms/${second.json().id}`, {
      body: { amenityOverrides: [{ amenityId: tv.id, available: false }] },
    });
    expect(await publicAmenities()).toEqual([
      { name: 'Ventilador', iconKey: 'fan', availability: 'SOME' },
    ]);
    await call('PATCH', `/admin/rooms/${second.json().id}`, { body: { status: 'DRAFT' } });
    expect(await publicAmenities()).toEqual([
      { name: 'Ventilador', iconKey: 'fan', availability: 'ALL' },
    ]);

    // Clearing the overrides restores the inherited amenities; deleting a room removes its rows.
    await call('PATCH', `/admin/rooms/${room102.id}`, { body: { amenityOverrides: [] } });
    expect(await publicAmenities()).toEqual([
      { name: 'Televisor', iconKey: 'tv', availability: 'ALL' },
    ]);
    expect((await call('DELETE', `/admin/rooms/${second.json().id}`)).statusCode).toBe(204);
    expect(await prisma.roomAmenityOverride.count({ where: { roomId: second.json().id } })).toBe(0);
  });

  it('manages ordered hero slides and exposes the active ones publicly', async () => {
    const png = await sharp({
      create: { width: 1600, height: 900, channels: 3, background: '#183b2c' },
    })
      .jpeg()
      .toBuffer();
    const form = multipart({ altText: 'Fachada del hotel' }, png);
    const upload = await call('POST', '/admin/media', {
      body: form.payload,
      headers: { 'content-type': form.contentType },
    });
    expect(upload.statusCode).toBe(201);
    const heroMediaId = upload.json().id as string;

    revalidate.mockClear();
    const first = await call('POST', '/admin/hero-slides', {
      body: { mediaAssetId: heroMediaId, caption: 'Llegada al hotel' },
    });
    expect(first.statusCode).toBe(201);
    expect(revalidate).toHaveBeenCalledWith(expect.arrayContaining(['site']));
    const second = await call('POST', '/admin/hero-slides', {
      body: { mediaAssetId: mediaId, altText: 'Habitación doble con luz natural' },
    });
    expect(second.statusCode).toBe(201);
    expect(second.json().sortOrder).toBeGreaterThan(first.json().sortOrder);
    // One slide per photo.
    expect(
      (await call('POST', '/admin/hero-slides', { body: { mediaAssetId: heroMediaId } }))
        .statusCode,
    ).toBe(409);

    let site = (await call('GET', '/public/site')).json();
    expect(site.heroSlides).toEqual([
      {
        id: first.json().id,
        caption: 'Llegada al hotel',
        media: expect.objectContaining({ id: heroMediaId, altText: 'Fachada del hotel' }),
      },
      {
        id: second.json().id,
        caption: null,
        media: expect.objectContaining({
          id: mediaId,
          altText: 'Habitación doble con luz natural',
        }),
      },
    ]);

    const order = await call('PUT', '/admin/hero-slides/order', {
      body: { ids: [second.json().id, first.json().id] },
    });
    expect(order.statusCode).toBe(200);
    expect(order.json().map((s: { id: string }) => s.id)).toEqual([
      second.json().id,
      first.json().id,
    ]);

    const hide = await call('PATCH', `/admin/hero-slides/${second.json().id}`, {
      body: { active: false },
    });
    expect(hide.statusCode).toBe(200);
    site = (await call('GET', '/public/site')).json();
    expect(site.heroSlides.map((s: { id: string }) => s.id)).toEqual([first.json().id]);

    // Media used by a slide cannot be deleted; deleting the slide frees it.
    expect((await call('DELETE', `/admin/media/${heroMediaId}`)).statusCode).toBe(409);
    expect((await call('DELETE', `/admin/hero-slides/${first.json().id}`)).statusCode).toBe(204);
    expect((await call('DELETE', `/admin/media/${heroMediaId}`)).statusCode).toBe(204);
    expect((await call('GET', '/admin/hero-slides')).json()).toHaveLength(1);
  });

  it('records an audit trail without secrets', async () => {
    const logs = await prisma.auditLog.findMany({
      where: { entity: 'RoomType', entityId: typeId },
    });
    expect(logs.map((l) => l.action)).toEqual(
      expect.arrayContaining([
        'roomType.create',
        'roomType.images',
        'roomType.status',
        'roomType.update',
      ]),
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

  it('declares a permission (or public/authenticated-only access) on every route', () => {
    const reflector = app.get(Reflector);
    const scanner = new MetadataScanner();
    const uncovered: string[] = [];
    let routes = 0;
    for (const moduleRef of app.get(ModulesContainer).values()) {
      for (const wrapper of moduleRef.controllers.values()) {
        const controller = wrapper.metatype as (new (...args: never[]) => object) | null;
        if (!controller) continue;
        for (const name of scanner.getAllMethodNames(controller.prototype)) {
          const handler = (controller.prototype as Record<string, unknown>)[name] as object;
          if (Reflect.getMetadata(PATH_METADATA, handler) === undefined) continue;
          routes += 1;
          const targets = [handler, controller] as never[];
          const covered =
            reflector.getAllAndOverride(IS_PUBLIC_KEY, targets) ||
            reflector.getAllAndOverride(AUTHENTICATED_ONLY_KEY, targets) ||
            (reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, targets)?.length ?? 0) > 0;
          if (!covered) uncovered.push(`${controller.name}.${name}`);
        }
      }
    }
    expect(routes).toBeGreaterThan(50);
    expect(uncovered).toEqual([]);
  });

  it('enforces role permissions on admin routes (403 with the error shape)', async () => {
    await signIn(editor, EDITOR);
    await signIn(reception, RECEPTION);
    await signIn(contentOnly, CONTENT_ONLY);

    // Editor de contenido: hotel, rooms, content and media; no activity.
    expect((await call('GET', '/admin/rooms', { as: editor })).statusCode).toBe(200);
    expect((await call('GET', '/admin/dashboard', { as: editor })).statusCode).toBe(200);
    const denied = await call('GET', '/admin/audit-logs', { as: editor });
    expect(denied.statusCode).toBe(403);
    expect(denied.json()).toMatchObject({
      statusCode: 403,
      error: 'Forbidden',
      message: 'You do not have permission to perform this action.',
      code: 'PERMISSION_DENIED',
    });
    expect((await call('GET', '/admin/analytics/summary', { as: editor })).statusCode).toBe(403);
    const created = await call('POST', '/admin/faq', {
      as: editor,
      body: { question: '¿Pregunta del editor?', answer: 'Sí.' },
    });
    expect(created.statusCode).toBe(201);
    const removed = await call('DELETE', `/admin/faq/${created.json().id}`, { as: editor });
    expect(removed.statusCode).toBe(204);

    // Recepción: dashboard only; account routes stay available.
    expect((await call('GET', '/admin/dashboard', { as: reception })).statusCode).toBe(200);
    expect((await call('GET', '/admin/rooms', { as: reception })).statusCode).toBe(403);
    const write = await call('POST', '/admin/room-types', {
      as: reception,
      body: { name: 'Intento', type: 'COUPLE', capacity: 2 },
    });
    expect(write.statusCode).toBe(403);
    expect((await call('GET', '/admin/media', { as: reception })).statusCode).toBe(403);
    const me = await call('GET', '/auth/me', { as: reception });
    expect(me.json().user).toMatchObject({
      role: { name: 'Recepción' },
      permissions: ['dashboard.view'],
    });
  });

  it('lets content, hotel and room managers use the media picker without media.manage', async () => {
    const list = await call('GET', '/admin/media', { as: contentOnly });
    expect(list.statusCode).toBe(200);
    const [first] = list.json().items as { id: string }[];
    const one = await call('GET', `/admin/media/${first!.id}`, { as: contentOnly });
    expect(one.statusCode).toBe(200);
    const jpeg = await sharp({
      create: { width: 640, height: 480, channels: 3, background: '#2b5d8a' },
    })
      .jpeg()
      .toBuffer();
    const form = multipart({ altText: 'Foto subida desde el selector' }, jpeg);
    const upload = await call('POST', '/admin/media', {
      as: contentOnly,
      body: form.payload,
      headers: { 'content-type': form.contentType },
    });
    expect(upload.statusCode).toBe(201);
    const uploadedId = upload.json().id as string;
    // Editing and deleting library items still need media.manage.
    const edit = await call('PATCH', `/admin/media/${uploadedId}`, {
      as: contentOnly,
      body: { altText: 'Otro texto' },
    });
    expect(edit.statusCode).toBe(403);
    const remove = await call('DELETE', `/admin/media/${uploadedId}`, { as: contentOnly });
    expect(remove.statusCode).toBe(403);
    expect((await call('DELETE', `/admin/media/${uploadedId}`)).statusCode).toBe(204);
  });

  it('keeps users and roles management to roles with the users permissions', async () => {
    for (const url of ['/admin/users', '/admin/roles']) {
      expect((await call('GET', url, { as: editor })).statusCode, url).toBe(403);
      expect((await call('GET', url, { as: reception })).statusCode, url).toBe(403);
    }
    const create = await call('POST', '/admin/users', {
      as: editor,
      body: {
        email: 'nope@example.test',
        roleId: DEFAULT_ROLES[0]!.id,
        password: 'a long enough passphrase',
      },
    });
    expect(create.statusCode).toBe(403);
  });

  let cashierRoleId = '';

  it('lists roles with user counts and manages custom roles', async () => {
    const list = await call('GET', '/admin/roles');
    expect(list.statusCode).toBe(200);
    const roles = list.json() as { name: string; isSystem: boolean; userCount: number }[];
    expect(roles[0]).toMatchObject({ name: 'Administrador', isSystem: true, userCount: 2 });
    expect(roles.find((r) => r.name === 'Recepción')).toMatchObject({ userCount: 1 });

    const created = await call('POST', '/admin/roles', {
      body: { name: 'Caja', description: 'Cobros', permissions: ['media.manage'] },
    });
    expect(created.statusCode).toBe(201);
    expect(created.json()).toMatchObject({
      name: 'Caja',
      permissions: ['media.view', 'media.manage'],
      isSystem: false,
      userCount: 0,
    });
    cashierRoleId = created.json().id;

    const duplicate = await call('POST', '/admin/roles', {
      body: { name: 'Caja', permissions: [] },
    });
    expect(duplicate.statusCode).toBe(409);
    expect(duplicate.json().code).toBe('ROLE_NAME_TAKEN');
    const unknownPermission = await call('POST', '/admin/roles', {
      body: { name: 'Raro', permissions: ['root.manage'] },
    });
    expect(unknownPermission.statusCode).toBe(400);

    const edited = await call('PATCH', `/admin/roles/${cashierRoleId}`, {
      body: { permissions: ['dashboard.view', 'media.view'] },
    });
    expect(edited.statusCode).toBe(200);
    expect(edited.json().permissions).toEqual(['dashboard.view', 'media.view']);

    const systemId = DEFAULT_ROLES[0]!.id;
    const editSystem = await call('PATCH', `/admin/roles/${systemId}`, {
      body: { permissions: [] },
    });
    expect(editSystem.statusCode).toBe(422);
    expect(editSystem.json()).toMatchObject({
      code: 'SYSTEM_ROLE_IMMUTABLE',
      message: 'The Administrador role cannot be changed or deleted.',
    });
    expect((await call('DELETE', `/admin/roles/${systemId}`)).statusCode).toBe(422);

    const inUse = await call('DELETE', `/admin/roles/${DEFAULT_ROLES[2]!.id}`);
    expect(inUse.statusCode).toBe(409);
    expect(inUse.json().code).toBe('ROLE_IN_USE');
  });

  it('creates admin users with a role and the password policy', async () => {
    const weak = await call('POST', '/admin/users', {
      body: { email: 'ana@example.test', roleId: cashierRoleId, password: 'ana@example.test-x' },
    });
    expect(weak.statusCode).toBe(422);
    const unknownRole = await call('POST', '/admin/users', {
      body: {
        email: 'ana@example.test',
        roleId: '00000000-0000-7000-8000-0000000000aa',
        password: 'cuenta de caja segura',
      },
    });
    expect(unknownRole.statusCode).toBe(422);
    expect(unknownRole.json().code).toBe('ROLE_NOT_FOUND');
    const taken = await call('POST', '/admin/users', {
      body: { email: ADMIN.email, roleId: cashierRoleId, password: 'cuenta de caja segura' },
    });
    expect(taken.statusCode).toBe(409);
    expect(taken.json().code).toBe('EMAIL_TAKEN');

    const created = await call('POST', '/admin/users', {
      body: {
        email: ' Ana@Example.test ',
        name: 'Ana',
        roleId: cashierRoleId,
        password: 'cuenta de caja segura',
      },
    });
    expect(created.statusCode).toBe(201);
    expect(created.json()).toMatchObject({
      email: 'ana@example.test',
      name: 'Ana',
      role: { id: cashierRoleId, name: 'Caja', isSystem: false },
      active: true,
      lastLoginAt: null,
    });
    expect(JSON.stringify(created.json())).not.toMatch(/password|hash/i);

    const users = (await call('GET', '/admin/users')).json() as { email: string }[];
    expect(users.map((u) => u.email)).toContain('ana@example.test');
    const login = await call('POST', '/auth/login', {
      auth: false,
      csrf: false,
      body: { email: 'ana@example.test', password: 'cuenta de caja segura' },
    });
    expect(login.statusCode).toBe(200);
    expect(login.json().user.permissions).toEqual(['dashboard.view', 'media.view']);
  });

  it('refuses to change its own role or deactivate itself', async () => {
    const self = await prisma.adminUser.findUniqueOrThrow({ where: { email: ADMIN.email } });
    const demote = await call('PATCH', `/admin/users/${self.id}`, {
      body: { roleId: DEFAULT_ROLES[1]!.id },
    });
    expect(demote.statusCode).toBe(422);
    expect(demote.json()).toMatchObject({
      code: 'SELF_ROLE_CHANGE',
      message: 'You cannot change your own role.',
    });
    const deactivate = await call('PATCH', `/admin/users/${self.id}`, { body: { active: false } });
    expect(deactivate.statusCode).toBe(422);
    expect(deactivate.json().code).toBe('SELF_DEACTIVATION');
    const rename = await call('PATCH', `/admin/users/${self.id}`, {
      body: { name: 'Admin Pruebas', roleId: self.roleId },
    });
    expect(rename.statusCode).toBe(200);
    expect(rename.json().name).toBe('Admin Pruebas');
  });

  it('keeps at least one active Administrador', async () => {
    const managerRole = await prisma.role.create({
      data: { name: 'Gestor de usuarios', permissions: ['users.manage'] },
    });
    await createAdminUser(prisma, { ...USER_MANAGER, roleId: managerRole.id });
    await signIn(userManager, USER_MANAGER);

    const owner = await prisma.adminUser.findUniqueOrThrow({ where: { email: ADMIN.email } });
    const second = await prisma.adminUser.findUniqueOrThrow({ where: { email: VICTIM.email } });
    expect(
      (await call('PATCH', `/admin/users/${second.id}`, { body: { active: false } })).statusCode,
    ).toBe(200);

    const lastDeactivate = await call('PATCH', `/admin/users/${owner.id}`, {
      as: userManager,
      body: { active: false },
    });
    expect(lastDeactivate.statusCode).toBe(409);
    expect(lastDeactivate.json()).toMatchObject({
      code: 'LAST_ADMINISTRATOR',
      message: 'At least one active user must keep the Administrador role.',
    });
    const lastDemote = await call('PATCH', `/admin/users/${owner.id}`, {
      as: userManager,
      body: { roleId: managerRole.id },
    });
    expect(lastDemote.statusCode).toBe(409);
    expect((await prisma.adminUser.findUniqueOrThrow({ where: { id: owner.id } })).active).toBe(
      true,
    );

    expect(
      (await call('PATCH', `/admin/users/${second.id}`, { body: { active: true } })).statusCode,
    ).toBe(200);
  });

  it('revokes the sessions of a user on role change, deactivation and password reset', async () => {
    const editorUser = await prisma.adminUser.findUniqueOrThrow({ where: { email: EDITOR.email } });
    expect((await call('GET', '/auth/me', { as: editor })).statusCode).toBe(200);
    const moved = await call('PATCH', `/admin/users/${editorUser.id}`, {
      body: { roleId: DEFAULT_ROLES[2]!.id },
    });
    expect(moved.statusCode).toBe(200);
    expect(moved.json().role.name).toBe('Recepción');
    expect((await call('GET', '/auth/me', { as: editor })).statusCode).toBe(401);

    const frontUser = await prisma.adminUser.findUniqueOrThrow({
      where: { email: RECEPTION.email },
    });
    await prisma.adminUser.update({
      where: { id: frontUser.id },
      data: { failedAttempts: 3, lockedUntil: new Date(Date.now() + 600_000) },
    });
    const reset = await call('POST', `/admin/users/${frontUser.id}/reset-password`, {
      body: { password: 'nueva clave de recepcion' },
    });
    expect(reset.statusCode).toBe(204);
    expect((await call('GET', '/auth/me', { as: reception })).statusCode).toBe(401);
    const relogin = await call('POST', '/auth/login', {
      auth: false,
      csrf: false,
      body: { email: RECEPTION.email, password: 'nueva clave de recepcion' },
    });
    expect(relogin.statusCode).toBe(200);

    const contentUser = await prisma.adminUser.findUniqueOrThrow({
      where: { email: CONTENT_ONLY.email },
    });
    const disabled = await call('PATCH', `/admin/users/${contentUser.id}`, {
      body: { active: false },
    });
    expect(disabled.statusCode).toBe(200);
    expect(disabled.json().active).toBe(false);
    expect((await call('GET', '/auth/me', { as: contentOnly })).statusCode).toBe(401);
    expect(await prisma.session.count({ where: { adminUserId: contentUser.id } })).toBe(0);
  });

  it('applies role permission edits on the next request and audits users and roles', async () => {
    const before = await call('GET', '/admin/rooms', { as: userManager });
    expect(before.statusCode).toBe(403);
    const managerRole = await prisma.role.findUniqueOrThrow({
      where: { name: 'Gestor de usuarios' },
    });
    await call('PATCH', `/admin/roles/${managerRole.id}`, {
      body: { permissions: ['users.manage', 'rooms.view'] },
    });
    expect((await call('GET', '/admin/rooms', { as: userManager })).statusCode).toBe(200);

    expect((await call('DELETE', `/admin/roles/${cashierRoleId}`)).statusCode).toBe(409);
    const ana = await prisma.adminUser.findUniqueOrThrow({ where: { email: 'ana@example.test' } });
    await call('PATCH', `/admin/users/${ana.id}`, { body: { roleId: DEFAULT_ROLES[2]!.id } });
    expect((await call('DELETE', `/admin/roles/${cashierRoleId}`)).statusCode).toBe(204);

    const logs = await prisma.auditLog.findMany({
      where: { entity: { in: ['AdminUser', 'Role'] }, action: { not: { startsWith: 'auth.' } } },
    });
    expect(new Set(logs.map((l) => l.action))).toEqual(
      new Set([
        'adminUser.create',
        'adminUser.update',
        'adminUser.resetPassword',
        'role.create',
        'role.update',
        'role.delete',
      ]),
    );
    expect(JSON.stringify(logs)).not.toMatch(/cuenta de caja segura|nueva clave|passwordHash/);
  });

  it('logs out and invalidates the session server-side', async () => {
    expect((await call('POST', '/auth/logout')).statusCode).toBe(204);
    expect((await call('GET', '/admin/room-types')).statusCode).toBe(401);
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
