import { z } from 'zod';
import type { PrismaClient } from '../../generated/prisma/client.js';
import { PASSWORD_POLICY_MESSAGES, checkPasswordPolicy, hashPassword } from '../auth/password.js';

export const adminEmailSchema = z.string().trim().toLowerCase().pipe(z.email().max(254));

export class AdminCreationError extends Error {
  override readonly name = 'AdminCreationError';
}

export interface CreateAdminInput {
  email: string;
  password: string;
  name?: string | undefined;
  /** Existing admin: set a new password, unlock the account and revoke every session. */
  resetPassword?: boolean;
}

type AdminDb = Pick<PrismaClient, 'adminUser' | 'session' | '$transaction'>;

/**
 * Creates the first/next administrator (requirement 16.1: no public sign-up, no default
 * credentials). Validates the email and password policy before touching the database.
 */
export async function createAdminUser(
  db: AdminDb,
  input: CreateAdminInput,
): Promise<{ id: string; email: string; action: 'created' | 'password_reset' }> {
  const parsedEmail = adminEmailSchema.safeParse(input.email);
  if (!parsedEmail.success) throw new AdminCreationError('Invalid email address.');
  const email = parsedEmail.data;

  const violations = checkPasswordPolicy(input.password, email);
  if (violations.length > 0) {
    throw new AdminCreationError(violations.map((v) => PASSWORD_POLICY_MESSAGES[v]).join(' '));
  }

  const existing = await db.adminUser.findUnique({ where: { email }, select: { id: true } });
  if (existing && !input.resetPassword) {
    throw new AdminCreationError(
      `An admin with email ${email} already exists (use --reset-password to set a new password).`,
    );
  }
  if (!existing && input.resetPassword) {
    throw new AdminCreationError(`No admin with email ${email} exists.`);
  }

  const passwordHash = await hashPassword(input.password);

  if (existing) {
    await db.$transaction([
      db.adminUser.update({
        where: { id: existing.id },
        data: { passwordHash, failedAttempts: 0, lockedUntil: null, passwordChangedAt: new Date() },
      }),
      db.session.deleteMany({ where: { adminUserId: existing.id } }),
    ]);
    return { id: existing.id, email, action: 'password_reset' };
  }

  const created = await db.adminUser.create({
    data: { email, passwordHash, name: input.name?.trim() || null },
    select: { id: true },
  });
  return { id: created.id, email, action: 'created' };
}
