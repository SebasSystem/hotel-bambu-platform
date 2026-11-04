import { describe, expect, it } from 'vitest';
import {
  PASSWORD_MIN_LENGTH,
  checkPasswordPolicy,
  hashPassword,
  verifyPassword,
} from './password.js';

describe('checkPasswordPolicy', () => {
  it(`rejects passwords shorter than ${PASSWORD_MIN_LENGTH} characters`, () => {
    expect(checkPasswordPolicy('Short1!pass')).toContain('too_short');
  });

  it('accepts a long passphrase', () => {
    expect(checkPasswordPolicy('bambu en la montaña 2026')).toEqual([]);
  });

  it('counts characters, not bytes', () => {
    expect(checkPasswordPolicy('ñ'.repeat(11))).toContain('too_short');
  });

  it('rejects overly long input to bound hashing cost', () => {
    expect(checkPasswordPolicy('a1'.repeat(200))).toContain('too_long');
  });

  it('rejects a single repeated character', () => {
    expect(checkPasswordPolicy('a'.repeat(16))).toContain('too_simple');
  });

  it('rejects passwords containing the email local part', () => {
    expect(checkPasswordPolicy('recepcion-hotel-2026', 'recepcion@example.test')).toContain(
      'contains_email',
    );
  });
});

describe('hashPassword / verifyPassword', () => {
  it('produces an Argon2id PHC hash that verifies only the right password', async () => {
    const hash = await hashPassword('correct horse battery staple');
    expect(hash).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
    expect(await verifyPassword(hash, 'correct horse battery staple')).toBe(true);
    expect(await verifyPassword(hash, 'wrong horse battery staple')).toBe(false);
  });

  it('returns false for a malformed hash instead of throwing', async () => {
    expect(await verifyPassword('not-a-hash', 'whatever password')).toBe(false);
  });
});
