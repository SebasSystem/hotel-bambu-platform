import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/admin/ui';
import { requirePermission } from '@/lib/admin/session';
import { serverApi } from '@/lib/api/server';
import type { Amenity } from '@/lib/api/types';
import { RoomTypeForm } from '../room-type-form';

export const metadata: Metadata = { title: 'Nuevo tipo de habitación' };

export default async function NewRoomPage() {
  await requirePermission('rooms.manage');
  const amenities = await serverApi.get<Amenity[]>('/admin/amenities');
  return (
    <>
      <Link
        href="/admin/room-types"
        className="mb-3 inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-green hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" /> Tipos de habitación
      </Link>
      <PageHeader
        title="Nuevo tipo de habitación"
        description="Se crea como borrador. Puede agregar imágenes ahora o después; para publicarlo necesita una portada."
      />
      <RoomTypeForm room={null} amenities={amenities} />
    </>
  );
}
