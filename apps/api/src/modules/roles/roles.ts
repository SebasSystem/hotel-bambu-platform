import {
  Body,
  ConflictException,
  Controller,
  Delete,
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
  roleCreateSchema,
  roleUpdateSchema,
  type RoleCreateInput,
  type RoleUpdateInput,
} from '@hotel-bambu/shared';
import {
  type AuthenticatedAdmin,
  CurrentAdmin,
  RequirePermission,
} from '../../common/request-context.js';
import { zod } from '../../common/zod-validation.pipe.js';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { adminUserError } from '../admin-users/admin-users.js';
import { AuditService, changedFields } from '../audit/audit.service.js';

const ROLE_INCLUDE = { _count: { select: { users: true } } } satisfies Prisma.RoleInclude;

type RoleRow = Prisma.RoleGetPayload<{ include: typeof ROLE_INCLUDE }>;

/** Serialized as the shared `AdminRoleSummary` (dates become ISO strings). */
function toSummary({ _count, ...role }: RoleRow) {
  return { ...role, userCount: _count.users };
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

/**
 * Admin roles (feature admin-users-roles). Permission edits apply on the next request of every
 * user of the role (sessions load the role per request), so no session is revoked here. The system
 * role cannot be edited or deleted; a role with users cannot be deleted.
 */
@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list() {
    const roles = await this.prisma.role.findMany({
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
      include: ROLE_INCLUDE,
    });
    return roles.map(toSummary);
  }

  async create(actorId: string, input: RoleCreateInput) {
    try {
      const role = await this.prisma.role.create({
        data: {
          name: input.name,
          description: input.description ?? null,
          permissions: input.permissions,
        },
        include: ROLE_INCLUDE,
      });
      await this.audit.record(actorId, {
        action: 'role.create',
        entity: 'Role',
        entityId: role.id,
        summary: { fields: changedFields(input), permissions: role.permissions },
      });
      return toSummary(role);
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException(adminUserError('ROLE_NAME_TAKEN'));
      throw error;
    }
  }

  private async findEditable(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id }, include: ROLE_INCLUDE });
    if (!role) throw new NotFoundException('Role not found.');
    if (role.isSystem) {
      throw new UnprocessableEntityException(adminUserError('SYSTEM_ROLE_IMMUTABLE'));
    }
    return role;
  }

  async update(actorId: string, id: string, input: RoleUpdateInput) {
    await this.findEditable(id);
    try {
      const role = await this.prisma.role.update({
        where: { id },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.permissions !== undefined ? { permissions: input.permissions } : {}),
        },
        include: ROLE_INCLUDE,
      });
      await this.audit.record(actorId, {
        action: 'role.update',
        entity: 'Role',
        entityId: id,
        summary: { fields: changedFields(input), permissions: role.permissions },
      });
      return toSummary(role);
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException(adminUserError('ROLE_NAME_TAKEN'));
      throw error;
    }
  }

  async remove(actorId: string, id: string) {
    const role = await this.findEditable(id);
    if (role._count.users > 0) throw new ConflictException(adminUserError('ROLE_IN_USE'));
    // The foreign key is RESTRICT: a user assigned meanwhile makes this fail with 409 (P2003).
    await this.prisma.role.delete({ where: { id } });
    await this.audit.record(actorId, {
      action: 'role.delete',
      entity: 'Role',
      entityId: id,
      summary: { name: role.name },
    });
  }
}

@RequirePermission('users.view')
@Controller('admin/roles')
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @Get()
  list() {
    return this.roles.list();
  }

  @RequirePermission('users.manage')
  @Post()
  create(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Body(zod(roleCreateSchema)) body: RoleCreateInput,
  ) {
    return this.roles.create(admin.id, body);
  }

  @RequirePermission('users.manage')
  @Patch(':id')
  update(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(zod(roleUpdateSchema)) body: RoleUpdateInput,
  ) {
    return this.roles.update(admin.id, id, body);
  }

  @RequirePermission('users.manage')
  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentAdmin() admin: AuthenticatedAdmin, @Param('id', ParseUUIDPipe) id: string) {
    await this.roles.remove(admin.id, id);
  }
}

@Module({
  controllers: [RolesController],
  providers: [RolesService],
})
export class RolesModule {}
