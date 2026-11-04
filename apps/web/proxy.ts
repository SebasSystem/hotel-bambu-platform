import { NextResponse, type NextRequest } from 'next/server';

/** Session cookie names (ADR 0008): `__Host-` prefix when Secure (production), plain in dev. */
export const SESSION_COOKIES = ['__Host-hb_session', 'hb_session'] as const;

export function hasSessionCookie(request: Pick<NextRequest, 'cookies'>): boolean {
  return SESSION_COOKIES.some((name) => Boolean(request.cookies.get(name)?.value));
}

/**
 * Optimistic guard for /admin (Next.js 16 "proxy", formerly middleware): without a session
 * cookie, go to the login page. The real check is server-side in the API (every admin endpoint
 * validates the session; the admin layout redirects on 401).
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isLogin = pathname === '/admin/login' || pathname.startsWith('/admin/login/');
  if (!isLogin && !hasSessionCookie(request)) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    url.search = '';
    if (pathname !== '/admin') url.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(url);
  }
  const response = NextResponse.next();
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
