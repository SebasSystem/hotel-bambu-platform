import { Plus } from 'lucide-react';
import type { Metadata } from 'next';
import { ButtonLink, PageHeader } from '@/components/admin/ui';
import { serverApi } from '@/lib/api/server';
import type { Room } from '@/lib/api/types';
import { RoomsTable } from './rooms-table';

export const metadata: Metadata = { title: 'Habitaciones' };

export default async function RoomsPage() {
  const rooms = await serverApi.get<Room[]>('/admin/rooms');
  return (
    <>
      <PageHeader
        title="Habitaciones"
        description="Solo las habitaciones publicadas aparecen en el sitio. Para publicar se necesitan nombre, descripción corta, capacidad e imagen principal con texto alternativo."
        actions={
          <ButtonLink href="/admin/rooms/new">
            <Plus aria-hidden="true" className="size-4" /> Nueva habitación
          </ButtonLink>
        }
      />
      <RoomsTable rooms={rooms} />
    </>
  );
}
