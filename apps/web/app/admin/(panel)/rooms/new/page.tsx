import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/admin/ui';
import { serverApi } from '@/lib/api/server';
import type { Amenity } from '@/lib/api/types';
import { RoomForm } from '../room-form';

export const metadata: Metadata = { title: 'Nueva habitación' };

export default async function NewRoomPage() {
  const amenities = await serverApi.get<Amenity[]>('/admin/amenities');
  return (
    <>
      <Link href="/admin/rooms" className="text-sm text-primary underline underline-offset-4">
        ← Habitaciones
      </Link>
      <PageHeader
        title="Nueva habitación"
        description="Se crea como borrador. Después podrá agregar imágenes y publicarla."
      />
      <RoomForm room={null} amenities={amenities} />
    </>
  );
}
