import { describe, expect, it } from 'vitest';
import {
  PERMISSIONS,
  expandPermissions,
  hasAnyPermission,
  hasPermission,
  isPermission,
  permissionListSchema,
} from './permissions.js';

describe('permission catalog', () => {
  it('has a view and a manage permission for every admin area', () => {
    expect(PERMISSIONS).toEqual([
      'dashboard.view',
      'dashboard.manage',
      'hotel.view',
      'hotel.manage',
      'rooms.view',
      'rooms.manage',
      'content.view',
      'content.manage',
      'media.view',
      'media.manage',
      'activity.view',
      'activity.manage',
      'users.view',
      'users.manage',
    ]);
  });

  it('recognizes only catalog keys', () => {
    expect(isPermission('rooms.manage')).toBe(true);
    expect(isPermission('rooms.delete')).toBe(false);
    expect(isPermission('reservations.view')).toBe(false);
  });
});

describe('expandPermissions', () => {
  it('adds the implied view permission, drops unknown keys and returns catalog order', () => {
    expect(expandPermissions(['users.manage', 'bogus', 'dashboard.view', 'users.manage'])).toEqual([
      'dashboard.view',
      'users.view',
      'users.manage',
    ]);
  });

  it('returns an empty list for no permissions', () => {
    expect(expandPermissions([])).toEqual([]);
  });
});

describe('hasPermission / hasAnyPermission', () => {
  it('treats manage as implying view', () => {
    expect(hasPermission(['rooms.manage'], 'rooms.view')).toBe(true);
    expect(hasPermission(['rooms.view'], 'rooms.manage')).toBe(false);
    expect(hasPermission([], 'dashboard.view')).toBe(false);
  });

  it('grants when any of the listed permissions is held', () => {
    expect(hasAnyPermission(['content.manage'], ['media.view', 'content.manage'])).toBe(true);
    expect(hasAnyPermission(['content.view'], ['media.view', 'content.manage'])).toBe(false);
    expect(hasAnyPermission(['content.view'], [])).toBe(false);
  });
});

describe('permissionListSchema', () => {
  it('normalizes a valid list (implied view, unique, catalog order)', () => {
    expect(permissionListSchema.parse(['media.manage', 'hotel.view'])).toEqual([
      'hotel.view',
      'media.view',
      'media.manage',
    ]);
  });

  it('rejects keys outside the catalog', () => {
    expect(permissionListSchema.safeParse(['rooms.view', 'root']).success).toBe(false);
  });
});
