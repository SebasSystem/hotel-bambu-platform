#!/usr/bin/env node
/**
 * Lighthouse CI against a running production build (requirement 20.2). Budgets live in the root
 * `lighthouserc.json`; this script only adds the URLs (home + the first published room, read
 * from the public API) and Playwright's Chromium. Reports go to e2e/test-results/lighthouse.
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

const response = await fetch(`${baseUrl}/api/v1/public/rooms`);
if (!response.ok) throw new Error(`Public API unavailable: ${response.status}`);
const rooms = await response.json();
const urls = [`${baseUrl}/`];
if (rooms[0]?.slug) urls.push(`${baseUrl}/habitaciones/${rooms[0].slug}`);

const lhci = path.resolve(here, '../node_modules/.bin/lhci');
const args = [
  'autorun',
  `--config=${path.resolve(here, '../../lighthouserc.json')}`,
  ...urls.map((url) => `--collect.url=${url}`),
  `--collect.chromePath=${chromium.executablePath()}`,
];
console.log(`[lighthouse] ${urls.join(' ')}`);
// The lhci healthcheck looks for Chrome through CHROME_PATH.
const result = spawnSync(lhci, args, {
  cwd: workDir,
  stdio: 'inherit',
  env: { ...process.env, CHROME_PATH: chromium.executablePath() },
});
process.exit(result.status ?? 1);
