import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/admin/ui';
import { requirePermission } from '@/lib/admin/session';
import { serverApi } from '@/lib/api/server';
import type { Amenity, Room, RoomType } from '@/lib/api/types';
import { RoomsManager } from './rooms-manager';

export const metadata: Metadata = { title: 'Habitaciones' };

export default async function RoomsPage() {
  await requirePermission('rooms.view');
  const [rooms, types, amenities] = await Promise.all([
    serverApi.get<Room[]>('/admin/rooms'),
    serverApi.get<RoomType[]>('/admin/room-types'),
    serverApi.get<Amenity[]>('/admin/amenities'),
  ]);
  return (
    <>
      <PageHeader
        title="Habitaciones"
        description="Las habitaciones físicas del hotel: número o nombre, tipo, estado y las comodidades que difieren de su tipo. Las publicadas cuentan en el sitio cuando su tipo también está publicado. Descripción, fotos, camas y tarifa se editan en el tipo."
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
      <RoomsManager
        items={rooms}
        types={types}
        amenities={amenities.filter((amenity) => amenity.scope === 'ROOM')}
      />
    </>
  );
}
