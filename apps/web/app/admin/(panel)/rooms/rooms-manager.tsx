'use client';

import { roomCreateSchema, roomUpdateSchema } from '@hotel-bambu/shared';
import { BedDouble } from 'lucide-react';
import { PublishSwitch } from '@/components/admin/publish-switch';
import { ResourceManager } from '@/components/admin/resource-manager';
import { Badge, WarningBadge } from '@/components/admin/ui';
import type { Room, RoomType } from '@/lib/api/types';
import { PUBLICATION_STATUS_OPTIONS, ROOM_TYPE_LABELS } from '@/lib/labels';

/**
 * Lightweight room list (ADR 0016): number or name, type and status. A room counts on the site
 * when it is published and its type is published too.
 */
export function RoomsManager({ items, types }: { items: Room[]; types: RoomType[] }) {
  const typeOptions = types.map((type) => ({
    value: type.id,
    label: `${type.name} (${ROOM_TYPE_LABELS[type.type]})`,
  }));
  return (
    <ResourceManager<Room>
      endpoint="/admin/rooms"
      items={items}
      noun="habitación"
      createSchema={roomCreateSchema}
      updateSchema={roomUpdateSchema}
      reorderable
      fields={[
        {
          name: 'name',
          label: 'Número o nombre',
          kind: 'text',
          required: true,
          hint: 'Por ejemplo: 101.',
        },
        {
          name: 'roomTypeId',
          label: 'Tipo de habitación',
          kind: 'select',
          required: true,
          options: typeOptions,
        },
        {
          name: 'status',
          label: 'Estado',
          kind: 'select',
          required: true,
          options: PUBLICATION_STATUS_OPTIONS,
          hint: '«Inactivo» también sirve para una habitación fuera de servicio.',
        },
      ]}
      emptyValues={{ name: '', roomTypeId: types[0]?.id ?? '', status: 'DRAFT' }}
      toFormValues={(item) => ({
        name: item.name,
        roomTypeId: item.roomTypeId,
        status: item.status,
      })}
      itemLabel={(item) => item.name}
      emptyText="Todavía no hay habitaciones."
      renderActions={(item) => (
        <PublishSwitch endpoint={`/admin/rooms/${item.id}`} name={item.name} status={item.status} />
      )}
      renderSummary={(item) => (
        <>
          <p className="text-[0.95rem] font-bold">{item.name}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge icon={BedDouble}>{item.roomType.name}</Badge>
            {item.status === 'PUBLISHED' && item.roomType.status !== 'PUBLISHED' ? (
              <WarningBadge>El tipo no está publicado: no cuenta en el sitio</WarningBadge>
            ) : null}
          </div>
        </>
      )}
    />
  );
}
