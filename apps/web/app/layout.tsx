import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import '@/styles/globals.css';
import { fraunces, manrope } from './fonts';

// Public pages are indexable (Phase 3). The admin layout keeps `noindex` and proxy.ts adds
// `X-Robots-Tag` for /admin. Canonical URLs, sitemap, robots.txt and JSON-LD arrive in T7.
export const metadata: Metadata = {
  title: {
    default: 'Hotel Bambú Plaza',
    template: '%s · Hotel Bambú Plaza',
  },
  description: 'Hotel Bambú Plaza: habitaciones, servicios, ubicación y contacto por WhatsApp.',
};

export const viewport: Viewport = {
  themeColor: '#1D6247',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="es-CO" className={`${fraunces.variable} ${manrope.variable}`}>
      <body className="min-h-dvh bg-background text-foreground">{children}</body>
    </html>
  );
}
