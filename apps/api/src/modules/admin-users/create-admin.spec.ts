import { describe, expect, it, vi } from 'vitest';
import { AdminCreationError, createAdminUser } from './create-admin.js';

const ROLES = [
  { id: 'role-admin', name: 'Administrador' },
  { id: 'role-reception', name: 'Recepción' },
];

function fakeDb(existing: { id: string } | null = null) {
  const db = {
    role: {
      findUnique: vi.fn(
        async ({ where }: { where: { name?: string; id?: string } }) =>
          ROLES.find((role) => role.name === where.name || role.id === where.id) ?? null,
      ),
    },
    adminUser: {
      findUnique: vi.fn(async () => existing),
      create: vi.fn(async (_args: unknown) => ({ id: 'new-id' })),
      update: vi.fn(),
    },
    session: { deleteMany: vi.fn() },
    $transaction: vi.fn(async () => []),
  };
  return db;
}

describe('createAdminUser', () => {
  it('normalizes the email and stores only an Argon2id hash', async () => {
    const db = fakeDb();
    const result = await createAdminUser(db as never, {
      email: '  Admin@Example.TEST ',
      password: 'a long enough passphrase',
    });

    expect(result).toEqual({ id: 'new-id', email: 'admin@example.test', action: 'created' });
    const data = db.adminUser.create.mock.calls[0]?.[0] as unknown as {
      data: { email: string; passwordHash: string; roleId: string };
    };
    expect(data.data.email).toBe('admin@example.test');
    // Default role: the system role Administrador.
    expect(data.data.roleId).toBe('role-admin');
    expect(data.data.passwordHash).toMatch(/^\$argon2id\$/);
    expect(JSON.stringify(data)).not.toContain('a long enough passphrase');
  });

  it('rejects a weak password before touching the database', async () => {
    const db = fakeDb();
    await expect(
      createAdminUser(db as never, { email: 'admin@example.test', password: 'short' }),
    ).rejects.toBeInstanceOf(AdminCreationError);
    expect(db.adminUser.findUnique).not.toHaveBeenCalled();
  });

  it('rejects an invalid email', async () => {
    await expect(
      createAdminUser(fakeDb() as never, { email: 'nope', password: 'a long enough passphrase' }),
    ).rejects.toThrow(/Invalid email/);
  });

  it('refuses to overwrite an existing admin unless resetting the password', async () => {
    const db = fakeDb({ id: 'existing' });
    await expect(
      createAdminUser(db as never, {
        email: 'admin@example.test',
        password: 'a long enough passphrase',
      }),
    ).rejects.toThrow(/already exists/);

    const reset = await createAdminUser(db as never, {
      email: 'admin@example.test',
      password: 'another long passphrase',
      resetPassword: true,
    });
    expect(reset.action).toBe('password_reset');
    expect(db.session.deleteMany).toHaveBeenCalledWith({ where: { adminUserId: 'existing' } });
  });

  it('assigns the role given by name, or by id', async () => {
    const db = fakeDb();
    await createAdminUser(db as never, {
      email: 'front@example.test',
      password: 'a long enough passphrase',
      role: 'Recepción',
    });
    await createAdminUser(db as never, {
      email: 'front2@example.test',
      password: 'a long enough passphrase',
      roleId: 'role-reception',
    });
    const roleIds = db.adminUser.create.mock.calls.map(
      (call) => (call[0] as unknown as { data: { roleId: string } }).data.roleId,
    );
    expect(roleIds).toEqual(['role-reception', 'role-reception']);
  });

  it('rejects an unknown role before creating anything', async () => {
    const db = fakeDb();
    await expect(
      createAdminUser(db as never, {
        email: 'front@example.test',
        password: 'a long enough passphrase',
        role: 'Gerente',
      }),
    ).rejects.toThrow(/Role "Gerente" does not exist/);
    expect(db.adminUser.create).not.toHaveBeenCalled();
  });
});
