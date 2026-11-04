import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

export interface AuditEntry {
  /** `<entity>.<verb>`, e.g. `room.update`, `media.delete`, `auth.login`. */
  action: string;
  entity: string;
  entityId?: string | null;
  summary?: Prisma.InputJsonObject;
}

/** Keys whose values must never reach the audit log, even by mistake. */
const SECRET_KEY_PATTERN = /password|token|secret|hash|cookie/i;

/**
 * Diff summary for the audit log: names of the fields that were sent, never their values (values
 * may contain personal data; requirement 10/22). Secret-looking keys are dropped.
 */
export function changedFields(input: object): string[] {
  return Object.keys(input)
    .filter((key) => !SECRET_KEY_PATTERN.test(key))
    .sort();
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Never throws: a failed audit write is logged, the admin request still succeeds. */
  async record(actorId: string | null, entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          adminUserId: actorId,
          action: entry.action,
          entity: entry.entity,
          entityId: entry.entityId ?? null,
          summary: entry.summary ?? undefined,
        },
      });
    } catch (error) {
      this.logger.error({ err: error, action: entry.action }, 'Audit log write failed');
    }
  }

  async list(page: number, pageSize: number) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { adminUser: { select: { email: true, name: true } } },
      }),
      this.prisma.auditLog.count(),
    ]);
    return { items, total, page, pageSize };
  }
}
