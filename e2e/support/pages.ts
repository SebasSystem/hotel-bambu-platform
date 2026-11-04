import type { Page } from '@playwright/test';

export const CONSENT_COOKIE = 'hb_consent';

/** Dismisses the cookie banner by rejecting non-essential cookies (the conservative default). */
export async function rejectCookies(page: Page): Promise<void> {
  const banner = page.locator('[data-consent-banner]');
  await banner.getByRole('button', { name: 'Rechazar no esenciales' }).click();
  await banner.waitFor({ state: 'detached' });
}

/** First published room slug, read from the rooms list. */
export async function firstRoomPath(page: Page): Promise<string> {
  await page.goto('/habitaciones');
  const href = await page.locator('main a[href^="/habitaciones/"]').first().getAttribute('href');
  if (!href) throw new Error('No published room link found on /habitaciones');
  return href;
}

/** Every JSON-LD block of the current page, parsed (throws on invalid JSON). */
export async function jsonLd(page: Page): Promise<Record<string, unknown>[]> {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocks.map((text) => JSON.parse(text) as Record<string, unknown>);
}
