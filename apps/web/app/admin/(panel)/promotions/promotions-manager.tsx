'use client';

import { promotionCreateSchema, promotionUpdateSchema } from '@hotel-bambu/shared';
import { ResourceManager, toDateTimeLocal } from '@/components/admin/resource-manager';
import { StatusBadge } from '@/components/admin/ui';
import type { Promotion } from '@/lib/api/types';
import { PUBLICATION_STATUS_OPTIONS } from '@/lib/labels';

const dateFormat = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' });

export function PromotionsManager({
  items,
  rooms,
}: {
  items: Promotion[];
  rooms: { id: string; name: string }[];
}) {
  return (
    <ResourceManager<Promotion>
      endpoint="/admin/promotions"
      items={items}
      noun="promoción"
      createSchema={promotionCreateSchema}
      updateSchema={promotionUpdateSchema}
      fields={[
        { name: 'title', label: 'Título', kind: 'text', required: true, wide: true },
        { name: 'description', label: 'Descripción', kind: 'textarea', rows: 3 },
        {
          name: 'conditions',
          label: 'Condiciones',
          kind: 'textarea',
          rows: 3,
          hint: 'Por ejemplo: sujeto a disponibilidad; confirmar por WhatsApp.',
        },
        { name: 'startsAt', label: 'Inicio', kind: 'datetime', required: true },
        { name: 'endsAt', label: 'Fin', kind: 'datetime', required: true },
        {
          name: 'roomId',
          label: 'Habitación',
          kind: 'select',
          emptyOption: 'Todas (sin habitación específica)',
          options: rooms.map((room) => ({ value: room.id, label: room.name })),
        },
        {
          name: 'status',
          label: 'Estado',
          kind: 'select',
          required: true,
          options: PUBLICATION_STATUS_OPTIONS,
          hint: 'Solo las publicadas y vigentes aparecen en el sitio.',
        },
      ]}
      emptyValues={{
        title: '',
        description: '',
        conditions: '',
        startsAt: '',
        endsAt: '',
        roomId: null,
        status: 'DRAFT',
      }}
      toFormValues={(item) => ({
        title: item.title,
        description: item.description ?? '',
        conditions: item.conditions ?? '',
        startsAt: toDateTimeLocal(item.startsAt),
        endsAt: toDateTimeLocal(item.endsAt),
        roomId: item.roomId,
        status: item.status,
      })}
      itemLabel={(item) => item.title}
      renderSummary={(item) => (
        <>
          <p className="font-semibold">{item.title}</p>
          <p className="text-sm text-muted-foreground">
            {dateFormat.format(new Date(item.startsAt))} –{' '}
            {dateFormat.format(new Date(item.endsAt))}
            {item.room ? ` · ${item.room.name}` : ''}
          </p>
          <div className="mt-2">
            <StatusBadge status={item.status} />
          </div>
        </>
      )}
    />
  );
}
