import { PERMISSIONS, type Permission } from '@hotel-bambu/shared';
import { describe, expect, it } from 'vitest';
import {
  PERMISSION_AREA_LABELS,
  accessRedirect,
  canAccess,
  firstAllowedPath,
  routePermissions,
} from './access';

const EDITOR: Permission[] = [
  'dashboard.view',
  'hotel.view',
  'hotel.manage',
  'rooms.view',
  'rooms.manage',
  'content.view',
  'content.manage',
  'media.view',
  'media.manage',
];
const RECEPTION: Permission[] = ['dashboard.view'];

describe('routePermissions', () => {
  it('maps every admin section to the permission the API requires', () => {
    expect(routePermissions('/admin')).toEqual(['dashboard.view']);
    expect(routePermissions('/admin/hotel#whatsapp')).toEqual(['hotel.view']);
    expect(routePermissions('/admin/social')).toEqual(['hotel.view']);
    expect(routePermissions('/admin/nearby-places')).toEqual(['hotel.view']);
    expect(routePermissions('/admin/room-types/abc')).toEqual(['rooms.view']);
    expect(routePermissions('/admin/rooms')).toEqual(['rooms.view']);
    expect(routePermissions('/admin/amenities')).toEqual(['rooms.view']);
    expect(routePermissions('/admin/policies')).toEqual(['content.view']);
    expect(routePermissions('/admin/media?missingAlt=true')).toEqual(['media.view']);
    expect(routePermissions('/admin/users')).toEqual(['users.view']);
    expect(routePermissions('/admin/roles')).toEqual(['users.view']);
  });

  it('needs no permission for the own account', () => {
    expect(routePermissions('/admin/account')).toEqual([]);
  });

  it('does not confuse /admin/rooms with /admin/room-types', () => {
    expect(routePermissions('/admin/roomsx')).toBeNull();
  });
});

describe('canAccess', () => {
  it('lets the administrator open every section', () => {
    expect(canAccess(PERMISSIONS, '/admin/users')).toBe(true);
    expect(canAccess(PERMISSIONS, '/admin')).toBe(true);
  });

  it('hides users and roles from the content editor', () => {
    expect(canAccess(EDITOR, '/admin/hotel')).toBe(true);
    expect(canAccess(EDITOR, '/admin/users')).toBe(false);
    expect(canAccess(EDITOR, '/admin/roles')).toBe(false);
  });

  it('treats manage as implying view', () => {
    expect(canAccess(['users.manage'], '/admin/users')).toBe(true);
  });

  it('always allows the account page', () => {
    expect(canAccess([], '/admin/account')).toBe(true);
  });

  it('denies unknown admin routes', () => {
    expect(canAccess(PERMISSIONS, '/admin/unknown')).toBe(false);
  });
});

describe('firstAllowedPath', () => {
  it('is the dashboard when the role can see it', () => {
    expect(firstAllowedPath(RECEPTION)).toBe('/admin');
  });

  it('follows the navigation order otherwise', () => {
    expect(firstAllowedPath(['rooms.view'])).toBe('/admin/room-types');
    expect(firstAllowedPath(['media.manage'])).toBe('/admin/media');
  });

  it('falls back to the account page when nothing else is allowed', () => {
    expect(firstAllowedPath([])).toBe('/admin/account');
  });
});

describe('accessRedirect', () => {
  it('sends the user to the first allowed section with a notice flag', () => {
    expect(accessRedirect(EDITOR)).toBe('/admin?acceso=denegado');
    expect(accessRedirect([])).toBe('/admin/account?acceso=denegado');
  });

  it('can skip the notice (landing page)', () => {
    expect(accessRedirect(['rooms.view'], { notice: false })).toBe('/admin/room-types');
  });
});

describe('PERMISSION_AREA_LABELS', () => {
  it('names every area in Spanish', () => {
    expect(PERMISSION_AREA_LABELS).toEqual({
      dashboard: 'Resumen',
      hotel: 'Datos del hotel',
      rooms: 'Habitaciones',
      content: 'Contenido',
      media: 'Fotos y medios',
      activity: 'Actividad',
      users: 'Usuarios y roles',
    });
  });
});
