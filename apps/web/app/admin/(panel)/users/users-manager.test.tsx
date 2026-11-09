// @vitest-environment jsdom
import type { AdminRoleSummary, AdminUserSummary } from '@hotel-bambu/shared';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FeedbackProvider } from '@/components/admin/feedback';
import { ApiError } from '@/lib/api/client';
import { UsersManager } from './users-manager';

const post = vi.fn();
const patch = vi.fn();
const refresh = vi.fn();

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));
vi.mock('@/lib/api/browser', () => ({
  browserApi: {
    post: (...args: unknown[]) => post(...args),
    patch: (...args: unknown[]) => patch(...args),
  },
}));

// jsdom has no <dialog> modal API (the confirmation dialog uses it).
HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
  this.open = true;
};
HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
  this.open = false;
};

const ADMIN_ROLE = '00000000-0000-7000-8000-000000000001';
const EDITOR_ROLE = '00000000-0000-7000-8000-000000000002';
const SELF_ID = '0190a0c0-0000-7000-8000-0000000000a1';
const OTHER_ID = '0190a0c0-0000-7000-8000-0000000000b2';

const roles: AdminRoleSummary[] = [
  {
    id: ADMIN_ROLE,
    name: 'Administrador',
    description: null,
    permissions: [],
    isSystem: true,
    userCount: 1,
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: EDITOR_ROLE,
    name: 'Editor de contenido',
    description: null,
    permissions: ['content.view', 'content.manage'],
    isSystem: false,
    userCount: 1,
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  },
];

const users: AdminUserSummary[] = [
  {
    id: SELF_ID,
    email: 'owner@example.test',
    name: 'Dueña',
    role: { id: ADMIN_ROLE, name: 'Administrador', isSystem: true },
    active: true,
    lastLoginAt: '2026-11-09T14:00:00.000Z',
    createdAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: OTHER_ID,
    email: 'editor@example.test',
    name: 'Editor',
    role: { id: EDITOR_ROLE, name: 'Editor de contenido', isSystem: false },
    active: true,
    lastLoginAt: null,
    createdAt: '2026-11-02T00:00:00.000Z',
  },
];

function renderManager(canManage = true) {
  return render(
    <FeedbackProvider>
      <UsersManager users={users} roles={roles} currentUserId={SELF_ID} canManage={canManage} />
    </FeedbackProvider>,
  );
}

describe('UsersManager', () => {
  afterEach(() => {
    cleanup();
    post.mockReset();
    patch.mockReset();
    refresh.mockReset();
  });

  it('lists users with role, status and last login', () => {
    renderManager();
    const table = screen.getByRole('table');
    const editorRow = within(table).getByRole('row', { name: /editor@example\.test/ });
    expect(within(editorRow).getByText('Editor de contenido')).toBeTruthy();
    expect(within(editorRow).getByText('Activo')).toBeTruthy();
    expect(within(editorRow).getByText('Nunca')).toBeTruthy();
    expect(within(table).getByText('(usted)')).toBeTruthy();
  });

  it('locks role and status for the current user and sends only the name', async () => {
    patch.mockResolvedValue(users[0]);
    const user = userEvent.setup();
    renderManager();

    await user.click(screen.getByRole('button', { name: 'Editar Dueña' }));
    const form = screen.getByRole('dialog', { name: 'Editar usuario' });
    expect((within(form).getByLabelText(/^Rol/) as HTMLSelectElement).disabled).toBe(true);
    expect((within(form).getByLabelText('Usuario activo') as HTMLInputElement).disabled).toBe(true);
    expect(
      within(form).getByText(/No puede cambiar su propio rol ni desactivar su cuenta/),
    ).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Restablecer contraseña de Dueña' })).toBeNull();

    const name = within(form).getByLabelText(/^Nombre/);
    await user.clear(name);
    await user.type(name, 'Dueña del hotel');
    await user.click(within(form).getByRole('button', { name: 'Guardar cambios' }));

    expect(patch).toHaveBeenCalledWith(`/admin/users/${SELF_ID}`, { name: 'Dueña del hotel' });
    expect(refresh).toHaveBeenCalled();
    expect(screen.queryByRole('dialog', { name: 'Editar usuario' })).toBeNull();
  });

  it('changes another user role and explains a refused change in Spanish', async () => {
    patch.mockRejectedValue(new ApiError(409, { message: 'English', code: 'LAST_ADMINISTRATOR' }));
    const user = userEvent.setup();
    renderManager();

    await user.click(screen.getByRole('button', { name: 'Editar Editor' }));
    const form = screen.getByRole('dialog', { name: 'Editar usuario' });
    expect(within(form).getByText(/cierra sus sesiones abiertas/)).toBeTruthy();
    await user.selectOptions(within(form).getByLabelText(/^Rol/), ADMIN_ROLE);
    await user.click(within(form).getByRole('button', { name: 'Guardar cambios' }));

    expect(patch).toHaveBeenCalledWith(`/admin/users/${OTHER_ID}`, {
      name: 'Editor',
      roleId: ADMIN_ROLE,
    });
    expect(
      await within(form).findByText(
        'Debe quedar al menos un usuario activo con el rol Administrador.',
      ),
    ).toBeTruthy();
  });

  it('creates a user and maps EMAIL_TAKEN to the email field', async () => {
    post.mockRejectedValue(new ApiError(409, { message: 'English', code: 'EMAIL_TAKEN' }));
    const user = userEvent.setup();
    renderManager();

    await user.click(screen.getByRole('button', { name: 'Agregar usuario' }));
    const form = screen.getByRole('dialog', { name: 'Agregar usuario' });
    await user.type(within(form).getByLabelText(/^Correo/), 'editor@example.test');
    await user.selectOptions(within(form).getByLabelText(/^Rol/), EDITOR_ROLE);
    await user.type(within(form).getByLabelText(/^Contraseña inicial/), 'una frase larga y segura');
    expect(within(form).getByRole('button', { name: 'Mostrar contraseña' })).toBeTruthy();
    await user.click(within(form).getByRole('button', { name: 'Crear usuario' }));

    expect(post).toHaveBeenCalledWith('/admin/users', {
      email: 'editor@example.test',
      name: null,
      roleId: EDITOR_ROLE,
      password: 'una frase larga y segura',
    });
    const email = within(form).getByLabelText(/^Correo/);
    expect(await within(form).findByText('Ya existe un usuario con ese correo.')).toBeTruthy();
    expect(email.getAttribute('aria-invalid')).toBe('true');
    // A failed save keeps the modal open with the typed values.
    expect(screen.getByRole('dialog', { name: 'Agregar usuario' })).toBeTruthy();
  });

  it('resets a password after confirmation', async () => {
    post.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderManager();

    await user.click(screen.getByRole('button', { name: 'Restablecer contraseña de Editor' }));
    const form = screen.getByRole('dialog', { name: 'Restablecer contraseña' });
    await user.type(within(form).getByLabelText(/^Nueva contraseña/), 'otra frase larga segura');
    await user.click(within(form).getByRole('button', { name: 'Restablecer contraseña' }));
    await user.click(await screen.findByRole('button', { name: 'Restablecer' }));

    expect(post).toHaveBeenCalledWith(`/admin/users/${OTHER_ID}/reset-password`, {
      password: 'otra frase larga segura',
    });
    expect(screen.queryByRole('dialog', { name: 'Restablecer contraseña' })).toBeNull();
  });

  it('is read-only without users.manage', () => {
    renderManager(false);
    expect(screen.queryByRole('button', { name: 'Agregar usuario' })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Editar/ })).toBeNull();
    expect(screen.getByText(/Su rol permite ver los usuarios, no modificarlos/)).toBeTruthy();
  });
});
