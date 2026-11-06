import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LegalDocument, legalTodos, type LegalDocKey } from '@/components/legal/legal-documents';
import { DraftBanner } from '@/components/legal/legal-parts';
import { PageHeader } from '@/components/site/page-header';
import { container } from '@/components/site/styles';
import { ui } from '@/lib/i18n/es';
import { getSite } from '@/lib/public/api';
import { isLegalApproved } from '@/lib/seo/config';
import { pageMetadata } from '@/lib/seo/metadata';

/**
 * Legal documents (requirement 17.3): data-processing policy, privacy notice and cookie policy,
 * filled from the hotel profile. Until `LEGAL_APPROVED=true` they show a draft banner with the
 * missing items, answer `noindex` and stay out of the sitemap. A lawyer must review the texts.
 */
const DOCS: Record<LegalDocKey, { title: string; description: string }> = {
  'tratamiento-de-datos': {
    title: 'Política de tratamiento de datos personales',
    description:
      'Cómo tratamos los datos personales, tus derechos y cómo ejercerlos (Ley 1581 de 2012).',
  },
  'aviso-de-privacidad': {
    title: ui.legal.privacy,
    description:
      'Aviso de privacidad: responsable, finalidades y derechos sobre tus datos personales.',
  },
  cookies: {
    title: ui.legal.cookies,
    description:
      'Qué cookies y tecnologías usa el sitio, para qué y cómo cambiar tu consentimiento.',
  },
};

function docOf(doc: string): LegalDocKey | null {
  return doc in DOCS ? (doc as LegalDocKey) : null;
}

export function generateStaticParams() {
  return Object.keys(DOCS).map((doc) => ({ doc }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<'/legal/[doc]'>): Promise<Metadata> {
  const doc = docOf((await params).doc);
  if (!doc) return {};
  const { hotel } = await getSite();
  // Draft texts stay out of the index until the hotel approves them (17.3).
  return pageMetadata({
    path: `/legal/${doc}`,
    ...DOCS[doc],
    siteName: hotel.name,
    noindex: !isLegalApproved(),
  });
}

export default async function LegalPage({ params }: PageProps<'/legal/[doc]'>) {
  const doc = docOf((await params).doc);
  if (!doc) notFound();
  const { hotel } = await getSite();
  const approved = isLegalApproved();
  const context = { hotel, effectiveDate: process.env.LEGAL_EFFECTIVE_DATE ?? null };

  return (
    <>
      <PageHeader title={DOCS[doc].title} path={`/legal/${doc}`} />
      <div className={`${container} py-14`}>
        <div className="max-w-3xl text-base text-foreground/90">
          {approved ? null : <DraftBanner todos={legalTodos(doc, context)} />}
          <div className={approved ? '' : 'mt-10'}>
            <LegalDocument doc={doc} context={context} />
          </div>
        </div>
      </div>
    </>
  );
}
