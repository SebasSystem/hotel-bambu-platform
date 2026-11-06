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
    expect(me.json()).toMatchObject({ user: { email: ADMIN.email }, csrfToken: csrf });
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
    expect(type.amenities).toEqual([{ name: 'Televisor', iconKey: 'tv' }]);
    // An amenity still assigned to room types cannot move to the HOTEL scope.
    const scope = await call('PATCH', `/admin/amenities/${tv.id}`, { body: { scope: 'HOTEL' } });
    expect(scope.statusCode).toBe(409);
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
