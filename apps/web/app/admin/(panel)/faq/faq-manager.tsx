'use client';

import { faqCreateSchema, faqUpdateSchema } from '@hotel-bambu/shared';
import { ResourceManager } from '@/components/admin/resource-manager';
import { BooleanBadge, WarningBadge } from '@/components/admin/ui';
import type { Faq } from '@/lib/api/types';

export function FaqManager({ items }: { items: Faq[] }) {
  return (
    <ResourceManager<Faq>
      endpoint="/admin/faq"
      items={items}
      noun="pregunta"
      createSchema={faqCreateSchema}
      updateSchema={faqUpdateSchema}
      reorderable
      fields={[
        { name: 'question', label: 'Pregunta', kind: 'text', required: true, wide: true },
        {
          name: 'answer',
          label: 'Respuesta',
          kind: 'textarea',
          required: true,
          rows: 5,
          hint: 'Texto simple, sin HTML.',
        },
        { name: 'published', label: 'Publicada', kind: 'checkbox', hint: 'Visible en el sitio.' },
      ]}
      emptyValues={{ question: '', answer: '', published: false }}
      toFormValues={(item) => ({
        question: item.question,
        answer: item.answer,
        published: item.published,
      })}
      itemLabel={(item) => item.question}
      toggles={[{ name: 'published', on: 'Despublicar', off: 'Publicar' }]}
      renderSummary={(item) => (
        <>
          <p className="font-bold">{item.question}</p>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.answer}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <BooleanBadge value={item.published} on="Publicada" off="No publicada" />
            {/\[demo\]/i.test(`${item.question} ${item.answer}`) ? (
              <WarningBadge>Texto de ejemplo [DEMO]</WarningBadge>
            ) : null}
          </div>
        </>
      )}
    />
  );
}
