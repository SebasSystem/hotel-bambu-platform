import { Controller, Get, Injectable, Module, Query } from '@nestjs/common';
import { z } from 'zod';
import { zod } from '../../common/zod-validation.pipe.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AnalyticsModule, AnalyticsService } from '../analytics/analytics.js';
import { AuditService } from '../audit/audit.service.js';

/** Admin dashboard (requirement 9.2): content status only, never bookings or revenue. */
@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analytics: AnalyticsService,
  ) {}

  async summary(now = new Date()) {
    const [
      roomsByStatus,
      activeServices,
      activePromotions,
      mediaMissingAlt,
      publishedRoomsWithoutPrice,
      roomsWithoutCover,
      lastChange,
      analytics,
    ] = await Promise.all([
      this.prisma.room.groupBy({
        by: ['status'],
        _count: { _all: true },
        orderBy: { status: 'asc' },
      }),
      this.prisma.service.count({ where: { active: true } }),
      this.prisma.promotion.count({
        where: { status: 'PUBLISHED', startsAt: { lte: now }, endsAt: { gt: now } },
      }),
      this.prisma.mediaAsset.count({ where: { OR: [{ altText: null }, { altText: '' }] } }),
      this.prisma.room.count({ where: { status: 'PUBLISHED', basePrice: null } }),
      this.prisma.room.count({ where: { images: { none: { isCover: true } } } }),
      this.prisma.auditLog.findFirst({
        where: { adminUserId: { not: null }, action: { notIn: ['auth.login', 'auth.logout'] } },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true, action: true, entity: true },
      }),
      this.analytics.summary(30, now),
    ]);
    return {
      rooms: Object.fromEntries(roomsByStatus.map((row) => [row.status, row._count._all])),
      activeServices,
      activePromotions,
      lastChange,
      incomplete: { mediaMissingAlt, publishedRoomsWithoutPrice, roomsWithoutCover },
      analytics,
    };
  }
}

const pageSchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});
const daysSchema = z.object({ days: z.coerce.number().int().min(1).max(730).default(30) });

@Controller('admin')
export class DashboardController {
  constructor(
    private readonly dashboard: DashboardService,
    private readonly audit: AuditService,
    private readonly analytics: AnalyticsService,
  ) {}

  @Get('dashboard')
  summary() {
    return this.dashboard.summary();
  }

  @Get('analytics/summary')
  analyticsSummary(@Query(zod(daysSchema)) query: z.output<typeof daysSchema>) {
    return this.analytics.summary(query.days);
  }

  @Get('audit-logs')
  auditLogs(@Query(zod(pageSchema)) query: z.output<typeof pageSchema>) {
    return this.audit.list(query.page, query.pageSize);
  }
}

@Module({
  imports: [AnalyticsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
