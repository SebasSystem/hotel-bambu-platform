import type { Metadata } from 'next';
import { PageHeader } from '@/components/admin/ui';
import { serverApi } from '@/lib/api/server';
import type { Policy } from '@/lib/api/types';
import { PoliciesManager } from './policies-manager';

export const metadata: Metadata = { title: 'Políticas del hotel' };

export default async function PoliciesPage() {
  const items = await serverApi.get<Policy[]>('/admin/policies');
  return (
    <>
      <PageHeader
        title="Políticas del hotel"
        description="Check-in y check-out, mascotas, menores, fumadores, cancelación, medios de pago aceptados al llegar."
      />
      <PoliciesManager items={items} />
    </>
  );
}
