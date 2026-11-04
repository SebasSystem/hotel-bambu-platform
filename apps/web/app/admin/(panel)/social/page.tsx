import type { Metadata } from 'next';
import { PageHeader } from '@/components/admin/ui';
import { serverApi } from '@/lib/api/server';
import type { SocialLink } from '@/lib/api/types';
import { SocialManager } from './social-manager';

export const metadata: Metadata = { title: 'Redes sociales' };

export default async function SocialPage() {
  const items = await serverApi.get<SocialLink[]>('/admin/social-links');
  return (
    <>
      <PageHeader
        title="Redes sociales"
        description="Enlaces que aparecen en el pie de página del sitio."
      />
      <SocialManager items={items} />
    </>
  );
}
