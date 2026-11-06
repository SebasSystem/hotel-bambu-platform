import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { isIndexable, siteUrl } from '@/lib/seo/config';
import { DEFAULT_OG_IMAGE } from '@/lib/seo/metadata';
import '@/styles/globals.css';
import { dmSans, gildaDisplay } from './fonts';

/**
 * Site-wide metadata, computed per request so deployment flags apply without a rebuild:
 * `SITE_URL` resolves canonical/Open Graph URLs; without `SITE_INDEXABLE=true` every page answers
 * `noindex` (staging, local). The admin layout always keeps `noindex` and proxy.ts adds
 * `X-Robots-Tag` for /admin. Pages add canonical + Open Graph through `pageMetadata`.
 */
export function generateMetadata(): Metadata {
  return {
    metadataBase: siteUrl(),
    title: {
      default: 'Hotel Bambú Plaza',
      template: '%s · Hotel Bambú Plaza',
    },
    description: 'Hotel Bambú Plaza: habitaciones, ubicación y contacto directo.',
    robots: isIndexable() ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      type: 'website',
      locale: 'es_CO',
      siteName: 'Hotel Bambú Plaza',
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: { card: 'summary_large_image', images: [DEFAULT_OG_IMAGE.url] },
  };
}

export const viewport: Viewport = {
  themeColor: '#315c45',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="es-CO"
      data-scroll-behavior="smooth"
      className={`${dmSans.variable} ${gildaDisplay.variable}`}
    >
      <body className="min-h-dvh bg-background text-foreground">{children}</body>
    </html>
  );
}
