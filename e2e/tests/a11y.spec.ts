import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { firstRoomPath, loginAsAdmin, rejectCookies } from '../support/pages';

const PAGES = [
  '/',
  '/habitaciones',
  'ROOM',
  '/galeria',
  '/ubicacion',
  '/informacion-para-huespedes',
  '/legal/cookies',
  '/admin/login',
];

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

type Violation = { id: string; impact?: string | null; nodes: { target: unknown[] }[] };

function summarize(violations: Violation[]) {
  return violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    nodes: v.nodes.length,
    target: v.nodes.slice(0, 3).map((n) => n.target.join(' ')),
  }));
}

const blocking = (summary: ReturnType<typeof summarize>) =>
  summary.filter((v) => v.impact === 'serious' || v.impact === 'critical');

/**
 * axe on key pages (requirements 18.3, 23.4): no serious or critical violations.
 * Audited with reduced motion: the scroll reveals start at opacity 0 below the fold, which axe
 * would otherwise report as low contrast. The final (visible) state is the same in both modes.
 */
test.describe('accessibility (axe)', () => {
  test.use({ reducedMotion: 'reduce' });

  for (const target of PAGES) {
    test(`axe: ${target} @mobile`, async ({ page }, testInfo) => {
      const path = target === 'ROOM' ? await firstRoomPath(page) : target;
      await page.goto(path);
      if (!path.startsWith('/admin')) await rejectCookies(page);
      const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      const summary = summarize(results.violations);
      console.log(`[axe] ${testInfo.project.name} ${path}: ${JSON.stringify(summary)}`);
      expect(blocking(summary)).toEqual([]);
    });
  }

  test('axe: every admin panel page @mobile', async ({ page }, testInfo) => {
    test.setTimeout(240_000);
    // One sign-in for all pages (the login is rate limited).
    await loginAsAdmin(page);
    await page.goto('/admin/room-types');
    const roomType = await page
      .locator('main a[href^="/admin/room-types/"]:not([href$="/new"])')
      .first()
      .getAttribute('href');
    const pages = [
      '/admin',
      '/admin/hotel',
      '/admin/nearby-places',
      '/admin/room-types',
      ...(roomType ? [roomType] : []),
      '/admin/room-types/new',
      '/admin/rooms',
      '/admin/amenities',
      '/admin/content',
      '/admin/hero-slides',
      '/admin/gallery',
      '/admin/media',
      '/admin/policies',
      '/admin/social',
      '/admin/account',
    ];
    const failures: Record<string, ReturnType<typeof summarize>> = {};
    for (const path of pages) {
      await page.goto(path);
      const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      const summary = summarize(results.violations);
      console.log(`[axe] ${testInfo.project.name} ${path}: ${JSON.stringify(summary)}`);
      if (blocking(summary).length > 0) failures[path] = blocking(summary);
    }
    expect(failures).toEqual({});
  });

  test('axe: consent banner and preferences dialog @mobile', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-consent-banner]')).toBeVisible();
    let results = await new AxeBuilder({ page })
      .withTags(TAGS)
      .include('[data-consent-banner]')
      .analyze();
    expect(blocking(summarize(results.violations))).toEqual([]);
    await page.getByRole('button', { name: 'Configurar preferencias' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    results = await new AxeBuilder({ page }).withTags(TAGS).include('.consent-dialog').analyze();
    expect(blocking(summarize(results.violations))).toEqual([]);
  });
});
