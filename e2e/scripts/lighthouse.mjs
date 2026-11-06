#!/usr/bin/env node
/**
 * Lighthouse CI against a running production build (requirement 20.2). Budgets live in the root
 * `lighthouserc.json`; this script only adds the URLs (the six public page kinds of D6, with the
 * first published room type read from the public API) and a browser: `CHROME_PATH` (a host
 * Chrome or Edge) when set, else Playwright's Chromium. Reports go to e2e/test-results/lighthouse.
 *
 * Usage (inside the Playwright image, see README): pnpm --filter @hotel-bambu/e2e lighthouse
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const here = path.dirname(fileURLToPath(import.meta.url));
const baseUrl = (process.env.E2E_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const workDir = path.resolve(here, '../test-results');
mkdirSync(workDir, { recursive: true });

const response = await fetch(`${baseUrl}/api/v1/public/room-types`);
if (!response.ok) throw new Error(`Public API unavailable: ${response.status}`);
const types = await response.json();
const paths = ['/', '/habitaciones', '/galeria', '/ubicacion', '/politicas-del-hotel'];
if (types[0]?.slug) paths.splice(2, 0, `/habitaciones/${types[0].slug}`);
const urls = paths.map((path) => `${baseUrl}${path}`);
const chromePath = process.env.CHROME_PATH || chromium.executablePath();

const lhci = path.resolve(here, '../node_modules/.bin/lhci');
const args = [
  'autorun',
  `--config=${path.resolve(here, '../../lighthouserc.json')}`,
  ...urls.map((url) => `--collect.url=${url}`),
  `--collect.chromePath=${chromePath}`,
];
console.log(`[lighthouse] ${urls.join(' ')}`);
// The lhci healthcheck looks for Chrome through CHROME_PATH.
const result = spawnSync(lhci, args, {
  cwd: workDir,
  stdio: 'inherit',
  env: { ...process.env, CHROME_PATH: chromePath },
});
process.exit(result.status ?? 1);
