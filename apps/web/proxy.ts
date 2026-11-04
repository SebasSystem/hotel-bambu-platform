import { NextResponse, type NextRequest } from 'next/server';

/** Session cookie names (ADR 0008): `__Host-` prefix when Secure (production), plain in dev. */
export const SESSION_COOKIES = ['__Host-hb_session', 'hb_session'] as const;

export function hasSessionCookie(request: Pick<NextRequest, 'cookies'>): boolean {
  return SESSION_COOKIES.some((name) => Boolean(request.cookies.get(name)?.value));
}

function originOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/**
 * Content-Security-Policy (requirement 16.6, Next.js 16 nonce guide). Scripts need the
 * per-request nonce (`'strict-dynamic'` lets Next.js chunks loaded by them run; GSAP is
 * bundled). Styles allow `'unsafe-inline'` because React `style` attributes (image placeholders,
 * motion indices) cannot carry a nonce; style injection is far less dangerous than script.
 * Images: self, data/blob (blur placeholders) and the media bucket/CDN origin (`S3_PUBLIC_URL`).
 * Frames: Google Maps only. Nobody may frame the site.
 */
export function buildCsp(input: {
  nonce: string;
  mediaUrl: string | undefined;
  dev: boolean;
  https: boolean;
}): string {
  const media = originOf(input.mediaUrl);
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${input.nonce}' 'strict-dynamic'${input.dev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob:${media ? ` ${media}` : ''}`,
    "font-src 'self'",
    `connect-src 'self'${input.dev ? ' ws: wss:' : ''}`,
    'frame-src https://www.google.com https://maps.google.com',
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "manifest-src 'self'",
  ];
  if (input.https) directives.push('upgrade-insecure-requests');
  return directives.join('; ');
}

function contentSecurityPolicy(nonce: string): string {
  return buildCsp({
    nonce,
    mediaUrl: process.env.S3_PUBLIC_URL ?? 'http://localhost:9000/hotel-media',
    dev: process.env.NODE_ENV === 'development',
    https: (process.env.SITE_URL ?? '').startsWith('https://'),
  });
}

/** Passes the CSP to rendering (Next.js extracts the nonce from it) and to the browser. */
function withCsp(request: NextRequest, csp: string, nonce: string): NextResponse {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

/**
 * Next.js 16 "proxy" (formerly middleware):
 * - Every page gets a fresh CSP nonce. Pages are rendered per request (public data uses
 *   `connection()`, the admin is `force-dynamic`), which nonces require.
 * - Optimistic guard for /admin: without a session cookie, go to the login page. The real check
 *   is server-side in the API (every admin endpoint validates the session; the admin layout
 *   redirects on 401). Admin responses are `private, no-store` and `noindex`.
 * The static headers (HSTS, nosniff, Referrer-Policy, Permissions-Policy) live in next.config.ts.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/');
  const isLogin = pathname === '/admin/login' || pathname.startsWith('/admin/login/');
  if (isAdmin && !isLogin && !hasSessionCookie(request)) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    url.search = '';
    if (pathname !== '/admin') url.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const response = withCsp(request, contentSecurityPolicy(nonce), nonce);
  if (isAdmin) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    response.headers.set('Cache-Control', 'private, no-store');
  }
  return response;
}

export const config = {
  matcher: [
    // The admin guard runs on every admin request, prefetches included.
    '/admin',
    '/admin/:path*',
    // Documents only: skip API rewrites, build assets, metadata files and prefetches.
    {
      source:
        '/((?!api/|_next/static|_next/image|favicon.ico|icon.svg|brand/|robots.txt|sitemap.xml).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
