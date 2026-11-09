import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  Injectable,
  Module,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  ADMIN_USER_ERRORS,
  adminUserCreateSchema,
  adminUserPasswordResetSchema,
  adminUserUpdateSchema,
  type AdminUserCreateInput,
  type AdminUserErrorCode,
  type AdminUserPasswordResetInput,
  type AdminUserUpdateInput,
} from '@hotel-bambu/shared';
import {
  type AuthenticatedAdmin,
  CurrentAdmin,
  RequirePermission,
} from '../../common/request-context.js';
import { zod } from '../../common/zod-validation.pipe.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuditService, changedFields } from '../audit/audit.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { PASSWORD_POLICY_MESSAGES, checkPasswordPolicy, hashPassword } from '../auth/password.js';
import { SessionService } from '../auth/session.service.js';

/** `{ message, code }` body for the documented users/roles errors (shared `ADMIN_USER_ERRORS`). */
export function adminUserError(code: AdminUserErrorCode) {
  return { message: ADMIN_USER_ERRORS[code], code };
}

/** List item: never the password hash, lockout counters or sessions. */
const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  active: true,
  lastLoginAt: true,
  createdAt: true,
  role: { select: { id: true, name: true, isSystem: true } },
} satisfies Prisma.AdminUserSelect;

function assertPasswordPolicy(password: string, email: string): void {
  const violations = checkPasswordPolicy(password, email);
  if (violations.length > 0) {
    throw new UnprocessableEntityException({
      message: 'Password does not meet the policy.',
      details: violations.map((v) => ({
        path: 'password',
        message: PASSWORD_POLICY_MESSAGES[v],
        code: v,
      })),
    });
  }
}

/**
 * Admin users (feature admin-users-roles). No hard delete: users are deactivated. Protections:
 * nobody changes their own role or deactivates themselves, and at least one active user keeps the
 * system role. Role change, deactivation and password reset end every session of that user.
 */
@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: SessionService,
    private readonly audit: AuditService,
  ) {}

  list() {
    return this.prisma.adminUser.findMany({ orderBy: { createdAt: 'asc' }, select: USER_SELECT });
  }

  async create(actorId: string, input: AdminUserCreateInput) {
    assertPasswordPolicy(input.password, input.email);
    const role = await this.prisma.role.findUnique({
      where: { id: input.roleId },
      select: { id: true },
    });
    if (!role) throw new UnprocessableEntityException(adminUserError('ROLE_NOT_FOUND'));
    const taken = await this.prisma.adminUser.findUnique({
      where: { email: input.email },
      select: { id: true },
    });
    if (taken) throw new ConflictException(adminUserError('EMAIL_TAKEN'));

    const created = await this.prisma.adminUser.create({
      data: {
        email: input.email,
        name: input.name ?? null,
        roleId: role.id,
        passwordHash: await hashPassword(input.password),
      },
      select: USER_SELECT,
    });
    await this.audit.record(actorId, {
      action: 'adminUser.create',
      entity: 'AdminUser',
      entityId: created.id,
      summary: { fields: changedFields(input), roleId: role.id },
    });
    return created;
  }

  async update(actor: AuthenticatedAdmin, id: string, input: AdminUserUpdateInput) {
    const { user, endSessions } = await this.prisma.$transaction(async (tx) => {
      // Serializes concurrent changes that could leave no active Administrador.
      await tx.$queryRaw`SELECT id FROM "Role" WHERE "isSystem" FOR UPDATE`;
      const current = await tx.adminUser.findUnique({
        where: { id },
        select: { id: true, active: true, roleId: true, role: { select: { isSystem: true } } },
      });
      if (!current) throw new NotFoundException('Admin user not found.');

      const roleChanged = input.roleId !== undefined && input.roleId !== current.roleId;
      const deactivating = input.active === false && current.active;
      if (id === actor.id && roleChanged) {
        throw new UnprocessableEntityException(adminUserError('SELF_ROLE_CHANGE'));
      }
      if (id === actor.id && deactivating) {
        throw new UnprocessableEntityException(adminUserError('SELF_DEACTIVATION'));
      }

      let nextRoleIsSystem = current.role.isSystem;
      if (roleChanged) {
        const role = await tx.role.findUnique({
          where: { id: input.roleId },
          select: { isSystem: true },
        });
        if (!role) throw new UnprocessableEntityException(adminUserError('ROLE_NOT_FOUND'));
        nextRoleIsSystem = role.isSystem;
      }

      const losesAdministrador =
        current.role.isSystem && current.active && (deactivating || !nextRoleIsSystem);
      if (losesAdministrador) {
        const others = await tx.adminUser.count({
          where: { id: { not: id }, active: true, role: { isSystem: true } },
        });
        if (others === 0) throw new ConflictException(adminUserError('LAST_ADMINISTRATOR'));
      }

      const updated = await tx.adminUser.update({
        where: { id },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.roleId !== undefined ? { roleId: input.roleId } : {}),
          ...(input.active !== undefined ? { active: input.active } : {}),
        },
        select: USER_SELECT,
      });
      return { user: updated, endSessions: roleChanged || deactivating };
    });

    if (endSessions) await this.sessions.revokeAllForUser(id);
    await this.audit.record(actor.id, {
      action: 'adminUser.update',
      entity: 'AdminUser',
      entityId: id,
      summary: { fields: changedFields(input), sessionsRevoked: endSessions },
    });
    return user;
  }

  /** New password per policy; unlocks the account and ends every session of that user. */
  async resetPassword(actorId: string, id: string, input: AdminUserPasswordResetInput) {
    const user = await this.prisma.adminUser.findUnique({ where: { id }, select: { email: true } });
    if (!user) throw new NotFoundException('Admin user not found.');
    assertPasswordPolicy(input.password, user.email);

    await this.prisma.adminUser.update({
      where: { id },
      data: {
        passwordHash: await hashPassword(input.password),
        passwordChangedAt: new Date(),
        failedAttempts: 0,
        lockedUntil: null,
      },
    });
    await this.sessions.revokeAllForUser(id);
    await this.audit.record(actorId, {
      action: 'adminUser.resetPassword',
      entity: 'AdminUser',
      entityId: id,
    });
  }
}

@RequirePermission('users.view')
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly users: AdminUsersService) {}

  @Get()
  list() {
    return this.users.list();
  }

  @RequirePermission('users.manage')
  @Post()
  create(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Body(zod(adminUserCreateSchema)) body: AdminUserCreateInput,
  ) {
    return this.users.create(admin.id, body);
  }

  @RequirePermission('users.manage')
  @Patch(':id')
  update(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(zod(adminUserUpdateSchema)) body: AdminUserUpdateInput,
  ) {
    return this.users.update(admin, id, body);
  }

  @RequirePermission('users.manage')
  @Post(':id/reset-password')
  @HttpCode(204)
  async resetPassword(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(zod(adminUserPasswordResetSchema)) body: AdminUserPasswordResetInput,
  ) {
    await this.users.resetPassword(admin.id, id, body);
  }
}

@Module({
  imports: [AuthModule],
  controllers: [AdminUsersController],
  providers: [AdminUsersService],
})
export class AdminUsersModule {}
