import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/site/page-header';
import { container } from '@/components/site/styles';
import { ui } from '@/lib/i18n/es';

/**
 * Legal documents (requirement 17.3). STUB: the texts, the cookie inventory and the consent
 * manager ("Configurar cookies") arrive in T7 and must be reviewed by the hotel's legal adviser.
 */
const DOCS = {
  'tratamiento-de-datos': ui.legal.data,
  'aviso-de-privacidad': ui.legal.privacy,
  cookies: ui.legal.cookies,
} as const;

type DocKey = keyof typeof DOCS;

function titleOf(doc: string): string | null {
  return doc in DOCS ? DOCS[doc as DocKey] : null;
}

export function generateStaticParams() {
  return Object.keys(DOCS).map((doc) => ({ doc }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<'/legal/[doc]'>): Promise<Metadata> {
  const title = titleOf((await params).doc);
  // Not indexable until the final, approved text is published (T7).
  return title ? { title, robots: { index: false, follow: true } } : {};
}

export default async function LegalPage({ params }: PageProps<'/legal/[doc]'>) {
  const title = titleOf((await params).doc);
  if (!title) notFound();
  return (
    <>
      <PageHeader title={title} />
      <div id="configurar" className={`${container} py-16`}>
        <p className="max-w-2xl text-lg leading-normal text-muted-foreground">
          Documento en preparación. Publicaremos aquí el texto aprobado por el hotel.
        </p>
      </div>
    </>
  );
}
