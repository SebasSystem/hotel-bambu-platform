import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { hasAnyPermission, type Permission } from '@hotel-bambu/shared';
import type { FastifyRequest } from 'fastify';
import {
  AUTHENTICATED_ONLY_KEY,
  IS_PUBLIC_KEY,
  PERMISSIONS_KEY,
} from '../../common/request-context.js';

export const PERMISSION_DENIED_MESSAGE = 'You do not have permission to perform this action.';

/**
 * Role-based authorization, registered globally right after SessionAuthGuard (which resolves
 * `request.admin` with its effective permissions on every request):
 * 1. `@Public()` and `@AuthenticatedOnly()` routes skip the check.
 * 2. Other routes need `@RequirePermission(...)` (any of); no metadata means 403 (fail closed).
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'http') return true;
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets)) return true;
    if (this.reflector.getAllAndOverride<boolean>(AUTHENTICATED_ONLY_KEY, targets)) return true;

    const required = this.reflector.getAllAndOverride<Permission[] | undefined>(
      PERMISSIONS_KEY,
      targets,
    );
    const admin = context.switchToHttp().getRequest<FastifyRequest>().admin;
    if (!required?.length || !admin || !hasAnyPermission(admin.permissions, required)) {
      throw new ForbiddenException({
        message: PERMISSION_DENIED_MESSAGE,
        code: 'PERMISSION_DENIED',
      });
    }
    return true;
  }
}
