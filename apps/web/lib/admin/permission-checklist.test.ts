import { describe, expect, it } from 'vitest';
import { permissionRows, togglePermission } from './permission-checklist';

describe('togglePermission', () => {
  it('checking Gestionar also grants Ver', () => {
    expect(togglePermission([], 'rooms.manage', true)).toEqual(['rooms.view', 'rooms.manage']);
  });

  it('unchecking Gestionar keeps Ver', () => {
    expect(togglePermission(['rooms.view', 'rooms.manage'], 'rooms.manage', false)).toEqual([
      'rooms.view',
    ]);
  });

  it('Ver cannot be removed while Gestionar is on', () => {
    expect(togglePermission(['rooms.view', 'rooms.manage'], 'rooms.view', false)).toEqual([
      'rooms.view',
      'rooms.manage',
    ]);
  });

  it('Ver toggles on its own and keeps catalog order', () => {
    expect(togglePermission(['users.view'], 'hotel.view', true)).toEqual([
      'hotel.view',
      'users.view',
    ]);
    expect(togglePermission(['hotel.view', 'users.view'], 'hotel.view', false)).toEqual([
      'users.view',
    ]);
  });
});

describe('permissionRows', () => {
  it('lists one row per area with Spanish labels and the implied Ver locked', () => {
    const rows = permissionRows(['content.manage']);
    expect(rows.map((row) => row.label)).toEqual([
      'Resumen',
      'Datos del hotel',
      'Habitaciones',
      'Contenido',
      'Fotos y medios',
      'Actividad',
      'Usuarios y roles',
    ]);
    const content = rows.find((row) => row.area === 'content')!;
    expect(content).toMatchObject({ view: true, manage: true, viewLocked: true });
    const hotel = rows.find((row) => row.area === 'hotel')!;
    expect(hotel).toMatchObject({ view: false, manage: false, viewLocked: false });
  });
});
