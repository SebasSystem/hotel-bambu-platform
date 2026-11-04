import { describe, expect, it } from 'vitest';
import { assertDemoSeedAllowed, isProductionEnv } from './seed-guards.js';

describe('isProductionEnv', () => {
  it('is true when NODE_ENV or APP_ENV is production (case/space-insensitive)', () => {
    expect(isProductionEnv({ NODE_ENV: 'production' })).toBe(true);
    expect(isProductionEnv({ APP_ENV: ' Production ' })).toBe(true);
    expect(isProductionEnv({ NODE_ENV: 'development', APP_ENV: 'production' })).toBe(true);
    expect(isProductionEnv({ APP_ENV: 'prod' })).toBe(true);
  });

  it('is false for development, staging, test or unset', () => {
    expect(isProductionEnv({})).toBe(false);
    expect(isProductionEnv({ NODE_ENV: 'development', APP_ENV: 'staging' })).toBe(false);
    expect(isProductionEnv({ NODE_ENV: 'test' })).toBe(false);
  });
});

describe('assertDemoSeedAllowed', () => {
  it('refuses to run in production', () => {
    expect(() => assertDemoSeedAllowed({ APP_ENV: 'production' })).toThrow(/production/);
    expect(() => assertDemoSeedAllowed({ NODE_ENV: 'production' })).toThrow(/production/);
  });

  it('allows local and staging', () => {
    expect(() => assertDemoSeedAllowed({ NODE_ENV: 'development' })).not.toThrow();
    expect(() => assertDemoSeedAllowed({ APP_ENV: 'staging' })).not.toThrow();
  });
});
