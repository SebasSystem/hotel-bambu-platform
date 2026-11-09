import 'reflect-metadata';
import { Controller, ForbiddenException, Get, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Permission } from '@hotel-bambu/shared';
import { describe, expect, it } from 'vitest';
import { AuthenticatedOnly, Public, RequirePermission } from '../../common/request-context.js';
import { PermissionGuard } from './permission.guard.js';

@Controller('test')
@RequirePermission('rooms.view')
class AnnotatedController {
  @Get()
  list() {}

  @Get('write')
  @RequirePermission('rooms.manage')
  write() {}

  @Get('picker')
  @RequirePermission('media.view', 'content.manage')
  picker() {}
}

@Controller('bare')
class BareController {
  @Get()
  list() {}
}

@Public()
@Controller('open')
class PublicController {
  @Get()
  list() {}
}

@AuthenticatedOnly()
@Controller('me')
class AccountController {
  @Get()
  me() {}
}

function context(
  target: object,
  handler: string,
  permissions: Permission[] | null,
  type: 'http' | 'rpc' = 'http',
): ExecutionContext {
  const request = permissions ? { admin: { permissions } } : {};
  return {
    getType: () => type,
    getClass: () => target,
    getHandler: () => (target as { prototype: Record<string, unknown> }).prototype[handler],
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

const guard = new PermissionGuard(new Reflector());

describe('PermissionGuard', () => {
  it('allows when the admin holds the class-level permission (manage implies view)', () => {
    expect(guard.canActivate(context(AnnotatedController, 'list', ['rooms.view']))).toBe(true);
    expect(guard.canActivate(context(AnnotatedController, 'list', ['rooms.manage']))).toBe(true);
  });

  it('lets the handler metadata override the class metadata', () => {
    expect(() => guard.canActivate(context(AnnotatedController, 'write', ['rooms.view']))).toThrow(
      ForbiddenException,
    );
    expect(guard.canActivate(context(AnnotatedController, 'write', ['rooms.manage']))).toBe(true);
  });

  it('accepts any of the listed permissions', () => {
    expect(guard.canActivate(context(AnnotatedController, 'picker', ['content.manage']))).toBe(
      true,
    );
    expect(() =>
      guard.canActivate(context(AnnotatedController, 'picker', ['content.view'])),
    ).toThrow(ForbiddenException);
  });

  it('denies routes without permission metadata (fail closed)', () => {
    expect(() =>
      guard.canActivate(context(BareController, 'list', ['users.manage', 'rooms.manage'])),
    ).toThrow(ForbiddenException);
  });

  it('denies when no admin was resolved on a protected route', () => {
    expect(() => guard.canActivate(context(AnnotatedController, 'list', null))).toThrow(
      ForbiddenException,
    );
  });

  it('skips public routes, authenticated-only routes and non-HTTP contexts', () => {
    expect(guard.canActivate(context(PublicController, 'list', null))).toBe(true);
    expect(guard.canActivate(context(AccountController, 'me', []))).toBe(true);
    expect(guard.canActivate(context(BareController, 'list', null, 'rpc'))).toBe(true);
  });

  it('answers with a constant message and a machine-readable code', () => {
    try {
      guard.canActivate(context(AnnotatedController, 'write', []));
      expect.unreachable();
    } catch (error) {
      expect((error as ForbiddenException).getResponse()).toEqual({
        message: 'You do not have permission to perform this action.',
        code: 'PERMISSION_DENIED',
      });
    }
  });
});
