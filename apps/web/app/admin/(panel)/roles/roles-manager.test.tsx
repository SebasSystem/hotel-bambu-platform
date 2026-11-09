// @vitest-environment jsdom
import { PERMISSIONS, type AdminRoleSummary } from '@hotel-bambu/shared';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FeedbackProvider } from '@/components/admin/feedback';
import { RolesManager } from './roles-manager';

const post = vi.fn();
const del = vi.fn();
const refresh = vi.fn();

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));
vi.mock('@/lib/api/browser', () => ({
  browserApi: {
    post: (...args: unknown[]) => post(...args),
    patch: vi.fn(),
    delete: (...args: unknown[]) => del(...args),
  },
}));

HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
  this.open = true;
};
HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
  this.open = false;
};

const base = { createdAt: '2026-11-01T00:00:00.000Z', updatedAt: '2026-11-01T00:00:00.000Z' };
const roles: AdminRoleSummary[] = [
  {
    ...base,
    id: '00000000-0000-7000-8000-000000000001',
    name: 'Administrador',
    description: 'Acceso completo.',
    permissions: [...PERMISSIONS],
    isSystem: true,
    userCount: 1,
  },
  {
    ...base,
    id: '00000000-0000-7000-8000-000000000002',
    name: 'Editor de contenido',
    description: null,
    permissions: ['content.view', 'content.manage'],
    isSystem: false,
    userCount: 2,
  },
  {
    ...base,
    id: '00000000-0000-7000-8000-000000000003',
    name: 'Recepción',
    description: null,
    permissions: ['dashboard.view'],
    isSystem: false,
    userCount: 0,
  },
];

function renderManager(canManage = true) {
  return render(
    <FeedbackProvider>
      <RolesManager roles={roles} canManage={canManage} />
    </FeedbackProvider>,
  );
}

const card = (name: string) => screen.getByRole('article', { name });

describe('RolesManager', () => {
  afterEach(() => {
    cleanup();
    post.mockReset();
    del.mockReset();
  });

  it('marks the system role, keeps it read-only and shows user counts', () => {
    renderManager();
    const admin = card('Administrador');
    expect(within(admin).getByText('Sistema')).toBeTruthy();
    expect(within(admin).getByText('Todos los permisos')).toBeTruthy();
    expect(within(admin).queryByRole('button', { name: /Editar/ })).toBeNull();
    expect(within(card('Editor de contenido')).getByText('2 usuarios')).toBeTruthy();
    expect(within(card('Editor de contenido')).getByText('Contenido: gestionar')).toBeTruthy();
  });

  it('blocks deleting a role in use and explains why', () => {
    renderManager();
    const button = within(card('Editor de contenido')).getByRole('button', {
      name: 'Eliminar Editor de contenido',
    });
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(
      within(card('Editor de contenido')).getByText(/Asigne otro rol a sus 2 usuarios/),
    ).toBeTruthy();
  });

  it('deletes an unused role after confirmation', async () => {
    del.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderManager();
    await user.click(within(card('Recepción')).getByRole('button', { name: 'Eliminar Recepción' }));
    await user.click(await screen.findByRole('button', { name: 'Eliminar' }));
    expect(del).toHaveBeenCalledWith('/admin/roles/00000000-0000-7000-8000-000000000003');
  });

  it('creates a role with grouped permissions (Gestionar implies Ver)', async () => {
    post.mockResolvedValue(roles[2]);
    const user = userEvent.setup();
    renderManager();
    await user.click(screen.getByRole('button', { name: 'Agregar rol' }));
    const form = screen.getByRole('dialog', { name: 'Agregar rol' });
    await user.type(within(form).getByLabelText(/^Nombre/), 'Fotografía');
    await user.click(
      within(within(form).getByRole('group', { name: 'Fotos y medios' })).getByRole('checkbox', {
        name: 'Gestionar',
      }),
    );
    await user.click(within(form).getByRole('button', { name: 'Crear rol' }));
    expect(post).toHaveBeenCalledWith('/admin/roles', {
      name: 'Fotografía',
      description: null,
      permissions: ['media.view', 'media.manage'],
    });
    expect(screen.queryByRole('dialog', { name: 'Agregar rol' })).toBeNull();
  });

  it('edits a role in a modal and asks before discarding changes', async () => {
    const user = userEvent.setup();
    renderManager();
    await user.click(screen.getByRole('button', { name: 'Editar Recepción' }));
    const dialog = screen.getByRole('dialog', { name: 'Editar rol' });
    // The list does not reflow: the role card stays in place under the modal.
    expect(card('Recepción')).toBeTruthy();
    const name = within(dialog).getByLabelText(/^Nombre/);
    expect((name as HTMLInputElement).value).toBe('Recepción');
    await user.type(name, ' y reservas');
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    const ask = await screen.findByRole('dialog', { name: '¿Descartar cambios?' });
    await user.click(within(ask).getByRole('button', { name: 'Descartar' }));
    expect(screen.queryByRole('dialog', { name: 'Editar rol' })).toBeNull();
  });

  it('is read-only without users.manage', () => {
    renderManager(false);
    expect(screen.queryByRole('button', { name: 'Agregar rol' })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Eliminar/ })).toBeNull();
  });
});
