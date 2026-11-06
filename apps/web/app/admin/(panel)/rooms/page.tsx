import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/admin/ui';
import { serverApi } from '@/lib/api/server';
import type { Room, RoomType } from '@/lib/api/types';
import { RoomsManager } from './rooms-manager';

export const metadata: Metadata = { title: 'Habitaciones' };

export default async function RoomsPage() {
  const [rooms, types] = await Promise.all([
    serverApi.get<Room[]>('/admin/rooms'),
    serverApi.get<RoomType[]>('/admin/room-types'),
  ]);
  return (
    <>
      <PageHeader
        title="Habitaciones"
        description="Las habitaciones físicas del hotel: número o nombre, tipo y estado. Las publicadas cuentan en el sitio cuando su tipo también está publicado. Descripción, fotos, camas y tarifa se editan en el tipo."
      />
      {types.length === 0 ? (
        <p className="mb-4 text-sm">
          Primero cree un tipo en{' '}
          <Link href="/admin/room-types" className="text-primary underline underline-offset-4">
            Tipos de habitación
          </Link>
          .
        </p>
      ) : null}
      <RoomsManager items={rooms} types={types} />
    </>
  );
}
