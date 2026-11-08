'use client';

import { roomCreateSchema, roomUpdateSchema } from '@hotel-bambu/shared';
import { BedDouble } from 'lucide-react';
import { PublishSwitch } from '@/components/admin/publish-switch';
import { ResourceManager } from '@/components/admin/resource-manager';
import { Badge, WarningBadge } from '@/components/admin/ui';
import type { Amenity, Room, RoomType } from '@/lib/api/types';
import { PUBLICATION_STATUS_OPTIONS, ROOM_TYPE_LABELS } from '@/lib/labels';
import { RoomAmenitiesField } from './room-amenities-field';

/**
 * Lightweight room list (ADR 0016): number or name, type, status and amenity overrides (A9). A
 * room counts on the site when it is published and its type is published too.
 */
export function RoomsManager({
  items,
  types,
  amenities,
}: {
  items: Room[];
  types: RoomType[];
  /** ROOM amenities of the catalog. */
  amenities: Amenity[];
}) {
  const typesById = new Map(types.map((type) => [type.id, type]));
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
        {
          name: 'amenityOverrides',
          label: 'Comodidades de esta habitación',
          kind: 'custom',
          render: ({ value, onChange, values, error }) => {
            const type = typesById.get(values.roomTypeId as string);
            return (
              <RoomAmenitiesField
                typeName={type?.name ?? null}
                typeAmenityIds={type?.amenityIds ?? []}
                catalog={amenities}
                value={(value as Room['amenityOverrides'] | undefined) ?? []}
                onChange={onChange}
                error={error}
              />
            );
          },
        },
      ]}
      emptyValues={{
        name: '',
        roomTypeId: types[0]?.id ?? '',
        status: 'DRAFT',
        amenityOverrides: [],
      }}
      toFormValues={(item) => ({
        name: item.name,
        roomTypeId: item.roomTypeId,
        status: item.status,
        amenityOverrides: item.amenityOverrides,
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
            {item.amenityOverrides.length > 0 ? (
              <Badge>
                {item.amenityOverrides.length === 1
                  ? '1 comodidad distinta a su tipo'
                  : `${item.amenityOverrides.length} comodidades distintas a su tipo`}
              </Badge>
            ) : null}
            {item.status === 'PUBLISHED' && item.roomType.status !== 'PUBLISHED' ? (
              <WarningBadge>El tipo no está publicado: no cuenta en el sitio</WarningBadge>
            ) : null}
          </div>
        </>
      )}
    />
  );
}
