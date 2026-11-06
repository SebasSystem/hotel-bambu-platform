'use client';

import { AMENITY_SCOPES, amenityCreateSchema, amenityUpdateSchema } from '@hotel-bambu/shared';
import { useState } from 'react';
import { ResourceManager } from '@/components/admin/resource-manager';
import { Badge, BooleanBadge, Button } from '@/components/admin/ui';
import type { Amenity } from '@/lib/api/types';
import { AMENITY_SCOPE_LABELS, ICON_LABELS, labelOf, toOptions } from '@/lib/labels';

type ScopeFilter = 'ALL' | (typeof AMENITY_SCOPES)[number];

const FILTERS: readonly { value: ScopeFilter; label: string }[] = [
  { value: 'ALL', label: 'Todas' },
  ...AMENITY_SCOPES.map((value) => ({ value, label: AMENITY_SCOPE_LABELS[value] })),
];

/**
 * One "Comodidades" catalog (ADR 0015): scope "Todo el hotel" (Wi-Fi, solar panels...) or
 * "Habitaciones" (assigned in each room). The filter only narrows the list; ordering within a
 * filtered list reorders those items.
 */
export function AmenitiesManager({ items }: { items: Amenity[] }) {
  const [filter, setFilter] = useState<ScopeFilter>('ALL');
  const visible = filter === 'ALL' ? items : items.filter((item) => item.scope === filter);

  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label="Filtrar por alcance" className="flex flex-wrap gap-2">
        {FILTERS.map((option) => {
          const count =
            option.value === 'ALL'
              ? items.length
              : items.filter((item) => item.scope === option.value).length;
          return (
            <Button
              key={option.value}
              size="sm"
              variant={filter === option.value ? 'primary' : 'secondary'}
              aria-pressed={filter === option.value}
              onClick={() => setFilter(option.value)}
            >
              {option.label} ({count})
            </Button>
          );
        })}
      </div>
      <ResourceManager<Amenity>
        endpoint="/admin/amenities"
        items={visible}
        noun="comodidad"
        createSchema={amenityCreateSchema}
        updateSchema={amenityUpdateSchema}
        reorderable
        deleteDescription="Solo se puede eliminar si ningún tipo de habitación la usa."
        fields={[
          { name: 'name', label: 'Nombre', kind: 'text', required: true },
          {
            name: 'scope',
            label: 'Alcance',
            kind: 'select',
            required: true,
            options: toOptions(AMENITY_SCOPE_LABELS),
            hint: '«Todo el hotel»: aplica a todo el hotel. «Habitaciones»: se asigna en cada tipo de habitación.',
          },
          {
            name: 'iconKey',
            label: 'Icono',
            kind: 'select',
            required: true,
            options: toOptions(ICON_LABELS),
          },
          { name: 'description', label: 'Descripción', kind: 'textarea', rows: 2 },
          { name: 'active', label: 'Activa', kind: 'checkbox' },
          {
            name: 'showOnHome',
            label: 'Mostrar en la página de inicio',
            kind: 'checkbox',
            hint: 'Todo el hotel: panel del hotel. Habitaciones: «En todas las habitaciones».',
          },
        ]}
        emptyValues={{
          name: '',
          scope: filter === 'HOTEL' ? 'HOTEL' : 'ROOM',
          iconKey: 'wifi',
          description: '',
          active: true,
          showOnHome: false,
        }}
        toFormValues={(item) => ({
          name: item.name,
          scope: item.scope,
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
              {item.scope === 'ROOM' && item._count
                ? ` · En ${item._count.roomTypes} ${item._count.roomTypes === 1 ? 'tipo de habitación' : 'tipos de habitación'}`
                : null}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge>{AMENITY_SCOPE_LABELS[item.scope]}</Badge>
              <BooleanBadge value={item.active} on="Activa" off="Inactiva" />
              {item.showOnHome ? <Badge>En inicio</Badge> : null}
            </div>
          </>
        )}
      />
    </div>
  );
}
