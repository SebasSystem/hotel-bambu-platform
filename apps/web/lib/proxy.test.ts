import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { buildCsp, proxy } from '@/proxy';

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

describe('security headers', () => {
  it('sends a nonce-based CSP on public pages and passes the nonce to rendering', () => {
    const res = proxy(request('/habitaciones'));
    const csp = res.headers.get('content-security-policy') ?? '';
    const nonce = /'nonce-([^']+)'/.exec(csp)?.[1];
    expect(nonce).toBeTruthy();
    expect(csp).toContain(`script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`);
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain('frame-src https://www.google.com');
    // Next.js reads the nonce from the forwarded request CSP header.
    expect(res.headers.get('x-middleware-request-content-security-policy')).toBe(csp);
    expect(res.headers.get('location')).toBeNull();
  });

  it('uses a fresh nonce per request', () => {
    const a = proxy(request('/')).headers.get('content-security-policy');
    const b = proxy(request('/')).headers.get('content-security-policy');
    expect(a).not.toBe(b);
  });

  it('keeps the admin guard and adds the CSP to admin pages too', () => {
    const res = proxy(request('/admin/login'));
    expect(res.headers.get('content-security-policy')).toContain("default-src 'self'");
    expect(res.headers.get('cache-control')).toBe('private, no-store');
  });
});

describe('buildCsp', () => {
  it('allows images from the media origin only and no eval in production', () => {
    const csp = buildCsp({
      nonce: 'abc',
      mediaUrl: 'https://media.example.com/hotel-media',
      dev: false,
      https: true,
    });
    expect(csp).toContain("img-src 'self' data: blob: https://media.example.com");
    expect(csp).not.toContain('unsafe-eval');
    expect(csp).toContain('upgrade-insecure-requests');
  });

  it('allows eval and HMR websockets in development only', () => {
    const csp = buildCsp({
      nonce: 'abc',
      mediaUrl: 'http://localhost:9000/x',
      dev: true,
      https: false,
    });
    expect(csp).toContain("'unsafe-eval'");
    expect(csp).toContain('connect-src');
    expect(csp).not.toContain('upgrade-insecure-requests');
  });
});
