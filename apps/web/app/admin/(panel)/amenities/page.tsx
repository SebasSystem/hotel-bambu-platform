import type { Metadata } from 'next';
import { PageHeader } from '@/components/admin/ui';
import { serverApi } from '@/lib/api/server';
import type { Amenity } from '@/lib/api/types';
import { AmenitiesManager } from './amenities-manager';

export const metadata: Metadata = { title: 'Comodidades' };

export default async function AmenitiesPage() {
  const items = await serverApi.get<Amenity[]>('/admin/amenities');
  return (
    <>
      <PageHeader
        title="Comodidades"
        description="Lo que ofrece el hotel, en dos grupos: las comodidades «Del hotel» aplican a todo el hotel y las «De habitación» se asignan en cada tipo de habitación."
      />
      <AmenitiesManager items={items} />
    </>
  );
}
