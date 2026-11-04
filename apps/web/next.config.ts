import path from 'node:path';
import { loadEnvConfig } from '@next/env';
import type { NextConfig } from 'next';

// Load the monorepo root .env (apps/web/.env* still take precedence when present).
// Next compiles this file to CommonJS, so resolve from the package cwd, not import.meta.
loadEnvConfig(path.resolve(process.cwd(), '../..'));

const apiInternalUrl = (process.env.API_INTERNAL_URL ?? 'http://localhost:4000').replace(/\/$/, '');

/**
 * Static security headers for every response (requirement 16.6). The per-request CSP (nonce) is
 * set in proxy.ts. HSTS only for production builds: browsers ignore it over plain http, and the
 * reverse proxy / Cloudflare must serve HTTPS (see docs/security.md).
 */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  {
    key: 'Permissions-Policy',
    value:
      'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), browsing-topics=()',
  },
  ...(process.env.NODE_ENV === 'production'
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }]
    : []),
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  async rewrites() {
    // Same-origin proxy (requirement 12.4): the browser only talks to Next.js.
    // Array form = afterFiles, so Next.js route handlers such as /api/revalidate win.
    return [{ source: '/api/v1/:path*', destination: `${apiInternalUrl}/api/v1/:path*` }];
  },
};

export default nextConfig;
