import type { Metadata } from 'next';
import { PageHeader } from '@/components/admin/ui';
import { serverApi } from '@/lib/api/server';
import type { Promotion, Room } from '@/lib/api/types';
import { PromotionsManager } from './promotions-manager';

export const metadata: Metadata = { title: 'Promociones' };

export default async function PromotionsPage() {
  const [items, rooms] = await Promise.all([
    serverApi.get<Promotion[]>('/admin/promotions'),
    serverApi.get<Room[]>('/admin/rooms'),
  ]);
  return (
    <>
      <PageHeader
        title="Promociones"
        description="Ofertas informativas con fechas de vigencia. No se calculan precios ni se bloquea disponibilidad."
      />
      <PromotionsManager items={items} rooms={rooms.map((r) => ({ id: r.id, name: r.name }))} />
    </>
  );
}
