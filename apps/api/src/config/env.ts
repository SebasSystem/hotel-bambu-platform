import { z } from 'zod';

/** Documented in docs/configuration.md. Variables with a default are optional. */

const bool = (fallback: 'true' | 'false') =>
  z
    .enum(['true', 'false'])
    .default(fallback)
    .transform((value) => value === 'true');

const positiveInt = (fallback: number, max = 1_000_000) =>
  z.coerce.number().int().min(1).max(max).default(fallback);

/** Development-only fallback; production must set SESSION_SECRET (enforced below). */
export const DEV_SESSION_SECRET = 'dev-only-session-secret-change-me-0000000000';

/**
 * Fastify `trustProxy`: `false` (default, direct exposure), `true` (trust every hop: only behind a
 * proxy that strips client-supplied X-Forwarded-For), a hop count (`1`) or a comma list of
 * IPs/CIDRs of the reverse proxies.
 */
export const trustProxySchema = z
  .string()
  .trim()
  .default('false')
  .transform((value): boolean | number | string[] => {
    if (value === 'false' || value === '') return false;
    if (value === 'true') return true;
    if (/^\d+$/.test(value)) return Number(value);
    return value
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
  });

const urlList = z
  .string()
  .trim()
  .transform((value) =>
    value
      .split(',')
      .map((part) => part.trim().replace(/\/+$/, ''))
      .filter(Boolean),
  )
  .pipe(z.array(z.url({ protocol: /^https?$/ })).min(1));

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    API_HOST: z.string().min(1).default('0.0.0.0'),
    API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),

    // HTTP
    TRUST_PROXY: trustProxySchema,
    TRUST_CLOUDFLARE: bool('false'),
    BODY_LIMIT_BYTES: positiveInt(1_048_576, 10_485_760),
    UPLOAD_MAX_BYTES: positiveInt(15 * 1024 * 1024, 50 * 1024 * 1024),
    /** Browser origins allowed to send unsafe requests (CSRF Origin check). */
    WEB_ORIGINS: urlList.default(['http://localhost:3000']),

    // Sessions
    SESSION_SECRET: z.string().min(32).default(DEV_SESSION_SECRET),
    SESSION_IDLE_MINUTES: positiveInt(120, 24 * 60),
    SESSION_ABSOLUTE_HOURS: positiveInt(12, 24 * 30),
    /** Defaults to true in production. `false` only for plain-http local development. */
    COOKIE_SECURE: z.enum(['true', 'false']).optional(),
    LOGIN_MAX_ATTEMPTS: positiveInt(5, 100),
    LOGIN_LOCK_MINUTES: positiveInt(15, 24 * 60),

    // Rate limits (requests per minute per client IP)
    RATE_LIMIT_DEFAULT_PER_MINUTE: positiveInt(300),
    RATE_LIMIT_LOGIN_PER_MINUTE: positiveInt(10),
    RATE_LIMIT_PUBLIC_WRITE_PER_MINUTE: positiveInt(60),
    RATE_LIMIT_UPLOAD_PER_MINUTE: positiveInt(30),

    // Object storage (ADR 0005). Credentials optional: uploads answer 503 without them.
    S3_ENDPOINT: z.url().default('http://localhost:9000'),
    S3_REGION: z.string().min(1).default('us-east-1'),
    S3_BUCKET: z.string().min(3).default('hotel-media'),
    S3_ACCESS_KEY: z.string().min(1).optional(),
    S3_SECRET_KEY: z.string().min(1).optional(),
    S3_FORCE_PATH_STYLE: bool('true'),
    /** Public base URL of the bucket (or CDN) used to build media variant URLs. */
    S3_PUBLIC_URL: z
      .url()
      .default('http://localhost:9000/hotel-media')
      .transform((value) => value.replace(/\/+$/, '')),

    // Next.js on-demand revalidation (requirement 21). Disabled when WEB_INTERNAL_URL is unset.
    WEB_INTERNAL_URL: z.url({ protocol: /^https?$/ }).optional(),
    REVALIDATE_SECRET: z.string().min(32).optional(),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== 'production') return;
    if (env.SESSION_SECRET === DEV_SESSION_SECRET) {
      ctx.addIssue({
        code: 'custom',
        path: ['SESSION_SECRET'],
        message: 'SESSION_SECRET is required in production',
      });
    }
    if (env.WEB_INTERNAL_URL && !env.REVALIDATE_SECRET) {
      ctx.addIssue({
        code: 'custom',
        path: ['REVALIDATE_SECRET'],
        message: 'REVALIDATE_SECRET is required when WEB_INTERNAL_URL is set in production',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

export function isCookieSecure(env: Pick<Env, 'NODE_ENV' | 'COOKIE_SECURE'>): boolean {
  if (env.COOKIE_SECURE) return env.COOKIE_SECURE === 'true';
  return env.NODE_ENV === 'production';
}
