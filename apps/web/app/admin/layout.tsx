import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@/styles/admin.css';

export const metadata: Metadata = {
  title: { default: 'Panel', template: '%s · Panel Hotel Bambú Plaza' },
  robots: { index: false, follow: false, nocache: true },
};

// Private, per-request pages: never prerendered or cached (requirement 12.3).
export const dynamic = 'force-dynamic';

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return children;
}
