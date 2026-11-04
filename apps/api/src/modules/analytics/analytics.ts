import { Injectable, Module } from '@nestjs/common';
import { SOCIAL_PLATFORMS, type AnalyticsEventInput, type ConsentInput } from '@hotel-bambu/shared';
import { PrismaService } from '../../prisma/prisma.service.js';

const HOTEL_TIME_ZONE = 'America/Bogota';
const SOCIAL_KEYS = new Set(SOCIAL_PLATFORMS.map((platform) => platform.toLowerCase()));

/** Calendar day in the hotel's time zone, as a UTC midnight Date for the `@db.Date` column. */
export function hotelDay(now: Date): Date {
  const day = new Intl.DateTimeFormat('en-CA', {
    timeZone: HOTEL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  return new Date(`${day}T00:00:00.000Z`);
}

/**
 * Aggregated interaction counter (requirement 11.2): one row per day/type/source/entity, no
 * per-visitor data, no IP, no user agent. Consent is enforced by the web before sending.
 */
@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Only known entities are kept (published room slug or social platform key), so arbitrary ids cannot bloat the table. */
  private async normalizeEntity(entityId: string | undefined): Promise<string> {
    if (!entityId) return '';
    if (SOCIAL_KEYS.has(entityId)) return entityId;
    const room = await this.prisma.room.findFirst({
      where: { slug: entityId, status: 'PUBLISHED' },
      select: { id: true },
    });
    return room ? entityId : '';
  }

  async track(event: AnalyticsEventInput, now = new Date()): Promise<void> {
    const entityId = await this.normalizeEntity(event.entityId);
    const key = { date: hotelDay(now), type: event.type, source: event.source ?? '', entityId };
    await this.prisma.analyticsDailyCount.upsert({
      where: { date_type_source_entityId: key },
      create: { ...key, count: 1 },
      update: { count: { increment: 1 } },
    });
  }

  async summary(days: number, now = new Date()) {
    const since = new Date(hotelDay(now).getTime() - (days - 1) * 86_400_000);
    const rows = await this.prisma.analyticsDailyCount.groupBy({
      by: ['type', 'source'],
      where: { date: { gte: since } },
      _sum: { count: true },
      orderBy: { type: 'asc' },
    });
    return {
      since: since.toISOString().slice(0, 10),
      days,
      totals: rows.map((row) => ({
        type: row.type,
        source: row.source,
        count: row._sum.count ?? 0,
      })),
    };
  }

  /** Consent evidence (17.5.9): random id, categories, policy version, timestamp. No IP. */
  async recordConsent(input: ConsentInput, now = new Date()): Promise<void> {
    await this.prisma.consentRecord.upsert({
      where: { consentId: input.consentId },
      create: { ...input, createdAt: now },
      update: { categories: input.categories, policyVersion: input.policyVersion, createdAt: now },
    });
  }
}

@Module({
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
