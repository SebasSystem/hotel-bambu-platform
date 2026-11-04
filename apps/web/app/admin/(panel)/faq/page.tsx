import type { Metadata } from 'next';
import { PageHeader } from '@/components/admin/ui';
import { serverApi } from '@/lib/api/server';
import type { Faq } from '@/lib/api/types';
import { FaqManager } from './faq-manager';

export const metadata: Metadata = { title: 'Preguntas frecuentes' };

export default async function FaqPage() {
  const items = await serverApi.get<Faq[]>('/admin/faq');
  return (
    <>
      <PageHeader
        title="Preguntas frecuentes"
        description="Solo las preguntas publicadas aparecen en el sitio. Use las flechas para ordenarlas."
      />
      <FaqManager items={items} />
    </>
  );
}
