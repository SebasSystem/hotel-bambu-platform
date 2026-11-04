import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { proxy } from '@/proxy';

function request(path: string, cookie?: string) {
  return new NextRequest(new URL(path, 'http://localhost:3000'), {
    headers: cookie ? { cookie } : {},
  });
}

describe('admin proxy', () => {
  it('redirects to the login page without a session cookie, keeping the destination', () => {
    const response = proxy(request('/admin/rooms?x=1'));
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/admin/login?next=%2Fadmin%2Frooms%3Fx%3D1',
    );
  });

  it('lets the login page and authenticated requests through with noindex/no-store', () => {
    for (const res of [
      proxy(request('/admin/login')),
      proxy(request('/admin', 'hb_session=abc')),
    ]) {
      expect(res.headers.get('location')).toBeNull();
      expect(res.headers.get('x-robots-tag')).toBe('noindex, nofollow');
      expect(res.headers.get('cache-control')).toBe('private, no-store');
    }
    expect(proxy(request('/admin', '__Host-hb_session=abc')).headers.get('location')).toBeNull();
  });
});
