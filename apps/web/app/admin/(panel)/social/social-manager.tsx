'use client';

import { socialLinkCreateSchema, socialLinkUpdateSchema } from '@hotel-bambu/shared';
import { ResourceManager } from '@/components/admin/resource-manager';
import { BooleanBadge } from '@/components/admin/ui';
import type { SocialLink } from '@/lib/api/types';
import { SOCIAL_PLATFORM_LABELS, labelOf, toOptions } from '@/lib/labels';

export function SocialManager({ items }: { items: SocialLink[] }) {
  return (
    <ResourceManager<SocialLink>
      endpoint="/admin/social-links"
      items={items}
      noun="red social"
      createSchema={socialLinkCreateSchema}
      updateSchema={socialLinkUpdateSchema}
      reorderable
      fields={[
        {
          name: 'platform',
          label: 'Plataforma',
          kind: 'select',
          required: true,
          options: toOptions(SOCIAL_PLATFORM_LABELS),
        },
        {
          name: 'url',
          label: 'Enlace',
          kind: 'url',
          required: true,
          hint: 'Dirección completa que empiece por https:// y corresponda a la plataforma.',
        },
        { name: 'active', label: 'Activa', kind: 'checkbox', hint: 'Visible en el sitio.' },
      ]}
      emptyValues={{ platform: 'INSTAGRAM', url: '', active: true }}
      toFormValues={(item) => ({ platform: item.platform, url: item.url, active: item.active })}
      itemLabel={(item) => labelOf(SOCIAL_PLATFORM_LABELS, item.platform)}
      toggles={[{ name: 'active', on: 'Desactivar', off: 'Activar' }]}
      renderSummary={(item) => (
        <>
          <p className="font-semibold">{labelOf(SOCIAL_PLATFORM_LABELS, item.platform)}</p>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm break-all text-primary underline underline-offset-4"
          >
            {item.url}
          </a>
          <div className="mt-2">
            <BooleanBadge value={item.active} on="Activa" off="Inactiva" />
          </div>
        </>
      )}
    />
  );
}
