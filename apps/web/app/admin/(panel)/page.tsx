import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, PageHeader } from '@/components/admin/ui';
import { serverApi } from '@/lib/api/server';
import type { DashboardSummary } from '@/lib/api/types';

export const metadata: Metadata = { title: 'Resumen' };

const EVENT_LABELS: Record<string, string> = {
  PAGE_VIEW: 'Visitas a páginas',
  WHATSAPP_CLICK: 'Clics en WhatsApp',
  ROOM_VIEW: 'Vistas de habitaciones',
  MAP_CLICK: 'Clics en el mapa',
  SOCIAL_CLICK: 'Clics en redes sociales',
};

const dateFormat = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'America/Bogota',
});

function Stat({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Card>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-4xl font-semibold text-bamboo-900">{value}</p>
      <Link
        href={href}
        className="mt-2 inline-block text-sm text-primary underline underline-offset-4"
      >
        Gestionar
      </Link>
    </Card>
  );
}

/** Content status only — never bookings or revenue (requirement 9.2). */
export default async function DashboardPage() {
  const summary = await serverApi.get<DashboardSummary>('/admin/dashboard');
  const totals = new Map<string, number>();
  for (const row of summary.analytics.totals) {
    totals.set(row.type, (totals.get(row.type) ?? 0) + row.count);
  }
  const incomplete = [
    {
      count: summary.incomplete.mediaMissingAlt,
      label: 'imágenes sin texto alternativo',
      href: '/admin/media?missingAlt=true',
    },
    {
      count: summary.incomplete.publishedRoomsWithoutPrice,
      label: 'habitaciones publicadas sin tarifa',
      href: '/admin/rooms',
    },
    {
      count: summary.incomplete.roomsWithoutCover,
      label: 'habitaciones sin imagen principal',
      href: '/admin/rooms',
    },
  ].filter((item) => item.count > 0);

  return (
    <>
      <PageHeader title="Resumen" description="Estado del contenido del sitio." />
      <section aria-labelledby="status-heading" className="mb-8">
        <h2 id="status-heading" className="sr-only">
          Estado del contenido
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Habitaciones publicadas"
            value={summary.rooms.PUBLISHED ?? 0}
            href="/admin/rooms"
          />
          <Stat
            label="Habitaciones en borrador"
            value={summary.rooms.DRAFT ?? 0}
            href="/admin/rooms"
          />
          <Stat label="Servicios activos" value={summary.activeServices} href="/admin/services" />
          <Stat
            label="Promociones vigentes"
            value={summary.activePromotions}
            href="/admin/promotions"
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-xl font-semibold">Contenido pendiente</h2>
          {incomplete.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No hay contenido incompleto.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {incomplete.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-primary underline underline-offset-4">
                    {item.count} {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-sm text-muted-foreground">
            Última actualización:{' '}
            {summary.lastChange
              ? dateFormat.format(new Date(summary.lastChange.createdAt))
              : 'sin cambios registrados'}
          </p>
        </Card>
        <Card>
          <h2 className="text-xl font-semibold">
            Actividad (últimos {summary.analytics.days} días)
          </h2>
          {totals.size === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Aún no hay métricas. Se registran solo con el consentimiento de analítica de los
              visitantes.
            </p>
          ) : (
            <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm">
              {[...totals].map(([type, count]) => (
                <div key={type} className="contents">
                  <dt>{EVENT_LABELS[type] ?? type}</dt>
                  <dd className="text-right font-semibold tabular-nums">{count}</dd>
                </div>
              ))}
            </dl>
          )}
        </Card>
      </div>
    </>
  );
}
