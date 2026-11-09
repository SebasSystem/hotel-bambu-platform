import { describe, expect, it } from 'vitest';
import {
  adminRoleSummarySchema,
  adminUserCreateSchema,
  adminUserPasswordResetSchema,
  adminUserSummarySchema,
  adminUserUpdateSchema,
  roleCreateSchema,
  roleUpdateSchema,
} from './users.js';

const ROLE_ID = '00000000-0000-7000-8000-000000000002';

describe('admin user schemas', () => {
  it('normalizes the email and requires a role and a policy-length password', () => {
    expect(
      adminUserCreateSchema.parse({
        email: '  Ana@Example.TEST ',
        name: ' Ana ',
        roleId: ROLE_ID,
        password: 'a long enough passphrase',
      }),
    ).toEqual({
      email: 'ana@example.test',
      name: 'Ana',
      roleId: ROLE_ID,
      password: 'a long enough passphrase',
    });
    expect(
      adminUserCreateSchema.safeParse({ email: 'ana@example.test', roleId: ROLE_ID, password: 'x' })
        .success,
    ).toBe(false);
    expect(
      adminUserCreateSchema.safeParse({
        email: 'ana@example.test',
        password: 'a long enough passphrase',
      }).success,
    ).toBe(false);
  });

  it('rejects unexpected properties (no permission or password smuggling on update)', () => {
    expect(adminUserUpdateSchema.safeParse({ active: false }).success).toBe(true);
    expect(adminUserUpdateSchema.safeParse({ permissions: ['users.manage'] }).success).toBe(false);
    expect(adminUserUpdateSchema.safeParse({ password: 'a long enough passphrase' }).success).toBe(
      false,
    );
    expect(adminUserUpdateSchema.parse({ name: '' })).toEqual({ name: null });
  });

  it('validates the reset password', () => {
    expect(adminUserPasswordResetSchema.safeParse({ password: 'short' }).success).toBe(false);
    expect(
      adminUserPasswordResetSchema.safeParse({ password: 'a long enough passphrase' }).success,
    ).toBe(true);
  });

  it('describes the list item returned by the API', () => {
    expect(
      adminUserSummarySchema.parse({
        id: ROLE_ID,
        email: 'ana@example.test',
        name: null,
        role: { id: ROLE_ID, name: 'Recepción', isSystem: false },
        active: true,
        lastLoginAt: null,
        createdAt: '2026-11-09T12:00:00.000Z',
      }).role.name,
    ).toBe('Recepción');
  });
});

describe('role schemas', () => {
  it('validates permissions against the catalog and normalizes them', () => {
    expect(roleCreateSchema.parse({ name: ' Caja ', permissions: ['media.manage'] })).toEqual({
      name: 'Caja',
      permissions: ['media.view', 'media.manage'],
    });
    expect(roleCreateSchema.safeParse({ name: 'Caja', permissions: ['root'] }).success).toBe(false);
    expect(roleCreateSchema.safeParse({ name: '', permissions: [] }).success).toBe(false);
  });

  it('allows partial updates and rejects isSystem', () => {
    expect(roleUpdateSchema.parse({ description: '' })).toEqual({ description: null });
    expect(roleUpdateSchema.safeParse({ isSystem: true }).success).toBe(false);
  });

  it('describes the list item returned by the API', () => {
    const role = adminRoleSummarySchema.parse({
      id: ROLE_ID,
      name: 'Recepción',
      description: null,
      permissions: ['dashboard.view'],
      isSystem: false,
      userCount: 2,
      createdAt: '2026-11-09T12:00:00.000Z',
      updatedAt: '2026-11-09T12:00:00.000Z',
    });
    expect(role.userCount).toBe(2);
  });
});
