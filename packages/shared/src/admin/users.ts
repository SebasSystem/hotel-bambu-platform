import { z } from 'zod';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../auth/auth.js';
import { permissionListSchema, permissionSchema } from '../auth/permissions.js';
import { idSchema, nullableText, requiredText } from './admin.js';

/**
 * Admin users and roles (feature admin-users-roles): `/admin/users` and `/admin/roles`.
 * Inputs are strict; the password policy beyond length (common passwords, email) is checked by
 * the API. Users are never hard-deleted: they are deactivated.
 */

const emailSchema = z.string().trim().toLowerCase().max(254).pipe(z.email());
const passwordSchema = z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH);
const isoDate = z.iso.datetime({ offset: true });

// ─── Users ──────────────────────────────────────────────────────────────────

export const adminUserCreateSchema = z.strictObject({
  email: emailSchema,
  name: nullableText(120).optional(),
  roleId: idSchema,
  password: passwordSchema,
});
export type AdminUserCreateInput = z.infer<typeof adminUserCreateSchema>;

export const adminUserUpdateSchema = z.strictObject({
  name: nullableText(120).optional(),
  roleId: idSchema.optional(),
  active: z.boolean().optional(),
});
export type AdminUserUpdateInput = z.infer<typeof adminUserUpdateSchema>;

/** Sets a new password, unlocks the account and ends its sessions. */
export const adminUserPasswordResetSchema = z.strictObject({ password: passwordSchema });
export type AdminUserPasswordResetInput = z.infer<typeof adminUserPasswordResetSchema>;

export const adminRoleRefSchema = z.object({
  id: idSchema,
  name: z.string(),
  isSystem: z.boolean(),
});

/** Item of `GET /admin/users` (also returned by create/update). */
export const adminUserSummarySchema = z.object({
  id: idSchema,
  email: z.string(),
  name: z.string().nullable(),
  role: adminRoleRefSchema,
  active: z.boolean(),
  lastLoginAt: isoDate.nullable(),
  createdAt: isoDate,
});
export type AdminUserSummary = z.infer<typeof adminUserSummarySchema>;

// ─── Roles ──────────────────────────────────────────────────────────────────

const roleFields = {
  name: requiredText(60),
  description: nullableText(300).optional(),
  /** Catalog keys only; `manage` adds the matching `view`. */
  permissions: permissionListSchema,
};

export const roleCreateSchema = z.strictObject(roleFields);
export type RoleCreateInput = z.infer<typeof roleCreateSchema>;

export const roleUpdateSchema = z.strictObject(roleFields).partial();
export type RoleUpdateInput = z.infer<typeof roleUpdateSchema>;

/** Item of `GET /admin/roles` (also returned by create/update). */
export const adminRoleSummarySchema = z.object({
  id: idSchema,
  name: z.string(),
  description: z.string().nullable(),
  permissions: z.array(permissionSchema),
  isSystem: z.boolean(),
  userCount: z.int().min(0),
  createdAt: isoDate,
  updatedAt: isoDate,
});
export type AdminRoleSummary = z.infer<typeof adminRoleSummarySchema>;

/**
 * `code` and constant English `message` the users and roles endpoints add to 409/422 bodies (the
 * admin panel translates the message).
 */
export const ADMIN_USER_ERRORS = {
  SELF_ROLE_CHANGE: 'You cannot change your own role.',
  SELF_DEACTIVATION: 'You cannot deactivate your own account.',
  LAST_ADMINISTRATOR: 'At least one active user must keep the Administrador role.',
  EMAIL_TAKEN: 'An admin with this email already exists.',
  ROLE_NOT_FOUND: 'The selected role does not exist.',
  ROLE_NAME_TAKEN: 'A role with this name already exists.',
  SYSTEM_ROLE_IMMUTABLE: 'The Administrador role cannot be changed or deleted.',
  ROLE_IN_USE: 'The role still has users. Move them to another role first.',
} as const;
export type AdminUserErrorCode = keyof typeof ADMIN_USER_ERRORS;
