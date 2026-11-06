import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/admin/ui';
import { serverApi } from '@/lib/api/server';
import type { Amenity } from '@/lib/api/types';
import { RoomTypeForm } from '../room-type-form';

export const metadata: Metadata = { title: 'Nuevo tipo de habitación' };

export default async function NewRoomPage() {
  const amenities = await serverApi.get<Amenity[]>('/admin/amenities');
  return (
    <>
      <Link href="/admin/room-types" className="text-sm text-primary underline underline-offset-4">
        ← Tipos de habitación
      </Link>
      <PageHeader
        title="Nuevo tipo de habitación"
        description="Se crea como borrador. Después podrá agregar imágenes y publicarlo."
      />
      <RoomTypeForm room={null} amenities={amenities} />
    </>
  );
}
