import type { Permission } from '@hotel-bambu/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SessionInfo } from '@/lib/api/types';

const get = vi.fn();
const redirect = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT ${url}`);
});

vi.mock('@/lib/api/server', () => ({ serverApi: { get: (...args: unknown[]) => get(...args) } }));
vi.mock('next/navigation', () => ({ redirect: (url: string) => redirect(url) }));

const { requirePermission } = await import('./session');

function session(permissions: Permission[]): SessionInfo {
  return {
    user: {
      id: 'u1',
      email: 'editor@example.test',
      name: 'Editora',
      role: { id: 'r2', name: 'Editor de contenido' },
      permissions,
    },
    csrfToken: 'csrf',
    expiresAt: '2026-11-10T00:00:00.000Z',
  };
}

describe('requirePermission', () => {
  beforeEach(() => {
    get.mockReset();
    redirect.mockClear();
  });

  it('returns the session when the role has any of the permissions', async () => {
    get.mockResolvedValue(session(['hotel.manage']));
    await expect(requirePermission(['media.view', 'hotel.view'])).resolves.toMatchObject({
      user: { email: 'editor@example.test' },
    });
    expect(get).toHaveBeenCalledWith('/auth/me');
    expect(redirect).not.toHaveBeenCalled();
  });

  it('redirects to the first allowed section with the notice flag otherwise', async () => {
    get.mockResolvedValue(session(['dashboard.view', 'rooms.view']));
    await expect(requirePermission('users.view')).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/admin?acceso=denegado');
  });

  it('redirects without the notice when asked (dashboard landing)', async () => {
    get.mockResolvedValue(session(['rooms.view']));
    await expect(requirePermission('dashboard.view', { notice: false })).rejects.toThrow();
    expect(redirect).toHaveBeenCalledWith('/admin/room-types');
  });
});
