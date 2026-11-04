import path from 'node:path';
import { loadEnvConfig } from '@next/env';
import type { NextConfig } from 'next';

// Load the monorepo root .env (apps/web/.env* still take precedence when present).
// Next compiles this file to CommonJS, so resolve from the package cwd, not import.meta.
loadEnvConfig(path.resolve(process.cwd(), '../..'));

const apiInternalUrl = (process.env.API_INTERNAL_URL ?? 'http://localhost:4000').replace(/\/$/, '');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    // Same-origin proxy (requirement 12.4): the browser only talks to Next.js.
    // Array form = afterFiles, so Next.js route handlers such as /api/revalidate win.
    return [{ source: '/api/v1/:path*', destination: `${apiInternalUrl}/api/v1/:path*` }];
  },
};

export default nextConfig;
