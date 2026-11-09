// @vitest-environment jsdom
import type { Permission } from '@hotel-bambu/shared';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PermissionChecklist } from './permission-checklist';

const changes = vi.fn();

function Harness({ initial = [] as Permission[], readOnly = false }) {
  const [value, setValue] = useState<Permission[]>(initial);
  return (
    <PermissionChecklist
      value={value}
      readOnly={readOnly}
      onChange={(next) => {
        changes(next);
        setValue(next);
      }}
    />
  );
}

const area = (name: string) => screen.getByRole('group', { name });

describe('PermissionChecklist', () => {
  afterEach(() => {
    cleanup();
    changes.mockReset();
  });

  it('groups Ver and Gestionar per area with Spanish labels', () => {
    render(<Harness />);
    for (const label of [
      'Resumen',
      'Datos del hotel',
      'Habitaciones',
      'Contenido',
      'Fotos y medios',
      'Actividad',
      'Usuarios y roles',
    ]) {
      expect(within(area(label)).getByRole('checkbox', { name: 'Ver' })).toBeTruthy();
      expect(within(area(label)).getByRole('checkbox', { name: 'Gestionar' })).toBeTruthy();
    }
  });

  it('checking Gestionar checks and locks Ver; unchecking it unlocks Ver', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const rooms = area('Habitaciones');
    const view = within(rooms).getByRole('checkbox', { name: 'Ver' }) as HTMLInputElement;
    const manage = within(rooms).getByRole('checkbox', { name: 'Gestionar' });

    await user.click(manage);
    expect(changes).toHaveBeenLastCalledWith(['rooms.view', 'rooms.manage']);
    expect(view.checked).toBe(true);
    expect(view.disabled).toBe(true);

    await user.click(manage);
    expect(changes).toHaveBeenLastCalledWith(['rooms.view']);
    expect(view.disabled).toBe(false);

    await user.click(view);
    expect(changes).toHaveBeenLastCalledWith([]);
  });

  it('is operable with the keyboard', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const manage = within(area('Resumen')).getByRole('checkbox', { name: 'Gestionar' });
    manage.focus();
    await user.keyboard(' ');
    expect(changes).toHaveBeenLastCalledWith(['dashboard.view', 'dashboard.manage']);
  });

  it('warns when users.manage is granted', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(screen.queryByText(/control total/)).toBeNull();
    await user.click(within(area('Usuarios y roles')).getByRole('checkbox', { name: 'Gestionar' }));
    expect(screen.getByText(/control total/)).toBeTruthy();
  });

  it('read-only mode disables every box', () => {
    render(<Harness initial={['rooms.view']} readOnly />);
    for (const box of screen.getAllByRole('checkbox')) {
      expect((box as HTMLInputElement).disabled).toBe(true);
    }
  });
});
