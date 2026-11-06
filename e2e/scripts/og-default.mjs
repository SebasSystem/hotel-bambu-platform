#!/usr/bin/env node
/**
 * Regenerates the brand share image `apps/web/public/brand/og-default.png` (1200×630), the Open
 * Graph / Twitter fallback for pages without a hotel photo (D6). The card is HTML rendered by
 * Chromium on top of a running site, so it uses the site's own self-hosted brand fonts (Gilda
 * Display, DM Sans) and tokens; no design tool and no binary source file.
 *
 * Usage (web running on E2E_BASE_URL, default http://localhost:3000):
 *   pnpm --filter @hotel-bambu/e2e og-image
 * On a host without Playwright's Chromium, set CHROME_PATH to an installed Chrome or Edge.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const here = path.dirname(fileURLToPath(import.meta.url));
const baseUrl = (process.env.E2E_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const output = path.resolve(here, '../../apps/web/public/brand/og-default.png');

// Brand tokens (docs/design/tokens.json): green-900, green, sage, ivory, gold.
const card = `
<div id="og" style="position:fixed;inset:0;width:1200px;height:630px;box-sizing:border-box;
  padding:96px 104px;display:flex;flex-direction:column;justify-content:center;
  background:radial-gradient(circle at 85% 15%, #315c45 0%, #183b2c 55%, #10291e 100%);
  color:#f8f6f0;font-family:var(--font-dm-sans), sans-serif;z-index:2147483647">
  <div style="display:flex;align-items:center;gap:36px">
    <svg width="132" height="132" viewBox="0 0 64 64" aria-hidden="true">
      <rect x="27" y="9" width="11" height="47" rx="5.5" fill="#F8F6F0"/>
      <path d="M18 25c9 0 13-5 14-14-9 0-14 5-14 14Zm20 16c10-1 15-7 16-17-11 0-16 6-16 17ZM13 46c10 0 15-5 18-15-11 0-17 5-18 15Z" fill="#A8BEA0"/>
      <path d="M26 27h13M25 42h14" stroke="#183B2C" stroke-width="3" stroke-linecap="round"/>
    </svg>
    <div>
      <div style="font-size:26px;font-weight:700;letter-spacing:0.32em;color:#a8bea0">HOTEL</div>
      <div style="font-family:var(--font-gilda), serif;font-size:104px;line-height:1.02">Bambú Plaza</div>
    </div>
  </div>
  <div style="width:112px;height:4px;background:#c8a66a;margin:52px 0 34px;border-radius:2px"></div>
  <div style="font-size:36px;color:rgba(248,246,240,.88)">Hotel en Mocoa, Putumayo · Colombia</div>
</div>`;

const browser = await chromium.launch(
  process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {},
);
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.goto(`${baseUrl}/politicas-del-hotel`, { waitUntil: 'networkidle' });
  await page.evaluate((html) => {
    document.body.insertAdjacentHTML('beforeend', html);
  }, card);
  // Wait for the brand fonts used by the card, not just any font.
  await page.evaluate(async () => {
    await document.fonts.ready;
    const root = getComputedStyle(document.documentElement);
    for (const name of ['--font-gilda', '--font-dm-sans']) {
      await document.fonts.load(`40px ${root.getPropertyValue(name)}`, 'Bambú');
    }
  });
  await page.locator('#og').screenshot({ path: output, animations: 'disabled' });
  console.log(`[og-image] ${path.relative(process.cwd(), output)}`);
} finally {
  await browser.close();
}
