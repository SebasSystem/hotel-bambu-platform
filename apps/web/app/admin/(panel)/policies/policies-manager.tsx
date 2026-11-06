'use client';

import { policyCreateSchema, policyUpdateSchema } from '@hotel-bambu/shared';
import { ResourceManager } from '@/components/admin/resource-manager';
import { BooleanBadge, WarningBadge } from '@/components/admin/ui';
import type { Policy } from '@/lib/api/types';

export function PoliciesManager({ items }: { items: Policy[] }) {
  return (
    <ResourceManager<Policy>
      endpoint="/admin/policies"
      items={items}
      noun="política"
      createSchema={policyCreateSchema}
      updateSchema={policyUpdateSchema}
      reorderable
      fields={[
        {
          name: 'title',
          label: 'Título',
          kind: 'text',
          required: true,
          wide: true,
          hint: 'Por ejemplo: Mascotas, Menores de edad, Cancelación.',
        },
        {
          name: 'content',
          label: 'Contenido',
          kind: 'textarea',
          required: true,
          rows: 6,
          hint: 'Texto simple, sin HTML.',
        },
        { name: 'published', label: 'Publicada', kind: 'checkbox' },
      ]}
      emptyValues={{ title: '', content: '', published: false }}
      toFormValues={(item) => ({
        title: item.title,
        content: item.content,
        published: item.published,
      })}
      itemLabel={(item) => item.title}
      toggles={[{ name: 'published', on: 'Despublicar', off: 'Publicar' }]}
      renderSummary={(item) => (
        <>
          <p className="font-bold">{item.title}</p>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.content}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <BooleanBadge value={item.published} on="Publicada" off="No publicada" />
            {/\[demo\]/i.test(`${item.title} ${item.content}`) ? (
              <WarningBadge>Texto de ejemplo [DEMO]</WarningBadge>
            ) : null}
          </div>
        </>
      )}
    />
  );
}
