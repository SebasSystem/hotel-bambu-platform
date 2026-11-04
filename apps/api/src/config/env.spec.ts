import { describe, expect, it } from 'vitest';
import { envSchema } from './env.js';

const DATABASE_URL = 'postgresql://hotel:hotel@localhost:5432/hotel_bambu';

describe('envSchema', () => {
  it('applies defaults and coerces the port', () => {
    const env = envSchema.parse({ DATABASE_URL, API_PORT: '4100' });
    expect(env).toEqual({
      NODE_ENV: 'development',
      API_HOST: '0.0.0.0',
      API_PORT: 4100,
      LOG_LEVEL: 'info',
      DATABASE_URL,
    });
  });

  it('requires a PostgreSQL DATABASE_URL', () => {
    expect(envSchema.safeParse({}).success).toBe(false);
    expect(envSchema.safeParse({ DATABASE_URL: 'mysql://x@localhost/db' }).success).toBe(false);
  });

  it('rejects an out-of-range port', () => {
    expect(envSchema.safeParse({ DATABASE_URL, API_PORT: '70000' }).success).toBe(false);
  });
});
