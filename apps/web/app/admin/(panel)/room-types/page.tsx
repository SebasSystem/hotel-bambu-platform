import { Plus } from 'lucide-react';
import type { Metadata } from 'next';
import { ButtonLink, PageHeader } from '@/components/admin/ui';
import { serverApi } from '@/lib/api/server';
import type { RoomType } from '@/lib/api/types';
import { RoomTypesTable } from './room-types-table';

export const metadata: Metadata = { title: 'Tipos de habitación' };

export default async function RoomTypesPage() {
  const types = await serverApi.get<RoomType[]>('/admin/room-types');
  return (
    <>
      <PageHeader
        title="Tipos de habitación"
        description="Lo que se muestra en el sitio: descripción, fotos, camas, comodidades y tarifa de cada tipo. Para publicar se necesitan nombre, capacidad e imagen principal con texto alternativo. Las habitaciones físicas se asignan a un tipo en «Habitaciones»."
        actions={
          <ButtonLink href="/admin/room-types/new">
            <Plus aria-hidden="true" className="size-4" /> Nuevo tipo
          </ButtonLink>
        }
      />
      <RoomTypesTable rooms={types} />
    </>
  );
}
