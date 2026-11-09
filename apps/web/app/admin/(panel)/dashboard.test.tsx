// @vitest-environment jsdom
import { PERMISSIONS, hasAnyPermission, type Permission } from '@hotel-bambu/shared';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api/client';
import type { SessionInfo } from '@/lib/api/types';

let permissions: Permission[] = [];
const requested: string[] = [];

/** Same rule as the API: each endpoint needs its permission, otherwise 403 PERMISSION_DENIED. */
const ENDPOINTS: Record<string, { anyOf: Permission[]; body: unknown }> = {
  '/admin/dashboard': {
    anyOf: ['dashboard.view'],
    body: {
      rooms: {},
      roomTypes: {},
      activeHotelAmenities: 0,
      activeNearbyPlaces: 0,
      lastChange: null,
      incomplete: {
        mediaMissingAlt: 2,
        publishedRoomTypesWithoutPrice: 0,
        roomTypesWithoutCover: 0,
      },
      analytics: {
        since: '2026-10-10',
        days: 30,
        totals: [{ type: 'PAGE_VIEW', source: 'x', count: 7 }],
      },
    },
  },
  '/admin/hotel': {
    anyOf: ['hotel.view'],
    body: { whatsappNumber: null, latitude: null, longitude: null },
  },
  '/admin/nearby-places': { anyOf: ['hotel.view'], body: [] },
  '/admin/social-links': { anyOf: ['hotel.view'], body: [] },
  '/admin/room-types': { anyOf: ['rooms.view'], body: [] },
  '/admin/hero-slides': { anyOf: ['content.view'], body: [] },
  '/admin/policies': { anyOf: ['content.view'], body: [] },
  '/admin/faq': { anyOf: ['content.view'], body: [] },
  '/admin/media': {
    anyOf: ['media.view', 'hotel.manage', 'rooms.manage', 'content.manage'],
    body: { items: [], total: 4, page: 1, pageSize: 1 },
  },
  '/admin/audit-logs': {
    anyOf: ['activity.view'],
    body: { items: [], total: 0, page: 1, pageSize: 50 },
  },
};

vi.mock('@/lib/api/server', () => ({
  serverApi: {
    get: (path: string) => {
      requested.push(path);
      const endpoint = ENDPOINTS[path];
      if (!endpoint) throw new Error(`unexpected ${path}`);
      if (!hasAnyPermission(permissions, endpoint.anyOf)) {
        return Promise.reject(new ApiError(403, { code: 'PERMISSION_DENIED' }));
      }
      return Promise.resolve(endpoint.body);
    },
  },
}));

vi.mock('@/lib/admin/session', () => ({
  requirePermission: (): Promise<SessionInfo> =>
    Promise.resolve({
      user: {
        id: 'u1',
        email: 'ana@example.test',
        name: 'Ana Pérez',
        role: { id: 'r1', name: 'Rol' },
        permissions,
      },
      csrfToken: 'csrf',
      expiresAt: '2026-11-10T00:00:00.000Z',
    }),
}));

const { default: DashboardPage } = await import('./page');

async function renderDashboard(granted: readonly Permission[]) {
  permissions = [...granted];
  requested.length = 0;
  render(await DashboardPage());
}

describe('Dashboard with partial permissions', () => {
  afterEach(cleanup);

  it('shows every widget to the administrator', async () => {
    await renderDashboard(PERMISSIONS);
    expect(screen.getByRole('region', { name: 'Antes de publicar' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Actividad reciente' })).toBeTruthy();
    expect(screen.getByRole('region', { name: /Visitas e interés/ })).toBeTruthy();
    expect(screen.getByText('Fotos con texto alternativo')).toBeTruthy();
  });

  it('content editor: readiness for its areas, no activity or metrics, no forbidden fetch', async () => {
    await renderDashboard([
      'dashboard.view',
      'hotel.manage',
      'rooms.manage',
      'content.manage',
      'media.manage',
    ]);
    expect(requested).not.toContain('/admin/audit-logs');
    expect(screen.getByRole('region', { name: 'Antes de publicar' })).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Actividad reciente' })).toBeNull();
    expect(screen.queryByRole('region', { name: /Visitas e interés/ })).toBeNull();
  });

  it('rooms only: checklist and KPIs link only to allowed pages', async () => {
    await renderDashboard(['dashboard.view', 'rooms.view']);
    expect(requested.sort()).toEqual(['/admin/dashboard', '/admin/room-types']);
    const links = screen.getAllByRole('link').map((link) => link.getAttribute('href'));
    expect(links.length).toBeGreaterThan(0);
    expect(links.every((href) => href?.startsWith('/admin/room-types'))).toBe(true);
    expect(screen.queryByText('Perfil del hotel')).toBeNull();
    expect(screen.queryByText('Fotos con texto alternativo')).toBeNull();
  });

  it('reception (dashboard only) renders without widgets and explains why', async () => {
    await renderDashboard(['dashboard.view']);
    expect(requested).toEqual(['/admin/dashboard']);
    expect(screen.getByRole('heading', { level: 1, name: 'Resumen' })).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Antes de publicar' })).toBeNull();
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.getByText(/Su rol no tiene secciones de contenido/)).toBeTruthy();
  });
});
