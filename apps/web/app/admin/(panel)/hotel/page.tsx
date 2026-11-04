import type { Metadata } from 'next';
import { PageHeader } from '@/components/admin/ui';
import { serverApi } from '@/lib/api/server';
import type { HotelProfile } from '@/lib/api/types';
import { HotelForm } from './hotel-form';

export const metadata: Metadata = { title: 'Información del hotel' };

export default async function HotelPage() {
  const profile = await serverApi.get<HotelProfile>('/admin/hotel');
  return (
    <>
      <PageHeader
        title="Información del hotel"
        description="Datos que aparecen en el sitio: descripción, contacto, ubicación y horarios. Deje vacío lo que aún no tenga."
      />
      <HotelForm profile={profile} />
    </>
  );
}
