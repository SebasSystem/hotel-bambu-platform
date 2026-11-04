import { Global, Injectable, Module } from '@nestjs/common';
import { RevalidationService } from '../revalidation/revalidation.service.js';
import { AuditService, type AuditEntry } from './audit.service.js';

/**
 * Single post-mutation hook for admin services: audit log entry (requirement 10) + Next.js cache
 * revalidation of the affected tags (requirement 21). Call it after the change is committed.
 */
@Injectable()
export class AdminChangesService {
  constructor(
    private readonly audit: AuditService,
    private readonly revalidation: RevalidationService,
  ) {}

  async record(actorId: string, entry: AuditEntry, tags: readonly string[] = []): Promise<void> {
    await this.audit.record(actorId, entry);
    this.revalidation.revalidate(tags);
  }
}

@Global()
@Module({
  providers: [AuditService, RevalidationService, AdminChangesService],
  exports: [AuditService, RevalidationService, AdminChangesService],
})
export class AuditModule {}
