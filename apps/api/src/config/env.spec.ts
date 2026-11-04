import { describe, expect, it } from 'vitest';
import { envSchema, isCookieSecure } from './env.js';

const DATABASE_URL = 'postgresql://hotel:hotel@localhost:5432/hotel_bambu';
const SECRET = 'a'.repeat(40);

describe('envSchema', () => {
  it('applies defaults and coerces the port', () => {
    const env = envSchema.parse({ DATABASE_URL, API_PORT: '4100' });
    expect(env).toMatchObject({
      NODE_ENV: 'development',
      API_HOST: '0.0.0.0',
      API_PORT: 4100,
      LOG_LEVEL: 'info',
      DATABASE_URL,
      TRUST_PROXY: false,
      TRUST_CLOUDFLARE: false,
      WEB_ORIGINS: ['http://localhost:3000'],
      SESSION_IDLE_MINUTES: 120,
      SESSION_ABSOLUTE_HOURS: 12,
    });
  });

  it('requires a PostgreSQL DATABASE_URL', () => {
    expect(envSchema.safeParse({}).success).toBe(false);
    expect(envSchema.safeParse({ DATABASE_URL: 'mysql://x@localhost/db' }).success).toBe(false);
  });

  it('rejects an out-of-range port', () => {
    expect(envSchema.safeParse({ DATABASE_URL, API_PORT: '70000' }).success).toBe(false);
  });

  it('requires a real SESSION_SECRET in production', () => {
    expect(envSchema.safeParse({ DATABASE_URL, NODE_ENV: 'production' }).success).toBe(false);
    expect(
      envSchema.safeParse({ DATABASE_URL, NODE_ENV: 'production', SESSION_SECRET: SECRET }).success,
    ).toBe(true);
  });

  it('requires REVALIDATE_SECRET in production when revalidation is enabled', () => {
    const prod = { DATABASE_URL, NODE_ENV: 'production', SESSION_SECRET: SECRET };
    expect(envSchema.safeParse({ ...prod, WEB_INTERNAL_URL: 'http://web:3000' }).success).toBe(
      false,
    );
    expect(
      envSchema.safeParse({
        ...prod,
        WEB_INTERNAL_URL: 'http://web:3000',
        REVALIDATE_SECRET: SECRET,
      }).success,
    ).toBe(true);
  });

  it('parses TRUST_PROXY as boolean, hop count or address list', () => {
    const parse = (TRUST_PROXY: string) =>
      envSchema.parse({ DATABASE_URL, TRUST_PROXY }).TRUST_PROXY;
    expect(parse('true')).toBe(true);
    expect(parse('1')).toBe(1);
    expect(parse('10.0.0.0/8, 127.0.0.1')).toEqual(['10.0.0.0/8', '127.0.0.1']);
  });

  it('normalizes WEB_ORIGINS', () => {
    const env = envSchema.parse({
      DATABASE_URL,
      WEB_ORIGINS: 'https://a.example/, https://b.example',
    });
    expect(env.WEB_ORIGINS).toEqual(['https://a.example', 'https://b.example']);
  });
});

describe('isCookieSecure', () => {
  it('defaults to Secure only in production and honours an explicit override', () => {
    expect(isCookieSecure({ NODE_ENV: 'production', COOKIE_SECURE: undefined })).toBe(true);
    expect(isCookieSecure({ NODE_ENV: 'development', COOKIE_SECURE: undefined })).toBe(false);
    expect(isCookieSecure({ NODE_ENV: 'development', COOKIE_SECURE: 'true' })).toBe(true);
  });
});
