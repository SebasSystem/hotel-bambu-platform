'use client';

import { AMENITY_SCOPES, amenityCreateSchema, amenityUpdateSchema } from '@hotel-bambu/shared';
import { useState } from 'react';
import { SiteIcon } from '@/components/site/icon';
import { ResourceManager } from '@/components/admin/resource-manager';
import { Badge, BooleanBadge, cx } from '@/components/admin/ui';
import type { Amenity } from '@/lib/api/types';
import { AMENITY_SCOPE_LABELS, ICON_LABELS, labelOf, toOptions } from '@/lib/labels';

type Scope = (typeof AMENITY_SCOPES)[number];
type ScopeFilter = 'ALL' | Scope;

const FILTERS: readonly { value: ScopeFilter; label: string }[] = [
  { value: 'ALL', label: 'Todas' },
  ...AMENITY_SCOPES.map((value) => ({ value, label: AMENITY_SCOPE_LABELS[value] })),
];

const GROUPS: Record<Scope, { title: string; description: string; noun: string }> = {
  HOTEL: {
    title: 'Del hotel',
    description: 'Aplican a todo el hotel (Wi-Fi, paneles solares…). Se muestran en la portada.',
    noun: 'comodidad del hotel',
  },
  ROOM: {
    title: 'De habitación',
    description: 'Se asignan en cada tipo de habitación (baño privado, TV…).',
    noun: 'comodidad de habitación',
  },
};

function AmenityList({ items, scope }: { items: Amenity[]; scope: Scope }) {
  return (
    <ResourceManager<Amenity>
      endpoint="/admin/amenities"
      items={items}
      noun="comodidad"
      addLabel={`Agregar ${GROUPS[scope].noun}`}
      emptyText="Todavía no hay comodidades en este grupo."
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
          hint: '«Del hotel»: aplica a todo el hotel. «De habitación»: se asigna en cada tipo de habitación.',
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
          hint: 'Del hotel: franja de confianza. De habitación: «En todas las habitaciones».',
        },
      ]}
      emptyValues={{
        name: '',
        scope,
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
        <div className="flex items-start gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-notice-bg text-green">
            <SiteIcon iconKey={item.iconKey} className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="font-bold">{item.name}</p>
            <p className="text-[0.8125rem] text-muted-foreground">
              Icono: {labelOf(ICON_LABELS, item.iconKey)}
              {item.scope === 'ROOM' && item._count
                ? ` · En ${item._count.roomTypes} ${item._count.roomTypes === 1 ? 'tipo de habitación' : 'tipos de habitación'}`
                : null}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge>{AMENITY_SCOPE_LABELS[item.scope]}</Badge>
              <BooleanBadge value={item.active} on="Activa" off="Inactiva" />
              {item.showOnHome ? <Badge tone="success">En inicio</Badge> : null}
            </div>
          </div>
        </div>
      )}
    />
  );
}

/**
 * One "Comodidades" catalog (ADR 0015), shown grouped by scope in "Todas" so the hotel-wide and
 * per-room items no longer interleave. Ordering reorders the items of one group.
 */
export function AmenitiesManager({ items }: { items: Amenity[] }) {
  const [filter, setFilter] = useState<ScopeFilter>('ALL');
  const scopes: readonly Scope[] = filter === 'ALL' ? AMENITY_SCOPES : [filter];

  return (
    <div className="flex flex-col gap-6">
      <div role="group" aria-label="Filtrar por alcance" className="flex flex-wrap gap-2">
        {FILTERS.map((option) => {
          const count =
            option.value === 'ALL'
              ? items.length
              : items.filter((item) => item.scope === option.value).length;
          const active = filter === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(option.value)}
              className={cx(
                'inline-flex min-h-10 items-center gap-2 rounded-pill border px-4 text-sm font-bold transition-colors',
                active
                  ? 'border-green bg-green text-white'
                  : 'border-line-strong bg-white text-foreground hover:border-green',
              )}
            >
              {option.label}
              <span
                className={cx(
                  'rounded-pill px-1.5 text-xs tabular-nums',
                  active ? 'bg-white/20' : 'bg-neutral-bg text-ink-muted',
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
      {scopes.map((scope) => (
        <section key={scope} aria-labelledby={`amenities-${scope}`} className="grid gap-3">
          <div>
            <h2 id={`amenities-${scope}`} className="text-lg">
              {GROUPS[scope].title}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{GROUPS[scope].description}</p>
          </div>
          <AmenityList scope={scope} items={items.filter((item) => item.scope === scope)} />
        </section>
      ))}
    </div>
  );
}
