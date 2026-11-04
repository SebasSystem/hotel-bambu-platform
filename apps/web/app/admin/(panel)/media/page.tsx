import type { Metadata } from 'next';
import { PageHeader } from '@/components/admin/ui';
import { serverApi } from '@/lib/api/server';
import type { MediaAsset, Paginated } from '@/lib/api/types';
import { MediaLibrary } from './media-library';

export const metadata: Metadata = { title: 'Medios' };

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(String(params.page ?? '1'), 10) || 1);
  const missingAlt = params.missingAlt === 'true';
  const data = await serverApi.get<Paginated<MediaAsset>>('/admin/media', {
    query: { page, pageSize: 24, missingAlt: missingAlt ? 'true' : undefined },
  });
  return (
    <>
      <PageHeader
        title="Medios"
        description="Biblioteca de imágenes del sitio. Toda imagen necesita texto alternativo para poder publicarse."
      />
      <MediaLibrary data={data} missingAlt={missingAlt} />
    </>
  );
}
