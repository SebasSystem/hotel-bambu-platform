import { describe, expect, it, vi } from 'vitest';
import { AdminCreationError, createAdminUser } from './create-admin.js';

function fakeDb(existing: { id: string } | null = null) {
  const db = {
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
      data: { email: string; passwordHash: string };
    };
    expect(data.data.email).toBe('admin@example.test');
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
});
