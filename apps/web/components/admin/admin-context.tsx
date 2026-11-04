'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { SessionInfo } from '@/lib/api/types';
import { setCsrfToken } from '@/lib/api/browser';
import { thumbnailUrl } from '@/lib/media/thumbnail';
import { FeedbackProvider } from './feedback';

interface AdminContextValue {
  user: SessionInfo['user'];
  /** Public base URL of stored media variants (S3_PUBLIC_URL). */
  mediaBaseUrl: string;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function useAdmin(): AdminContextValue {
  const context = useContext(AdminContext);
  if (!context) throw new Error('useAdmin must be used inside <AdminProvider>');
  return context;
}

export function useThumbnail(variants: unknown, minWidth?: number): string | null {
  const { mediaBaseUrl } = useAdmin();
  return thumbnailUrl(variants, mediaBaseUrl, minWidth);
}

export function AdminProvider({
  session,
  mediaBaseUrl,
  children,
}: {
  session: SessionInfo;
  mediaBaseUrl: string;
  children: ReactNode;
}) {
  // The token from GET /auth/me is the source of truth for x-csrf-token (ADR 0008). Setting it
  // during render (idempotent) makes it available before any child effect or handler runs.
  setCsrfToken(session.csrfToken);

  const value = useMemo(() => ({ user: session.user, mediaBaseUrl }), [session.user, mediaBaseUrl]);
  return (
    <AdminContext.Provider value={value}>
      <FeedbackProvider>{children}</FeedbackProvider>
    </AdminContext.Provider>
  );
}
