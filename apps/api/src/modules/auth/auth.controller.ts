import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  changePasswordSchema,
  loginSchema,
  type AuthSessionResponse,
  type ChangePasswordInput,
  type LoginInput,
} from '@hotel-bambu/shared';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { isCookieSecure, type Env } from '../../config/env.js';
import {
  type AuthenticatedAdmin,
  type AuthenticatedSession,
  CurrentAdmin,
  Public,
  RateLimit,
  clientIp,
} from '../../common/request-context.js';
import { zod } from '../../common/zod-validation.pipe.js';
import { AuditService } from '../audit/audit.service.js';
import { clearAuthCookies, readSessionToken, setAuthCookies } from './auth-cookies.js';
import { AuthService } from './auth.service.js';
import { csrfTokenFor } from './session-token.js';
import { SessionService, type ClientMeta } from './session.service.js';

@Controller('auth')
export class AuthController {
  private readonly secure: boolean;
  private readonly secret: string;
  private readonly trustCloudflare: boolean;

  constructor(
    private readonly auth: AuthService,
    private readonly sessions: SessionService,
    private readonly audit: AuditService,
    config: ConfigService<Env, true>,
  ) {
    this.secure = isCookieSecure({
      NODE_ENV: config.get('NODE_ENV', { infer: true }),
      COOKIE_SECURE: config.get('COOKIE_SECURE', { infer: true }),
    });
    this.secret = config.get('SESSION_SECRET', { infer: true });
    this.trustCloudflare = config.get('TRUST_CLOUDFLARE', { infer: true });
  }

  private meta(request: FastifyRequest): ClientMeta {
    return {
      ip: clientIp(request, this.trustCloudflare),
      userAgent: request.headers['user-agent'],
    };
  }

  private respond(
    reply: FastifyReply,
    token: string,
    session: AuthenticatedSession,
    admin: AuthenticatedAdmin,
  ): AuthSessionResponse {
    const csrfToken = csrfTokenFor(this.secret, session.id);
    const maxAge = Math.max(1, Math.floor((session.expiresAt.getTime() - Date.now()) / 1000));
    setAuthCookies(reply, this.secure, token, csrfToken, maxAge);
    return { user: admin, csrfToken, expiresAt: session.expiresAt.toISOString() };
  }

  @Public()
  @RateLimit('login')
  @Post('login')
  @HttpCode(200)
  async login(
    @Body(zod(loginSchema)) body: LoginInput,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AuthSessionResponse> {
    const result = await this.auth.login(body, this.meta(request));
    // Rotation: a session presented with the login request is discarded (fixation defence).
    const previous = readSessionToken(request, this.secure);
    if (previous) await this.sessions.revokeToken(previous);
    return this.respond(reply, result.token, result.session, result.admin);
  }

  @Post('logout')
  @HttpCode(204)
  async logout(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    if (request.authSession) await this.sessions.revokeById(request.authSession.id);
    clearAuthCookies(reply, this.secure);
    await this.audit.record(admin.id, {
      action: 'auth.logout',
      entity: 'AdminUser',
      entityId: admin.id,
    });
  }

  @Get('me')
  me(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Req() request: FastifyRequest,
  ): AuthSessionResponse {
    const session = request.authSession as AuthenticatedSession;
    return {
      user: admin,
      csrfToken: csrfTokenFor(this.secret, session.id),
      expiresAt: session.expiresAt.toISOString(),
    };
  }

  @Post('change-password')
  @HttpCode(200)
  async changePassword(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Body(zod(changePasswordSchema)) body: ChangePasswordInput,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AuthSessionResponse> {
    const { token, session } = await this.auth.changePassword(admin, body, this.meta(request));
    return this.respond(reply, token, session, admin);
  }
}
