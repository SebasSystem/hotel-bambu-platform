import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import '@/styles/globals.css';
import { fraunces, manrope } from './fonts';

export const metadata: Metadata = {
  title: {
    default: 'Hotel Bambú Plaza',
    template: '%s · Hotel Bambú Plaza',
  },
  description: 'Hotel Bambú Plaza. Sitio web en construcción.',
  // Placeholder site: keep it out of search engines until Phase 3/4 (requirement 24).
  robots: { index: false, follow: false },
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
