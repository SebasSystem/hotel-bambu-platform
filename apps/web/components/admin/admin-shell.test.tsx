// @vitest-environment jsdom
import { PERMISSIONS, type Permission } from '@hotel-bambu/shared';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SessionInfo } from '@/lib/api/types';
import { AdminProvider } from './admin-context';
import { ADMIN_NAV, AdminShell, visibleNav } from './admin-shell';

let search = '';
vi.mock('next/navigation', () => ({
  usePathname: () => '/admin',
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(search),
}));

const EDITOR: Permission[] = [
  'dashboard.view',
  'hotel.manage',
  'rooms.manage',
  'content.manage',
  'media.manage',
];

function session(permissions: readonly Permission[], roleName: string): SessionInfo {
  return {
    user: {
      id: 'u1',
      email: 'ana@example.test',
      name: 'Ana Pérez',
      role: { id: 'r1', name: roleName },
      permissions: [...permissions],
    },
    csrfToken: 'csrf',
    expiresAt: '2026-11-10T00:00:00.000Z',
  };
}

function renderShell(permissions: readonly Permission[], roleName = 'Editor de contenido') {
  return render(
    <AdminProvider session={session(permissions, roleName)} mediaBaseUrl="http://media.test">
      <AdminShell>
        <p>Contenido</p>
      </AdminShell>
    </AdminProvider>,
  );
}

const labels = (nav: ReturnType<typeof visibleNav>) =>
  nav.flatMap((group) => group.items.map((item) => item.label));

describe('visibleNav', () => {
  it('shows every section, including Usuarios and Roles, to the administrator', () => {
    const nav = visibleNav(ADMIN_NAV, PERMISSIONS);
    expect(nav.map((group) => group.label)).toEqual([
      null,
      'Hotel',
      'Habitaciones',
      'Contenido',
      'Usuarios',
      'Cuenta',
    ]);
    expect(labels(nav)).toEqual(expect.arrayContaining(['Usuarios', 'Roles', 'Mi cuenta']));
  });

  it('hides the Usuarios group from the content editor', () => {
    const nav = visibleNav(ADMIN_NAV, EDITOR);
    expect(nav.map((group) => group.label)).not.toContain('Usuarios');
    expect(labels(nav)).toContain('Fotos y medios');
  });

  it('keeps only the dashboard and the account for reception', () => {
    const nav = visibleNav(ADMIN_NAV, ['dashboard.view']);
    expect(nav.map((group) => group.label)).toEqual([null, 'Cuenta']);
    expect(labels(nav)).toEqual(['Resumen', 'Mi cuenta']);
  });

  it('filters items inside a group (media only)', () => {
    const nav = visibleNav(ADMIN_NAV, ['media.view']);
    expect(nav.map((group) => group.label)).toEqual(['Contenido', 'Cuenta']);
    expect(labels(nav)).toEqual(['Fotos y medios', 'Mi cuenta']);
  });
});

describe('AdminShell', () => {
  afterEach(() => {
    cleanup();
    search = '';
  });

  it('renders only the sections the role may open and shows the role name', () => {
    renderShell(EDITOR);
    const sidebar = screen.getAllByRole('navigation', { name: 'Panel' })[0]!;
    expect(within(sidebar).queryByRole('link', { name: 'Usuarios' })).toBeNull();
    expect(within(sidebar).getByRole('link', { name: 'Datos del hotel' })).toBeTruthy();
    expect(screen.getAllByText('Editor de contenido').length).toBeGreaterThan(0);
  });

  it('explains a redirect away from a forbidden page', () => {
    search = 'acceso=denegado';
    renderShell(EDITOR);
    expect(screen.getByText(/No tiene permiso para abrir esa sección/)).toBeTruthy();
  });

  it('shows no notice on a normal visit', () => {
    renderShell(PERMISSIONS, 'Administrador');
    expect(screen.queryByText(/No tiene permiso para abrir esa sección/)).toBeNull();
  });
});
