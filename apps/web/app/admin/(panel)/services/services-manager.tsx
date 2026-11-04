'use client';

import { serviceCreateSchema, serviceUpdateSchema } from '@hotel-bambu/shared';
import { ResourceManager } from '@/components/admin/resource-manager';
import { Badge, BooleanBadge } from '@/components/admin/ui';
import type { MediaAsset, Service } from '@/lib/api/types';
import { ICON_LABELS, labelOf, toOptions } from '@/lib/labels';

export function ServicesManager({
  items,
  media,
}: {
  items: Service[];
  /** Media referenced by services, for previews. */
  media: Record<string, Pick<MediaAsset, 'variants' | 'altText'>>;
}) {
  return (
    <ResourceManager<Service>
      endpoint="/admin/services"
      items={items}
      noun="servicio"
      createSchema={serviceCreateSchema}
      updateSchema={serviceUpdateSchema}
      reorderable
      fields={[
        { name: 'name', label: 'Nombre', kind: 'text', required: true },
        {
          name: 'iconKey',
          label: 'Icono',
          kind: 'select',
          emptyOption: 'Sin icono',
          options: toOptions(ICON_LABELS),
        },
        { name: 'description', label: 'Descripción', kind: 'textarea', rows: 3 },
        {
          name: 'mediaAssetId',
          label: 'Imagen',
          kind: 'media',
          hint: 'Opcional. Se usa en lugar del icono cuando existe.',
        },
        { name: 'active', label: 'Activo', kind: 'checkbox', hint: 'Visible en el sitio.' },
        {
          name: 'highlighted',
          label: 'Destacado en la página de inicio',
          kind: 'checkbox',
        },
      ]}
      emptyValues={{
        name: '',
        iconKey: null,
        description: '',
        mediaAssetId: null,
        active: true,
        highlighted: false,
      }}
      toFormValues={(item) => ({
        name: item.name,
        iconKey: item.iconKey,
        description: item.description ?? '',
        mediaAssetId: item.mediaAssetId,
        active: item.active,
        highlighted: item.highlighted,
      })}
      mediaPreview={(item) => (item?.mediaAssetId ? (media[item.mediaAssetId] ?? null) : null)}
      itemLabel={(item) => item.name}
      toggles={[
        { name: 'active', on: 'Desactivar', off: 'Activar' },
        { name: 'highlighted', on: 'Quitar destacado', off: 'Destacar' },
      ]}
      renderSummary={(item) => (
        <>
          <p className="font-semibold">{item.name}</p>
          {item.description ? (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-2">
            <BooleanBadge value={item.active} on="Activo" off="Inactivo" />
            {item.highlighted ? <Badge tone="success">Destacado</Badge> : null}
            {item.iconKey ? <Badge>Icono: {labelOf(ICON_LABELS, item.iconKey)}</Badge> : null}
          </div>
        </>
      )}
    />
  );
}
