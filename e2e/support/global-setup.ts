import { request } from '@playwright/test';
import { adminApi, BASE_URL } from './api';
import { gradientPng } from './fixture-image';

interface AdminRoomType {
  id: string;
  status: string;
  roomCount: number;
}

/**
 * Makes the suite independent of local data: a fresh CI database (base + demo seeds, no hotel
 * photos) has no published room type, so one type gets a synthetic cover, is published and gets a
 * published room (ADR 0016). Local databases that already publish room types are left untouched.
 */
export default async function globalSetup() {
  const anonymous = await request.newContext({ baseURL: BASE_URL });
  const types = await anonymous.get('/api/v1/public/room-types');
  if (!types.ok()) throw new Error(`Public API unavailable through ${BASE_URL}: ${types.status()}`);
  const published = (await types.json()) as unknown[];
  await anonymous.dispose();
  if (published.length > 0) return;

  const api = await adminApi();
  try {
    let [type] = await api.get<AdminRoomType[]>('/admin/room-types');
    type ??= await api.send<AdminRoomType>('POST', '/admin/room-types', {
      name: 'Habitación de prueba',
      type: 'COUPLE',
      capacity: 2,
    });
    const media = await api.upload<{ id: string }>(
      '/admin/media',
      { altText: 'Imagen de prueba con un degradado verde' },
      { name: 'e2e-cover.png', mimeType: 'image/png', buffer: gradientPng() },
    );
    await api.send('PUT', `/admin/room-types/${type.id}/images`, {
      images: [{ mediaAssetId: media.id, isCover: true }],
    });
    if (type.status !== 'PUBLISHED') {
      await api.send('PATCH', `/admin/room-types/${type.id}/status`, { status: 'PUBLISHED' });
    }
    if (type.roomCount === 0) {
      await api.send('POST', '/admin/rooms', {
        name: 'E2E 101',
        roomTypeId: type.id,
        status: 'PUBLISHED',
      });
    }
  } finally {
    await api.dispose();
  }
}
