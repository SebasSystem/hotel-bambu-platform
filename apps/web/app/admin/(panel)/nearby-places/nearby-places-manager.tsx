'use client';

import { nearbyPlaceCreateSchema, nearbyPlaceUpdateSchema } from '@hotel-bambu/shared';
import { ResourceManager } from '@/components/admin/resource-manager';
import { Badge, BooleanBadge } from '@/components/admin/ui';
import type { NearbyPlace } from '@/lib/api/types';

/** Nearby places (ADR 0016): name, optional category, measured distance and travel time. */
export function NearbyPlacesManager({ items }: { items: NearbyPlace[] }) {
  return (
    <ResourceManager<NearbyPlace>
      endpoint="/admin/nearby-places"
      items={items}
      noun="lugar"
      createSchema={nearbyPlaceCreateSchema}
      updateSchema={nearbyPlaceUpdateSchema}
      reorderable
      fields={[
        { name: 'name', label: 'Nombre', kind: 'text', required: true },
        {
          name: 'category',
          label: 'Categoría',
          kind: 'text',
          hint: 'Opcional, por ejemplo «Naturaleza» o «Transporte».',
        },
        { name: 'distanceText', label: 'Distancia', kind: 'text', hint: 'Por ejemplo: 1,2 km.' },
        {
          name: 'travelTimeText',
          label: 'Tiempo de viaje',
          kind: 'text',
          hint: 'Por ejemplo: 5 min en carro.',
        },
        { name: 'active', label: 'Visible en el sitio', kind: 'checkbox' },
      ]}
      emptyValues={{
        name: '',
        category: '',
        distanceText: '',
        travelTimeText: '',
        active: true,
      }}
      toFormValues={(item) => ({
        name: item.name,
        category: item.category ?? '',
        distanceText: item.distanceText ?? '',
        travelTimeText: item.travelTimeText ?? '',
        active: item.active,
      })}
      itemLabel={(item) => item.name}
      toggles={[{ name: 'active', on: 'Ocultar', off: 'Mostrar' }]}
      renderSummary={(item) => (
        <>
          <p className="font-semibold">{item.name}</p>
          <p className="text-sm text-muted-foreground">
            {[item.distanceText, item.travelTimeText].filter(Boolean).join(' · ') ||
              'Sin distancia ni tiempo'}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {item.category ? <Badge>{item.category}</Badge> : null}
            <BooleanBadge value={item.active} on="Visible" off="Oculto" />
          </div>
        </>
      )}
    />
  );
}
