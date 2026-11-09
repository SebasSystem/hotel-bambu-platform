import { PERMISSIONS } from '@hotel-bambu/shared';
import { describe, expect, it } from 'vitest';
import { toAuthenticatedAdmin } from './authenticated-admin.js';

const user = { id: 'u1', email: 'a@example.test', name: 'Ana' };

describe('toAuthenticatedAdmin', () => {
  it('exposes the role and the expanded permissions of an ordinary role', () => {
    expect(
      toAuthenticatedAdmin({
        ...user,
        role: {
          id: 'r1',
          name: 'Recepción',
          permissions: ['dashboard.view', 'media.manage', 'legacy.key'],
          isSystem: false,
        },
      }),
    ).toEqual({
      ...user,
      role: { id: 'r1', name: 'Recepción' },
      permissions: ['dashboard.view', 'media.view', 'media.manage'],
    });
  });

  it('gives the system role the whole catalog even when its stored list is stale', () => {
    const admin = toAuthenticatedAdmin({
      ...user,
      role: { id: 'r0', name: 'Administrador', permissions: ['dashboard.view'], isSystem: true },
    });
    expect(admin.permissions).toEqual([...PERMISSIONS]);
  });
});
