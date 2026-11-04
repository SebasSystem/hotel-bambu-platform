import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/admin/ui';
import { isApiError } from '@/lib/api/client';
import { serverApi } from '@/lib/api/server';
import type { Amenity, Room } from '@/lib/api/types';
import { RoomActions } from '../room-actions';
import { RoomForm } from '../room-form';
import { RoomImages } from '../room-images';

export const metadata: Metadata = { title: 'Editar habitación' };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const [room, amenities] = await Promise.all([
    serverApi.get<Room>(`/admin/rooms/${id}`).catch((error: unknown) => {
      if (isApiError(error) && error.status === 404) notFound();
      throw error;
    }),
    serverApi.get<Amenity[]>('/admin/amenities'),
  ]);
  return (
    <>
      <Link href="/admin/rooms" className="text-sm text-primary underline underline-offset-4">
        ← Habitaciones
      </Link>
      <PageHeader title={room.name} />
      <div className="flex flex-col gap-6">
        <RoomActions room={room} />
        <RoomImages key={room.updatedAt} room={room} />
        <RoomForm key={`form-${room.updatedAt}`} room={room} amenities={amenities} />
      </div>
    </>
  );
}
