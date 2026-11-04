import type { Metadata } from 'next';
import { PageHeader } from '@/components/admin/ui';
import { serverApi } from '@/lib/api/server';
import type { HotelProfile, WhatsAppTemplate } from '@/lib/api/types';
import { TemplateForm, WhatsAppNumberForm } from './whatsapp-forms';

export const metadata: Metadata = { title: 'WhatsApp' };

export default async function WhatsAppPage() {
  const [profile, templates] = await Promise.all([
    serverApi.get<HotelProfile>('/admin/hotel'),
    serverApi.get<WhatsAppTemplate[]>('/admin/whatsapp-templates'),
  ]);
  return (
    <>
      <PageHeader
        title="WhatsApp"
        description="Número de contacto y mensajes predefinidos de los botones de WhatsApp del sitio."
      />
      <div className="flex flex-col gap-6">
        <WhatsAppNumberForm number={profile.whatsappNumber} />
        <h2 className="text-2xl font-semibold">Plantillas de mensaje</h2>
        {templates.map((template) => (
          <TemplateForm key={template.key} template={template} number={profile.whatsappNumber} />
        ))}
      </div>
    </>
  );
}
