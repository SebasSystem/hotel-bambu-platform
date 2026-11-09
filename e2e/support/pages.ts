import { expect, type Page } from '@playwright/test';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from './api';

export const CONSENT_COOKIE = 'hb_consent';

/** Dismisses the cookie banner by rejecting non-essential cookies (the conservative default). */
export async function rejectCookies(page: Page): Promise<void> {
  const banner = page.locator('[data-consent-banner]');
  await banner.getByRole('button', { name: 'Rechazar no esenciales' }).click();
  await banner.waitFor({ state: 'detached' });
}

/** First published room type page, read from the rooms list (ADR 0016). */
export async function firstRoomPath(page: Page): Promise<string> {
  await page.goto('/habitaciones');
  const href = await page.locator('main a[href^="/habitaciones/"]').first().getAttribute('href');
  if (!href) throw new Error('No published room link found on /habitaciones');
  return href;
}

/** Every JSON-LD block of the current page, parsed (throws on invalid JSON). */
/** Every JSON-LD node of the page; `@graph` blocks are flattened into their nodes. */
export async function jsonLd(page: Page): Promise<Record<string, unknown>[]> {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocks.flatMap((text) => {
    const block = JSON.parse(text) as Record<string, unknown>;
    const graph = block['@graph'];
    return Array.isArray(graph) ? (graph as Record<string, unknown>[]) : [block];
  });
}

/**
 * Signs in through the login form and waits for the dashboard (counts against the login limit).
 * Defaults to the seeded administrator; pass other credentials to sign in with another role.
 */
export async function loginAsAdmin(
  page: Page,
  credentials: { email: string; password: string } = {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  },
): Promise<void> {
  await page.goto('/admin/login');
  await page.getByLabel('Correo electrónico').fill(credentials.email);
  await page.locator('input[name="password"]').fill(credentials.password);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL(/\/admin\/?$/);
}
