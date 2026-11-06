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
        description="Lo que ofrece el hotel. «Todo el hotel» (Wi-Fi, paneles solares…) aplica a todo el hotel; «Habitaciones» (baño privado, TV…) se asigna en cada habitación."
      />
      <AmenitiesManager items={items} />
    </>
  );
}
