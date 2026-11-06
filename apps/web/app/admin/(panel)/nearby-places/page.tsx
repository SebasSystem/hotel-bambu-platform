import type { Metadata } from 'next';
import { PageHeader } from '@/components/admin/ui';
import { serverApi } from '@/lib/api/server';
import type { NearbyPlace } from '@/lib/api/types';
import { NearbyPlacesManager } from './nearby-places-manager';

export const metadata: Metadata = { title: 'Lugares cercanos' };

export default async function NearbyPlacesPage() {
  const items = await serverApi.get<NearbyPlace[]>('/admin/nearby-places');
  return (
    <>
      <PageHeader
        title="Lugares cercanos"
        description="Sitios de interés con la distancia y el tiempo de viaje desde el hotel. Escriba solo medidas reales (por ejemplo, «1,2 km» y «5 min en carro»)."
      />
      <NearbyPlacesManager items={items} />
    </>
  );
}
