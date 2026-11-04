import type { Metadata } from 'next';
import { PageHeader } from '@/components/admin/ui';
import { serverApi } from '@/lib/api/server';
import type { MediaAsset, Service } from '@/lib/api/types';
import { ServicesManager } from './services-manager';

export const metadata: Metadata = { title: 'Servicios' };

export default async function ServicesPage() {
  const items = await serverApi.get<Service[]>('/admin/services');
  const mediaIds = [
    ...new Set(items.map((s) => s.mediaAssetId).filter((id): id is string => !!id)),
  ];
  const assets = await Promise.all(
    mediaIds.map((id) => serverApi.get<MediaAsset>(`/admin/media/${id}`).catch(() => null)),
  );
  const media = Object.fromEntries(
    assets
      .filter((a): a is MediaAsset => a !== null)
      .map((a) => [a.id, { variants: a.variants, altText: a.altText }]),
  );
  return (
    <>
      <PageHeader
        title="Servicios"
        description="Características del hotel (paneles solares, reserva de agua, internet…). Los destacados aparecen en la página de inicio."
      />
      <ServicesManager items={items} media={media} />
    </>
  );
}
