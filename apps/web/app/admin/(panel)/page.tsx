import { ArrowRight, Check, History } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { hasAnyPermission, hasPermission, type Permission } from '@hotel-bambu/shared';
import { Card, CardHeader, Notice, PageHeader, cx } from '@/components/admin/ui';
import { canAccess } from '@/lib/admin/access';
import { collapseActivity, describeAction, timeAgo } from '@/lib/admin/activity';
import {
  EMPTY_READINESS_HOTEL,
  publishChecklist,
  readinessKpis,
  type ChecklistItem,
  type Kpi,
} from '@/lib/admin/readiness';
import { requirePermission } from '@/lib/admin/session';
import { serverApi } from '@/lib/api/server';
import type {
  AuditLogEntry,
  DashboardSummary,
  Faq,
  HeroSlide,
  HotelProfile,
  MediaAsset,
  NearbyPlace,
  Paginated,
  Policy,
  RoomType,
  SocialLink,
} from '@/lib/api/types';

export const metadata: Metadata = { title: 'Resumen' };

const EVENT_LABELS: Record<string, string> = {
  PAGE_VIEW: 'Visitas a páginas',
  WHATSAPP_CLICK: 'Clics en WhatsApp',
  ROOM_VIEW: 'Vistas de habitaciones',
  MAP_CLICK: 'Clics en el mapa',
  SOCIAL_CLICK: 'Clics en redes sociales',
};

function greeting(now: Date): string {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hourCycle: 'h23',
      timeZone: 'America/Bogota',
    }).format(now),
  );
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function KpiCard({ kpi }: { kpi: Kpi }) {
  return (
    <Link
      href={kpi.href}
      className="group flex flex-col rounded-2xl border border-line bg-white p-4 transition-colors hover:border-green tab:p-5"
    >
      <span className="text-[0.8125rem] text-muted-foreground">{kpi.label}</span>
      <span className="mt-2 text-[1.3rem] leading-none font-bold tracking-[-0.02em] tabular-nums xs:text-[1.6rem] tab:text-[2rem]">
        {kpi.value}
      </span>
      <span
        className={cx(
          'mt-2.5 inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold',
          kpi.done ? 'text-green' : 'text-warn-fg',
        )}
      >
        <span
          aria-hidden="true"
          className={cx('size-2 shrink-0 rounded-full', kpi.done ? 'bg-green' : 'bg-gold')}
        />
        {kpi.note}
      </span>
    </Link>
  );
}

function ChecklistRow({ item }: { item: ChecklistItem }) {
  return (
    <li>
      <Link
        href={item.href}
        className={cx(
          'group flex items-start gap-3 rounded-sm p-3.5 transition-colors',
          item.done ? 'bg-white hover:bg-ivory' : 'bg-ivory hover:bg-sand/60',
        )}
      >
        {item.done ? (
          <span className="mt-0.5 inline-flex size-[18px] shrink-0 items-center justify-center rounded-full bg-green text-white">
            <Check aria-hidden="true" className="size-3" strokeWidth={3} />
          </span>
        ) : (
          <span
            aria-hidden="true"
            className="mt-[5px] ml-[4.5px] size-[9px] shrink-0 rounded-full bg-gold"
          />
        )}
        <span className="min-w-0 flex-1">
          <span
            className={cx(
              'block text-[0.875rem] leading-snug font-bold',
              item.done && 'text-muted-foreground',
            )}
          >
            {item.title}
            <span className="sr-only">{item.done ? ' (listo)' : ' (pendiente)'}</span>
          </span>
          <span className="mt-0.5 block text-[0.8125rem] leading-snug text-muted-foreground">
            {item.note}
          </span>
        </span>
        <ArrowRight
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-ink-muted opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
        />
      </Link>
    </li>
  );
}

/** Resolves to `fallback` without calling the API when the role may not read the endpoint. */
function readIf<T>(allowed: boolean, read: () => Promise<T>, fallback: T): Promise<T> {
  return allowed ? read() : Promise.resolve(fallback);
}

const MEDIA_READERS: readonly Permission[] = [
  'media.view',
  'hotel.manage',
  'rooms.manage',
  'content.manage',
];

/**
 * Content status only — never bookings, occupancy or revenue (requirement 9.2, owner Q4). Each
 * widget is fetched and shown only with its permission (ADR 0017): readiness items and KPIs per
 * area (they link to that area's page), recent activity and visit metrics with `activity.view`.
 */
export default async function DashboardPage() {
  // The landing page after login: a role without the dashboard goes to its first section quietly.
  const session = await requirePermission('dashboard.view', { notice: false });
  const permissions = session.user.permissions;
  const can = {
    hotel: hasPermission(permissions, 'hotel.view'),
    rooms: hasPermission(permissions, 'rooms.view'),
    content: hasPermission(permissions, 'content.view'),
    media: hasAnyPermission(permissions, MEDIA_READERS),
    activity: hasPermission(permissions, 'activity.view'),
  };
  const emptyPage = { items: [], total: 0, page: 1, pageSize: 1 };

  const [
    summary,
    hotel,
    roomTypes,
    heroSlides,
    nearbyPlaces,
    policies,
    faqs,
    socialLinks,
    media,
    audit,
  ] = await Promise.all([
    serverApi.get<DashboardSummary>('/admin/dashboard'),
    readIf(can.hotel, () => serverApi.get<HotelProfile>('/admin/hotel'), EMPTY_READINESS_HOTEL),
    readIf(can.rooms, () => serverApi.get<RoomType[]>('/admin/room-types'), []),
    readIf(can.content, () => serverApi.get<HeroSlide[]>('/admin/hero-slides'), []),
    readIf(can.hotel, () => serverApi.get<NearbyPlace[]>('/admin/nearby-places'), []),
    readIf(can.content, () => serverApi.get<Policy[]>('/admin/policies'), []),
    readIf(can.content, () => serverApi.get<Faq[]>('/admin/faq'), []),
    readIf(can.hotel, () => serverApi.get<SocialLink[]>('/admin/social-links'), []),
    readIf<Paginated<MediaAsset>>(
      can.media,
      () => serverApi.get('/admin/media', { query: { page: 1, pageSize: 1 } }),
      emptyPage,
    ),
    readIf<Paginated<AuditLogEntry>>(
      can.activity,
      () => serverApi.get('/admin/audit-logs', { query: { page: 1, pageSize: 50 } }),
      emptyPage,
    ),
  ]);

  const data = {
    hotel,
    roomTypes,
    heroSlides,
    nearbyPlaces,
    policies,
    faqs,
    socialLinks,
    media: { total: media.total, missingAlt: summary.incomplete.mediaMissingAlt },
  };
  // Items computed from data the role cannot read are dropped with their links.
  const kpis = readinessKpis(data).filter((kpi) => canAccess(permissions, kpi.href));
  const checklist = publishChecklist(data).filter((item) => canAccess(permissions, item.href));
  const ready = checklist.filter((item) => item.done).length;
  const pending = checklist.filter((item) => !item.done);
  const done = checklist.filter((item) => item.done);

  const now = new Date();
  const activity = collapseActivity(audit.items).slice(0, 6);
  const totals = new Map<string, number>();
  for (const row of summary.analytics.totals) {
    totals.set(row.type, (totals.get(row.type) ?? 0) + row.count);
  }
  const firstName = session.user.name?.split(' ')[0];
  const showChecklist = checklist.length > 0;
  const nothingToShow = kpis.length === 0 && !showChecklist && !can.activity;

  return (
    <>
      <PageHeader
        title="Resumen"
        description={`${greeting(now)}${firstName ? `, ${firstName}` : ''}. Así va el contenido del sitio.`}
      />

      {nothingToShow ? (
        <Notice title="Nada que mostrar todavía">
          Su rol no tiene secciones de contenido con información para este resumen. Use el menú para
          ir a las secciones disponibles.
        </Notice>
      ) : null}

      {kpis.length > 0 ? (
        <section aria-labelledby="kpi-heading" className="mb-[18px]">
          <h2 id="kpi-heading" className="sr-only">
            Estado del contenido
          </h2>
          <ul className="grid grid-cols-2 gap-3 tab:gap-3.5 desk:grid-cols-4">
            {kpis.map((kpi) => (
              <li key={kpi.id} className="grid">
                <KpiCard kpi={kpi} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div
        className={cx(
          'grid items-start gap-[18px]',
          showChecklist && can.activity && 'desk:grid-cols-[minmax(0,1fr)_minmax(320px,400px)]',
        )}
      >
        {showChecklist ? (
          <Card className="desk:order-2">
            <section aria-labelledby="checklist-heading">
              <CardHeader
                id="checklist-heading"
                title="Antes de publicar"
                description="Lo que falta para que el sitio se vea terminado. Cada punto lleva a la sección que lo resuelve."
              />
              <div className="mb-4">
                <p className="flex items-baseline justify-between text-sm">
                  <span className="font-bold">
                    {ready} de {checklist.length} listos
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {Math.round((ready / checklist.length) * 100)} %
                  </span>
                </p>
                <div
                  role="progressbar"
                  aria-label="Avance antes de publicar"
                  aria-valuemin={0}
                  aria-valuemax={checklist.length}
                  aria-valuenow={ready}
                  aria-valuetext={`${ready} de ${checklist.length} listos`}
                  className="mt-2 h-2 overflow-hidden rounded-pill bg-neutral-bg"
                >
                  <div
                    className="h-full rounded-pill bg-green"
                    style={{ width: `${(ready / checklist.length) * 100}%` }}
                  />
                </div>
              </div>
              <ul className="grid gap-2.5">
                {[...pending, ...done].map((item) => (
                  <ChecklistRow key={item.id} item={item} />
                ))}
              </ul>
            </section>
          </Card>
        ) : null}

        {can.activity ? (
          <div className="grid gap-[18px] desk:order-1">
            <Card>
              <section aria-labelledby="activity-heading">
                <CardHeader
                  id="activity-heading"
                  title="Actividad reciente"
                  description="Últimos cambios de contenido hechos en el panel."
                />
                {activity.length === 0 ? (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <History aria-hidden="true" className="size-4" /> Aún no hay cambios
                    registrados.
                  </p>
                ) : (
                  <ol className="divide-y divide-line">
                    {activity.map((entry) => (
                      <li
                        key={entry.id}
                        className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-3 first:pt-0 last:pb-0"
                      >
                        <span className="min-w-0 text-sm font-semibold">
                          {describeAction(entry.action)}
                          {entry.count > 1 ? (
                            <span className="font-normal text-muted-foreground">
                              {' '}
                              · {entry.count} veces
                            </span>
                          ) : null}
                        </span>
                        <span className="text-[0.8125rem] text-muted-foreground">
                          {entry.adminUser?.name ?? entry.adminUser?.email ?? 'Sistema'} ·{' '}
                          <time dateTime={entry.createdAt}>{timeAgo(entry.createdAt, now)}</time>
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </Card>

            <Card>
              <section aria-labelledby="metrics-heading">
                <CardHeader
                  id="metrics-heading"
                  title={`Visitas e interés (últimos ${summary.analytics.days} días)`}
                  description="Solo se cuentan visitantes que aceptaron la analítica."
                />
                {totals.size === 0 ? (
                  <p className="text-sm text-muted-foreground">Aún no hay métricas registradas.</p>
                ) : (
                  <dl className="grid grid-cols-2 gap-3 tab:grid-cols-3">
                    {[...totals].map(([type, count]) => (
                      <div key={type} className="rounded-sm bg-ivory p-3.5">
                        <dt className="text-[0.8125rem] text-muted-foreground">
                          {EVENT_LABELS[type] ?? type}
                        </dt>
                        <dd className="mt-1 text-xl font-bold tabular-nums">{count}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </section>
            </Card>
          </div>
        ) : null}
      </div>
    </>
  );
}
