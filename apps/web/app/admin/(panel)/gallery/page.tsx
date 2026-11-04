import type { Metadata } from 'next';
import { PageHeader } from '@/components/admin/ui';
import { serverApi } from '@/lib/api/server';
import type { GalleryItem } from '@/lib/api/types';
import { GalleryManager } from './gallery-manager';

export const metadata: Metadata = { title: 'Galería' };

export default async function GalleryPage() {
  const items = await serverApi.get<GalleryItem[]>('/admin/gallery');
  return (
    <>
      <PageHeader
        title="Galería"
        description="Fotos de la galería pública por categoría. Solo se publican imágenes procesadas y con texto alternativo."
      />
      <GalleryManager items={items} />
    </>
  );
}
