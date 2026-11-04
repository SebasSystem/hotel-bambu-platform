'use client';

import { amenityCreateSchema, amenityUpdateSchema } from '@hotel-bambu/shared';
import { ResourceManager } from '@/components/admin/resource-manager';
import { Badge, BooleanBadge } from '@/components/admin/ui';
import type { Amenity } from '@/lib/api/types';
import { ICON_LABELS, labelOf, toOptions } from '@/lib/labels';

export function AmenitiesManager({ items }: { items: Amenity[] }) {
  return (
    <ResourceManager<Amenity>
      endpoint="/admin/amenities"
      items={items}
      noun="comodidad"
      createSchema={amenityCreateSchema}
      updateSchema={amenityUpdateSchema}
      reorderable
      deleteDescription="Solo se puede eliminar si ninguna habitación la usa."
      fields={[
        { name: 'name', label: 'Nombre', kind: 'text', required: true },
        {
          name: 'iconKey',
          label: 'Icono',
          kind: 'select',
          required: true,
          options: toOptions(ICON_LABELS),
        },
        { name: 'description', label: 'Descripción', kind: 'textarea', rows: 2 },
        { name: 'active', label: 'Activa', kind: 'checkbox' },
        { name: 'showOnHome', label: 'Mostrar en la página de inicio', kind: 'checkbox' },
      ]}
      emptyValues={{ name: '', iconKey: 'wifi', description: '', active: true, showOnHome: false }}
      toFormValues={(item) => ({
        name: item.name,
        iconKey: item.iconKey,
        description: item.description ?? '',
        active: item.active,
        showOnHome: item.showOnHome,
      })}
      itemLabel={(item) => item.name}
      toggles={[{ name: 'active', on: 'Desactivar', off: 'Activar' }]}
      renderSummary={(item) => (
        <>
          <p className="font-semibold">{item.name}</p>
          <p className="text-sm text-muted-foreground">
            Icono: {labelOf(ICON_LABELS, item.iconKey)}
          </p>
          <div className="mt-2 flex gap-2">
            <BooleanBadge value={item.active} on="Activa" off="Inactiva" />
            {item.showOnHome ? <Badge>En inicio</Badge> : null}
          </div>
        </>
      )}
    />
  );
}
