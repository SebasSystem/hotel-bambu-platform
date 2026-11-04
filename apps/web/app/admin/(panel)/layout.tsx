import type { ReactNode } from 'react';
import { AdminProvider } from '@/components/admin/admin-context';
import { AdminShell } from '@/components/admin/admin-shell';
import { serverApi } from '@/lib/api/server';
import type { SessionInfo } from '@/lib/api/types';

function mediaBaseUrl(): string {
  // Same variable as the API: public base of stored image variants.
  return (process.env.S3_PUBLIC_URL ?? 'http://localhost:9000/hotel-media').replace(/\/$/, '');
}

/** Authenticated area: GET /auth/me (cookie forwarded); 401 → /admin/login. */
export default async function PanelLayout({ children }: { children: ReactNode }) {
  const session = await serverApi.get<SessionInfo>('/auth/me');
  return (
    <AdminProvider session={session} mediaBaseUrl={mediaBaseUrl()}>
      <AdminShell>{children}</AdminShell>
    </AdminProvider>
  );
}
