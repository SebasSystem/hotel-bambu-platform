import type { Metadata } from 'next';
import { PageHeader } from '@/components/admin/ui';
import { serverApi } from '@/lib/api/server';
import type { LandingSection } from '@/lib/api/types';
import { SectionForm } from './section-form';

export const metadata: Metadata = { title: 'Contenido de la landing' };

export default async function ContentPage() {
  const sections = await serverApi.get<LandingSection[]>('/admin/content');
  return (
    <>
      <PageHeader
        title="Contenido de la landing"
        description="Textos e imágenes de cada sección de la página de inicio. El diseño lo controla el sitio; aquí solo se edita el contenido."
      />
      <div className="flex flex-col gap-6">
        {sections.map((section) => (
          <SectionForm key={section.key} section={section} />
        ))}
      </div>
    </>
  );
}
