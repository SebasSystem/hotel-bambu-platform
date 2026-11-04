import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { CSRF_HEADER_NAME } from '@hotel-bambu/shared';
import type { FastifyRequest } from 'fastify';
import { isCookieSecure, type Env } from '../../config/env.js';
import { IS_PUBLIC_KEY } from '../../common/request-context.js';
import { readSessionToken } from './auth-cookies.js';
import { evaluateCsrf } from './csrf.js';
import { SessionService } from './session.service.js';

function header(request: FastifyRequest, name: string): string | undefined {
  const value = request.headers[name];
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Global guard, deny by default (requirement 12.5: auth with Guards, not middleware).
 * 1. Routes need a valid session unless marked @Public() → 401. Sets `request.admin`/`authSession`.
 * 2. CSRF (csrf.ts) on unsafe methods: origin check for every route, plus the session-bound token
 *    for authenticated ones → 403.
 * Both live in one guard so the CSRF check can never run before the session is resolved.
 */
@Injectable()
export class SessionAuthGuard implements CanActivate {
  private readonly secure: boolean;
  private readonly secret: string;
  private readonly allowedOrigins: readonly string[];

  constructor(
    private readonly reflector: Reflector,
    private readonly sessions: SessionService,
    config: ConfigService<Env, true>,
  ) {
    this.secure = isCookieSecure({
      NODE_ENV: config.get('NODE_ENV', { infer: true }),
      COOKIE_SECURE: config.get('COOKIE_SECURE', { infer: true }),
    });
    this.secret = config.get('SESSION_SECRET', { infer: true });
    this.allowedOrigins = config.get('WEB_ORIGINS', { infer: true });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') return true;
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isPublic) {
      const token = readSessionToken(request, this.secure);
      const resolved = token ? await this.sessions.resolve(token) : null;
      if (!resolved) throw new UnauthorizedException('Authentication required.');
      request.admin = resolved.admin;
      request.authSession = resolved.session;
    }

    const decision = evaluateCsrf({
      method: request.method,
      origin: header(request, 'origin'),
      fetchSite: header(request, 'sec-fetch-site'),
      allowedOrigins: this.allowedOrigins,
      sessionId: request.authSession?.id,
      token: header(request, CSRF_HEADER_NAME),
      secret: this.secret,
    });
    if (!decision.ok) {
      throw new ForbiddenException(
        decision.reason === 'token'
          ? 'Invalid or missing CSRF token.'
          : 'Cross-site request rejected.',
      );
    }
    return true;
  }
}
