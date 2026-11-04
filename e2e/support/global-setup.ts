import { request } from '@playwright/test';
import { adminApi, BASE_URL } from './api';
import { gradientPng } from './fixture-image';

interface AdminRoom {
  id: string;
  status: string;
}

/**
 * Makes the suite independent of local data: a fresh CI database (base + demo seeds, no hotel
 * photos) has no published room, so one demo room gets a synthetic cover and is published.
 * Local databases that already publish rooms are left untouched.
 */
export default async function globalSetup() {
  const anonymous = await request.newContext({ baseURL: BASE_URL });
  const rooms = await anonymous.get('/api/v1/public/rooms');
  if (!rooms.ok()) throw new Error(`Public API unavailable through ${BASE_URL}: ${rooms.status()}`);
  const published = (await rooms.json()) as unknown[];
  await anonymous.dispose();
  if (published.length > 0) return;

  const api = await adminApi();
  try {
    let [room] = await api.get<AdminRoom[]>('/admin/rooms');
    room ??= await api.send<AdminRoom>('POST', '/admin/rooms', {
      name: 'Habitación de prueba',
      type: 'COUPLE',
      capacity: 2,
      shortDescription: 'Habitación creada por las pruebas end-to-end.',
    });
    const media = await api.upload<{ id: string }>(
      '/admin/media',
      { altText: 'Imagen de prueba con un degradado verde' },
      { name: 'e2e-cover.png', mimeType: 'image/png', buffer: gradientPng() },
    );
    await api.send('PUT', `/admin/rooms/${room.id}/images`, {
      images: [{ mediaAssetId: media.id, isCover: true }],
    });
    if (room.status !== 'PUBLISHED') {
      await api.send('PATCH', `/admin/rooms/${room.id}/status`, { status: 'PUBLISHED' });
    }
  } finally {
    await api.dispose();
  }
}
