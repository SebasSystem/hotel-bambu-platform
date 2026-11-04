import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createApiClient } from './client';

function apiInternalUrl(): string {
  return (process.env.API_INTERNAL_URL ?? 'http://localhost:4000').replace(/\/$/, '');
}

/**
 * Server Components client: calls `API_INTERNAL_URL` directly and forwards the incoming cookie
 * (requirement 12.4). A 401 redirects to the login page. Read-only use: mutations go through the
 * browser client so the API sees the browser Origin and the CSRF header.
 */
export const serverApi = createApiClient({
  baseUrl: `${apiInternalUrl()}/api/v1`,
  headers: async (): Promise<Record<string, string>> => {
    const cookie = (await headers()).get('cookie');
    return cookie ? { cookie } : {};
  },
  onUnauthorized: () => redirect('/admin/login'),
});
