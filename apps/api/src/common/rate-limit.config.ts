import type { ExecutionContext } from '@nestjs/common';
import type { ThrottlerModuleOptions, ThrottlerOptions } from '@nestjs/throttler';
import type { FastifyRequest } from 'fastify';
import type { Env } from '../config/env.js';
import { RATE_LIMIT_CATEGORY_KEY, type RateLimitCategory, clientIp } from './request-context.js';

const MINUTE_MS = 60_000;

function categoryOf(context: ExecutionContext): RateLimitCategory | undefined {
  return Reflect.getMetadata(RATE_LIMIT_CATEGORY_KEY, context.getHandler()) as
    RateLimitCategory | undefined;
}

/** A named throttler that only counts routes tagged with `@RateLimit(category)`. */
function categoryThrottler(name: RateLimitCategory, limit: number): ThrottlerOptions {
  return { name, ttl: MINUTE_MS, limit, skipIf: (context) => categoryOf(context) !== name };
}

/**
 * Per-IP limits (requirement 16.3), all configurable through env and answered with 429:
 * - `default`: every route.
 * - `login`, `public-write`, `upload`: extra, stricter limits for the tagged routes.
 * The login route additionally has a per IP+account limit and account lockout (AuthService).
 * Storage is in memory (single API instance, ADR 0001).
 */
export function rateLimitOptions(
  env: Pick<
    Env,
    | 'TRUST_CLOUDFLARE'
    | 'RATE_LIMIT_DEFAULT_PER_MINUTE'
    | 'RATE_LIMIT_LOGIN_PER_MINUTE'
    | 'RATE_LIMIT_PUBLIC_WRITE_PER_MINUTE'
    | 'RATE_LIMIT_UPLOAD_PER_MINUTE'
  >,
): ThrottlerModuleOptions {
  return {
    throttlers: [
      { name: 'default', ttl: MINUTE_MS, limit: env.RATE_LIMIT_DEFAULT_PER_MINUTE },
      categoryThrottler('login', env.RATE_LIMIT_LOGIN_PER_MINUTE),
      categoryThrottler('public-write', env.RATE_LIMIT_PUBLIC_WRITE_PER_MINUTE),
      categoryThrottler('upload', env.RATE_LIMIT_UPLOAD_PER_MINUTE),
    ],
    getTracker: (req) => clientIp(req as FastifyRequest, env.TRUST_CLOUDFLARE),
    errorMessage: 'Too many requests. Try again later.',
  };
}
