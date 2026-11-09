import { createParamDecorator, type ExecutionContext, SetMetadata } from '@nestjs/common';
import type { AuthUser, Permission } from '@hotel-bambu/shared';
import type { FastifyRequest } from 'fastify';

/** Signed-in admin with role and effective permissions (shared `AuthUser`, `GET /auth/me`). */
export type AuthenticatedAdmin = AuthUser;

export interface AuthenticatedSession {
  id: string;
  expiresAt: Date;
}

declare module 'fastify' {
  interface FastifyRequest {
    /** Set by SessionAuthGuard on authenticated requests. */
    admin?: AuthenticatedAdmin;
    authSession?: AuthenticatedSession;
  }
}

export const IS_PUBLIC_KEY = 'auth:isPublic';

/**
 * Marks a controller or handler as reachable without a session. Every other route requires an
 * authenticated admin (deny by default, SessionAuthGuard).
 */
export const Public = (): ClassDecorator & MethodDecorator => SetMetadata(IS_PUBLIC_KEY, true);

export const PERMISSIONS_KEY = 'auth:permissions';
export const AUTHENTICATED_ONLY_KEY = 'auth:authenticatedOnly';

/**
 * Permissions a route needs, any of them (PermissionGuard). Handler metadata overrides class
 * metadata. Non-public routes without it are denied (fail closed).
 */
export const RequirePermission = (
  ...anyOf: [Permission, ...Permission[]]
): ClassDecorator & MethodDecorator => SetMetadata(PERMISSIONS_KEY, anyOf);

/**
 * Routes every signed-in admin may use whatever the role (own session, account and password).
 * Still requires a session; only the permission check is skipped.
 */
export const AuthenticatedOnly = (): ClassDecorator & MethodDecorator =>
  SetMetadata(AUTHENTICATED_ONLY_KEY, true);

/** The authenticated admin of the current request (only on non-public routes). */
export const CurrentAdmin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedAdmin => {
    const admin = ctx.switchToHttp().getRequest<FastifyRequest>().admin;
    if (!admin) throw new Error('CurrentAdmin used on a route without SessionAuthGuard');
    return admin;
  },
);

export type RateLimitCategory = 'login' | 'public-write' | 'upload';
export const RATE_LIMIT_CATEGORY_KEY = 'rateLimit:category';

/** Adds a stricter per-IP limit on top of the default one (see ThrottlerModule config). */
export const RateLimit = (category: RateLimitCategory): MethodDecorator =>
  SetMetadata(RATE_LIMIT_CATEGORY_KEY, category);

/**
 * Client IP. Fastify resolves `request.ip` from X-Forwarded-For according to `trustProxy`.
 * `CF-Connecting-IP` is only honoured when TRUST_CLOUDFLARE=true, which is safe only if the origin
 * accepts traffic exclusively from Cloudflare (docs/configuration.md).
 */
export function clientIp(request: FastifyRequest, trustCloudflare: boolean): string {
  if (trustCloudflare) {
    const header = request.headers['cf-connecting-ip'];
    const value = Array.isArray(header) ? header[0] : header;
    if (value && /^[0-9a-fA-F:.]{2,45}$/.test(value)) return value;
  }
  return request.ip;
}
