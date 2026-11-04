import { hash, verify, type Algorithm, type Options } from '@node-rs/argon2';

export const PASSWORD_MIN_LENGTH = 12;
/** Upper bound keeps Argon2 cost predictable and blocks oversized payloads. */
export const PASSWORD_MAX_LENGTH = 128;

export type PasswordPolicyViolation = 'too_short' | 'too_long' | 'too_simple' | 'contains_email';

export const PASSWORD_POLICY_MESSAGES: Record<PasswordPolicyViolation, string> = {
  too_short: `Password must have at least ${PASSWORD_MIN_LENGTH} characters.`,
  too_long: `Password must have at most ${PASSWORD_MAX_LENGTH} characters.`,
  too_simple: 'Password must not be a single repeated character.',
  contains_email: 'Password must not contain the email name.',
};

/**
 * Length-based policy (OWASP ASVS / NIST 800-63B): long passphrases over composition rules.
 * Returns every violation; an empty array means the password is acceptable.
 */
export function checkPasswordPolicy(password: string, email?: string): PasswordPolicyViolation[] {
  const violations: PasswordPolicyViolation[] = [];
  const length = [...password].length;
  if (length < PASSWORD_MIN_LENGTH) violations.push('too_short');
  if (length > PASSWORD_MAX_LENGTH) violations.push('too_long');
  if (length > 0 && new Set(password).size === 1) violations.push('too_simple');

  const localPart = email?.split('@')[0]?.trim().toLowerCase();
  if (localPart && localPart.length >= 3 && password.toLowerCase().includes(localPart)) {
    violations.push('contains_email');
  }
  return violations;
}

/** Argon2id with the OWASP minimum (19 MiB, t=2, p=1). `Algorithm` is a const enum: 2 = Argon2id. */
export const ARGON2_OPTIONS: Options = {
  algorithm: 2 as Algorithm,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
};

export function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

/** Constant-time verify; a malformed stored hash counts as a mismatch. */
export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}
